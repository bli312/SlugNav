import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, beforeEach, after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const migration = () =>
  readFile(
    new URL(
      "../../supabase/migrations/20261124000000_notification_preferences.sql",
      import.meta.url,
    ),
    "utf8",
  );
const rollback = () =>
  readFile(
    new URL(
      "../../supabase/rollbacks/20261124000000_notification_preferences.rollback.sql",
      import.meta.url,
    ),
    "utf8",
  );
async function asUser(id) {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    create table public.unrelated (value text); insert into unrelated values ('keep');`);
  await db.exec(await migration());
});
beforeEach(async () => {
  await db.exec(
    `reset role; truncate auth.users cascade; insert into auth.users values ('${alice}'), ('${bob}');`,
  );
  await asUser(alice);
});
after(() => db.close());

test("US-4.2-T-1 AC3: owners can insert, read and update only their own preferences", async () => {
  await db.query("insert into notification_preferences (user_id) values ($1)", [
    alice,
  ]);
  await db.query(
    "update notification_preferences set enabled=true, minutes_before=45 where user_id=$1",
    [alice],
  );
  assert.deepEqual(
    (
      await db.query(
        "select enabled, minutes_before::text from notification_preferences",
      )
    ).rows,
    [{ enabled: true, minutes_before: "45" }],
  );
  await asUser(bob);
  assert.deepEqual(
    (await db.query("select * from notification_preferences")).rows,
    [],
  );
  assert.deepEqual(
    (
      await db.query(
        "update notification_preferences set enabled=false returning *",
      )
    ).rows,
    [],
  );
  await assert.rejects(
    db.query("insert into notification_preferences (user_id) values ($1)", [
      alice,
    ]),
    { code: "42501" },
  );
  await db.query("insert into notification_preferences (user_id) values ($1)", [
    bob,
  ]);
  await assert.rejects(
    db.query(
      "update notification_preferences set user_id=$1 where user_id=$2",
      [alice, bob],
    ),
    { code: "42501" },
  );
  await asUser(alice);
  assert.equal(
    (await db.query("select enabled from notification_preferences")).rows[0]
      .enabled,
    true,
  );
});

test("US-4.2-T-1 AC3: anonymous users cannot read or write preferences", async () => {
  await db.exec("reset role; set role anon;");
  for (const sql of [
    "select * from notification_preferences",
    `insert into notification_preferences (user_id) values ('${alice}')`,
    "update notification_preferences set enabled=true",
  ]) {
    await assert.rejects(db.exec(sql), { code: "42501" });
  }
});

test("US-4.2-T-1 AC18: defaults, constraints, uniqueness and account deletion are enforced", async () => {
  await db.query("insert into notification_preferences (user_id) values ($1)", [
    alice,
  ]);
  assert.deepEqual(
    (
      await db.query(
        "select enabled, minutes_before::text from notification_preferences",
      )
    ).rows,
    [{ enabled: false, minutes_before: "30" }],
  );
  await assert.rejects(
    db.query("insert into notification_preferences (user_id) values ($1)", [
      alice,
    ]),
    { code: "23505" },
  );
  for (const value of ["0", "-1", "9007199254740992", null]) {
    await assert.rejects(
      db.query("update notification_preferences set minutes_before=$1", [
        value,
      ]),
    );
  }
  await assert.rejects(
    db.exec("update notification_preferences set enabled=null"),
    { code: "23502" },
  );
  for (const value of ["1", "9007199254740991"])
    await db.query("update notification_preferences set minutes_before=$1", [
      value,
    ]);
  await db.exec("reset role;");
  await assert.rejects(
    db.query(
      "insert into notification_preferences(user_id) values ('00000000-0000-4000-8000-000000000099')",
    ),
    { code: "23503" },
  );
  await db.query("delete from auth.users where id=$1", [alice]);
  assert.deepEqual(
    (await db.query("select * from notification_preferences")).rows,
    [],
  );
});

test("US-4.2-T-1 AC18: rollback preserves other tables and migration can be reapplied", async () => {
  await db.exec("reset role;");
  await db.exec(await rollback());
  assert.equal(
    (
      await db.query(
        "select to_regclass('public.notification_preferences') as name",
      )
    ).rows[0].name,
    null,
  );
  assert.deepEqual((await db.query("select * from unrelated")).rows, [
    { value: "keep" },
  ]);
  await db.exec(await migration());
  await asUser(alice);
  await db.query("insert into notification_preferences (user_id) values ($1)", [
    alice,
  ]);
  assert.equal(
    (
      await db.query(
        "select count(*)::int as count from notification_preferences",
      )
    ).rows[0].count,
    1,
  );
});
