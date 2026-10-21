import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL/PLpgSQL in memory. No Docker, hosted project, or credentials.
const db = new PGlite();

before(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role supabase_auth_admin;
  `);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261016000000_ucsc_google_auth.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
after(async () => {
  await db.close();
});

async function signup(email = "student@ucsc.edu", provider = "google") {
  await db.exec("set role supabase_auth_admin");
  const { rows } = await db.query(
    "select public.before_ucsc_user_created($1::jsonb) as result",
    [
      JSON.stringify({
        user: {
          email,
          app_metadata: { provider },
          user_metadata: {
            email_verified: true,
            custom_claims: { hd: "ucsc.edu" },
          },
          is_anonymous: false,
        },
      }),
    ],
  );
  return rows[0].result;
}

test("signup hook allows the UCSC Google provider", async () =>
  assert.deepEqual(await signup(), {}));
for (const email of [
  "student@gmail.com",
  "student@ucsc.edu.evil.com",
  "student@dept.ucsc.edu",
  "student@@ucsc.edu",
  "@ucsc.edu",
  "",
  null,
]) {
  test(`signup hook blocks ${JSON.stringify(email)}`, async () =>
    assert.equal((await signup(email)).error.http_code, 403));
}
test("signup hook blocks email/password even with a UCSC address", async () =>
  assert.equal(
    (await signup("student@ucsc.edu", "email")).error.http_code,
    403,
  ));

for (const role of ["anon", "authenticated"]) {
  test(`${role} cannot call the signup hook through the Data API`, async () => {
    await db.exec(`set role ${role}`);
    await assert.rejects(
      db.query("select public.before_ucsc_user_created('{}'::jsonb)"),
      (error) => error.code === "42501",
    );
  });
}
