import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";

import {
  createOAuthCallbackHandler,
  parseOAuthCallback,
  requireS256Challenge,
} from "../../src/lib/oauth.ts";

const redirect = "slugnav://auth/callback";
const hash = async (value) =>
  createHash("sha256").update(value).digest("base64");

test("accepts the configured native and web callbacks", () => {
  assert.equal(parseOAuthCallback(`${redirect}?code=one`, redirect), "one");
  assert.equal(
    parseOAuthCallback(
      "http://localhost:8081/auth/callback?code=one",
      "http://localhost:8081/auth/callback",
    ),
    "one",
  );
});

for (const callback of [
  "evil://auth/callback?code=one",
  "slugnav://evil/callback?code=one",
  "slugnav://auth/other?code=one",
  "slugnav://user:pass@auth/callback?code=one",
  `${redirect}?code=one&code=two`,
  `${redirect}?code=`,
  `${redirect}#access_token=token`,
]) {
  test(`rejects invalid callback ${callback}`, () =>
    assert.throws(() => parseOAuthCallback(callback, redirect)));
}

test("propagates OAuth denials from query strings or fragments before exchanging a code", () => {
  for (const marker of ["?", "#"]) {
    assert.throws(
      () =>
        parseOAuthCallback(
          `${redirect}${marker}error=access_denied&error_description=UCSC%20only&code=unused`,
          redirect,
        ),
      /UCSC only/,
    );
  }
});

test("exchanges duplicate native/route callbacks once, including differently ordered query strings", async () => {
  let exchanges = 0;
  const complete = createOAuthCallbackHandler(redirect, async () => {
    exchanges++;
  });
  const first = complete(`${redirect}?code=one&state=example`);
  const replay = complete(`${redirect}?state=example&code=one`);
  assert.equal(first, replay);
  await Promise.all([first, replay]);
  assert.equal(exchanges, 1);
  await complete(`${redirect}?code=two`);
  assert.equal(exchanges, 2);
});

test("invalid callbacks never reach the exchange; failed codes are not consumed repeatedly", async () => {
  let exchanges = 0;
  const complete = createOAuthCallbackHandler(redirect, async () => {
    exchanges++;
    throw new Error("expired code");
  });
  await assert.rejects(complete("evil://auth/callback?code=one"), /Unexpected/);
  assert.equal(exchanges, 0);
  await assert.rejects(complete(`${redirect}?code=one`), /expired code/);
  await assert.rejects(complete(`${redirect}?code=one`), /expired code/);
  assert.equal(exchanges, 1);
});

test("S256 adapter matches the RFC 7636 example", async () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const url = new URL(
    await requireS256Challenge(
      `https://example.supabase.co/auth/v1/authorize?provider=google&code_challenge_method=plain&code_challenge=${verifier}`,
      hash,
    ),
  );
  assert.equal(url.searchParams.get("code_challenge_method"), "s256");
  assert.equal(
    url.searchParams.get("code_challenge"),
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
  assert.equal(url.searchParams.get("provider"), "google");
});

test("does not downgrade existing S256 requests or accept a missing challenge", async () => {
  const source =
    "https://example.supabase.co/auth/v1/authorize?code_challenge_method=s256&code_challenge=existing";
  assert.equal(
    await requireS256Challenge(source, async () => {
      throw new Error("unnecessary hash");
    }),
    source,
  );
  await assert.rejects(
    requireS256Challenge("https://example.supabase.co/auth/v1/authorize", hash),
    /Secure sign-in/,
  );
});

test("real Supabase SDK exchanges its persisted native verifier after S256 adaptation", async () => {
  const previousCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  // Match Hermes: secure random values are available, SubtleCrypto is not.
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    },
  });
  try {
    let expectedChallenge;
    let exchanged = false;
    const client = createClient(
      "https://example.supabase.co",
      "sb_publishable_test",
      {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: async (input, options) => {
            const url = new URL(input);
            assert.equal(url.pathname, "/auth/v1/token");
            assert.equal(url.searchParams.get("grant_type"), "pkce");
            const body = JSON.parse(options.body);
            assert.equal(body.auth_code, "returned-code");
            assert.equal(
              createHash("sha256")
                .update(body.code_verifier)
                .digest("base64url"),
              expectedChallenge,
            );
            exchanged = true;
            const encode = (value) =>
              Buffer.from(JSON.stringify(value)).toString("base64url");
            return Response.json({
              access_token: `${encode({ alg: "HS256" })}.${encode({ sub: "student-id", exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`,
              refresh_token: "test-refresh",
              token_type: "bearer",
              expires_in: 3600,
              user: {
                id: "student-id",
                aud: "authenticated",
                email: "student@ucsc.edu",
                app_metadata: {},
                user_metadata: {},
                created_at: "2026-10-16T00:00:00Z",
              },
            });
          },
        },
      },
    );
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect, skipBrowserRedirect: true },
    });
    assert.equal(error, null);
    const url = new URL(await requireS256Challenge(data.url, hash));
    expectedChallenge = url.searchParams.get("code_challenge");
    assert.equal(url.searchParams.get("code_challenge_method"), "s256");
    const result = await client.auth.exchangeCodeForSession("returned-code");
    assert.equal(result.error, null);
    assert.equal(result.data.user.id, "student-id");
    assert.equal(exchanged, true);
    await client.auth.stopAutoRefresh();
  } finally {
    if (previousCrypto)
      Object.defineProperty(globalThis, "crypto", previousCrypto);
    else delete globalThis.crypto;
  }
});
