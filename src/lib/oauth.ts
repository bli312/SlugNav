export const NATIVE_AUTH_CALLBACK = "slugnav://auth/callback";
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function parseOAuthCallback(callback: string, redirectTo: string) {
  const url = new URL(callback);
  const expected = new URL(redirectTo);

  if (
    url.protocol !== expected.protocol ||
    url.host !== expected.host ||
    url.pathname !== expected.pathname ||
    url.username ||
    url.password
  ) {
    throw new Error("Unexpected sign-in redirect. Please start sign-in again.");
  }

  const fragment = new URLSearchParams(url.hash.slice(1));
  const error = url.searchParams.get("error") ?? fragment.get("error");
  if (error) {
    // Display as text, never HTML. Supabase propagates the domain-hook message here.
    throw new Error(
      url.searchParams.get("error_description") ??
        fragment.get("error_description") ??
        "Google sign-in was not completed. Please try again.",
    );
  }

  const code = url.searchParams.get("code");
  if (!code || url.searchParams.getAll("code").length !== 1) {
    throw new Error(
      "The sign-in link is missing its code. Please start sign-in again.",
    );
  }

  return code;
}

/** Exchange each code once, even if the browser and router deliver it together. */
export function createOAuthCallbackHandler(
  redirectTo: string,
  exchange: (code: string) => Promise<void>,
) {
  let last: { code: string; result: Promise<void> } | undefined;
  return (url: string): Promise<void> => {
    try {
      const code = parseOAuthCallback(url, redirectTo);
      if (last?.code === code) return last.result;
      const result = Promise.resolve().then(() => exchange(code));
      last = { code, result };
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

/** S256 compatibility for Hermes, which lacks the SubtleCrypto used by auth-js. */
export async function requireS256Challenge(
  authorizeUrl: string,
  sha256Base64: (value: string) => Promise<string>,
): Promise<string> {
  const url = new URL(authorizeUrl);
  if (url.searchParams.get("code_challenge_method") === "plain") {
    const verifier = url.searchParams.get("code_challenge");
    if (!verifier)
      throw new Error("Could not start secure sign-in. Please try again.");
    const hash = await sha256Base64(verifier);
    url.searchParams.set(
      "code_challenge",
      hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    );
    url.searchParams.set("code_challenge_method", "s256");
  }
  if (
    url.searchParams.get("code_challenge_method") !== "s256" ||
    !url.searchParams.get("code_challenge")
  ) {
    throw new Error(
      "Secure sign-in is unavailable in this browser. Use HTTPS or localhost.",
    );
  }
  return url.href;
}
