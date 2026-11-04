import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";

const asUser = async (id) => {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
};

before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
  `);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261103000000_places.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261104000000_place_feedback.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});

beforeEach(async () => {
  await db.exec(`
    reset role;
    truncate auth.users, public.places, public.place_votes, public.place_comments, public.place_reports restart identity cascade;
    insert into auth.users values ('${alice}'), ('${bob}');
  `);
  await asUser(alice);
  await db.query(
    "insert into public.places (name, type, latitude, longitude) values ('Thimann 001', 'classroom', 37.0, -122.06)",
  );
});

after(() => db.close());

test("voting persists, is public to students, and allows updates to existing votes", async () => {
  // Alice votes 'many' for outlets
  await db.query(
    "insert into public.place_votes (place_id, option_key, choice) values (1, 'outlets', 'many')",
  );

  // Bob can see Alice's vote
  await asUser(bob);
  const { rows: bobSees } = await db.query(
    "select place_id, option_key, choice, user_id from public.place_votes where place_id = 1",
  );
  assert.equal(bobSees.length, 1);
  assert.equal(bobSees[0].choice, "many");
  assert.equal(bobSees[0].user_id, alice);

  // Alice updates her vote to 'few'
  await asUser(alice);
  await db.query(
    "update public.place_votes set choice = 'few' where place_id = 1 and option_key = 'outlets'",
  );
  const { rows: updated } = await db.query(
    "select choice from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  assert.equal(updated[0].choice, "few");

  // Upsert on conflict updates vote
  await db.query(`
    insert into public.place_votes (place_id, option_key, choice, updated_at)
    values (1, 'outlets', 'none', now())
    on conflict (place_id, user_id, option_key)
    do update set choice = excluded.choice, updated_at = excluded.updated_at
  `);
  const { rows: upserted } = await db.query(
    "select choice from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  assert.equal(upserted[0].choice, "none");

  // Duplicate insert for same user, place, option fails
  await assert.rejects(
    db.query(
      "insert into public.place_votes (place_id, option_key, choice) values (1, 'outlets', 'none')",
    ),
    (err) => err.code === "23505",
  );

  // Bob cannot delete Alice's vote
  await asUser(bob);
  await db.query(
    "delete from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  const { rows: stillThere } = await db.query(
    "select choice from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  assert.equal(stillThere.length, 1);

  // Alice deletes her own vote (unlike)
  await asUser(alice);
  await db.query(
    "delete from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  const { rows: afterDelete } = await db.query(
    "select choice from public.place_votes where place_id = 1 and option_key = 'outlets'",
  );
  assert.equal(afterDelete.length, 0);
});

test("comments persist, are readable by all students, and only owner can delete", async () => {
  await db.query(
    "insert into public.place_comments (place_id, content) values (1, 'Great outlets near the back')",
  );

  // Bob reads the comment
  await asUser(bob);
  const { rows } = await db.query(
    "select place_id, user_id, content from public.place_comments where place_id = 1",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].content, "Great outlets near the back");
  assert.equal(rows[0].user_id, alice);

  // Bob cannot delete Alice's comment
  await db.query("delete from public.place_comments where place_id = 1");
  const { rows: stillThere } = await db.query(
    "select count(*) as count from public.place_comments",
  );
  assert.equal(Number(stillThere[0].count), 1);

  // Alice can delete her own comment
  await asUser(alice);
  await db.query("delete from public.place_comments where place_id = 1");
  const { rows: afterDelete } = await db.query(
    "select count(*) as count from public.place_comments",
  );
  assert.equal(Number(afterDelete[0].count), 0);
});

test("comment constraints reject blank text or overly long comments", async () => {
  await assert.rejects(
    db.query(
      "insert into public.place_comments (place_id, content) values (1, '   ')",
    ),
    (err) => err.code === "23514",
  );

  await assert.rejects(
    db.query(
      "insert into public.place_comments (place_id, content) values (1, $1)",
      ["a".repeat(501)],
    ),
    (err) => err.code === "23514",
  );
});

test("reports persist with valid reason and enforce one report per user per place", async () => {
  await db.query(
    "insert into public.place_reports (place_id, reason, details) values (1, 'inaccurate', 'Wrong room number')",
  );

  // Alice can see her report
  const { rows } = await db.query(
    "select place_id, reason, details from public.place_reports where place_id = 1",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].reason, "inaccurate");

  // Bob cannot see Alice's report
  await asUser(bob);
  const { rows: bobReports } = await db.query(
    "select * from public.place_reports where place_id = 1",
  );
  assert.equal(bobReports.length, 0);

  // Duplicate report from Alice fails
  await asUser(alice);
  await assert.rejects(
    db.query(
      "insert into public.place_reports (place_id, reason) values (1, 'duplicate')",
    ),
    (err) => err.code === "23505",
  );

  // Invalid reason fails
  await assert.rejects(
    db.query(
      "insert into public.place_reports (place_id, reason) values (1, 'invalid_reason')",
    ),
    (err) => err.code === "23514",
  );
});
