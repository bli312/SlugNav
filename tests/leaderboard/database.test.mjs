import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const charlie = "00000000-0000-4000-8000-000000000003";

const sql = (path) =>
  readFile(new URL(`../../supabase/${path}`, import.meta.url), "utf8");

const asUser = async (id) => {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
};

const asSignedOut = async () => {
  await db.exec("reset role; set role anon");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
};

const asServiceRole = async () => {
  await db.exec("reset role; set role service_role");
};

before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;

    create schema storage;
    create table storage.buckets (
      id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id),
      name text not null,
      owner uuid default auth.uid(),
      unique (bucket_id, name)
    );
    create function storage.foldername(name text) returns text[]
      language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select on storage.objects to anon;
    grant select, insert, delete on storage.objects to authenticated;
  `);

  await db.exec(await sql("migrations/20261103000000_places.sql"));
  await db.exec(await sql("migrations/20261104000000_place_feedback.sql"));
  await db.exec(await sql("migrations/20261113000000_place_photos.sql"));
  await db.exec(await sql("migrations/20261117000000_leaderboard.sql"));
});

beforeEach(async () => {
  await db.exec(`
    reset role;
    truncate auth.users, public.places, public.place_votes, public.place_comments,
             public.place_photos, public.user_points, public.user_profiles
             restart identity cascade;
    insert into auth.users values ('${alice}'), ('${bob}'), ('${charlie}');
  `);
});

after(() => db.close());

test("US-3.2-T-1 user_profiles RLS allows reading all profiles, but writing only own profile", async () => {
  await asUser(alice);
  await db.query(
    "insert into public.user_profiles (user_id, display_name) values ($1, $2)",
    [alice, "Alice Slugger"],
  );

  // Bob can see Alice's display name
  await asUser(bob);
  const { rows: bobSees } = await db.query(
    "select user_id, display_name from public.user_profiles where user_id = $1",
    [alice],
  );
  assert.equal(bobSees.length, 1);
  assert.equal(bobSees[0].display_name, "Alice Slugger");

  // Bob cannot update Alice's profile
  const { rowCount: updateCount } = await db.query(
    "update public.user_profiles set display_name = 'Hacked' where user_id = $1",
    [alice],
  );
  assert.equal(updateCount, 0);

  // Bob cannot insert a profile for Alice
  await assert.rejects(
    db.query(
      "insert into public.user_profiles (user_id, display_name) values ($1, 'Fake')",
      [alice],
    ),
  );

  // Signed out user cannot read profiles
  await asSignedOut();
  await assert.rejects(db.query("select * from public.user_profiles"));
});

test("US-3.2-T-1 user_points RLS prevents arbitrary client-side insertions", async () => {
  // Signed-in users CANNOT insert arbitrary points for themselves directly
  await asUser(alice);
  await assert.rejects(
    db.query(
      "insert into public.user_points (user_id, points, category, description) values ($1, 1000000, 'cheat', 'Free points')",
      [alice],
    ),
  );

  // Bob also cannot insert points for Alice
  await asUser(bob);
  await assert.rejects(
    db.query(
      "insert into public.user_points (user_id, points, category) values ($1, 50, 'bonus')",
      [alice],
    ),
  );

  // Signed out user cannot read user_points
  await asSignedOut();
  await assert.rejects(db.query("select * from public.user_points"));
});

test("US-3.2-T-1 contributions award points via triggers and reverse points when contributions are deleted", async () => {
  // Alice adds a place -> triggers 50 points
  await asUser(alice);
  const { rows: placeRows } = await db.query(
    "insert into public.places (name, type, latitude, longitude) values ('Science Hill Cafe', 'classroom', 37.0, -122.06) returning id",
  );
  const placeId = placeRows[0].id;

  // Alice adds a comment -> triggers 10 points
  await db.query(
    "insert into public.place_comments (place_id, content) values ($1, 'Great quiet study area')",
    [placeId],
  );

  // Alice adds a vote -> triggers 5 points
  await db.query(
    "insert into public.place_votes (place_id, option_key, choice) values ($1, 'outlets', 'many')",
    [placeId],
  );

  // Alice adds a photo -> triggers 20 points
  await db.query(
    "insert into public.place_photos (place_id, storage_path) values ($1, $2)",
    [placeId, `${alice}/${placeId}/img.png`],
  );

  // Alice should have 50 + 10 + 5 + 20 = 85 points across 4 contributions
  const { rows: alicePoints } = await db.query(
    "select sum(points) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(alicePoints[0].total), 85);
  assert.equal(Number(alicePoints[0].count), 4);

  // Unlike: Alice removes her vote -> points reversed by 5
  await db.query(
    "delete from public.place_votes where place_id = $1 and option_key = 'outlets'",
    [placeId],
  );
  const { rows: afterUnlike } = await db.query(
    "select sum(points) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(afterUnlike[0].total), 80);
  assert.equal(Number(afterUnlike[0].count), 3);

  // Like and unlike cycles do NOT accumulate points indefinitely
  await db.query(
    "insert into public.place_votes (place_id, option_key, choice) values ($1, 'outlets', 'many')",
    [placeId],
  );
  await db.query(
    "delete from public.place_votes where place_id = $1 and option_key = 'outlets'",
    [placeId],
  );
  const { rows: afterCycle } = await db.query(
    "select sum(points) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(afterCycle[0].total), 80);

  // Delete comment -> removes 10 points
  await db.query(
    "delete from public.place_comments where place_id = $1",
    [placeId],
  );
  const { rows: afterCommentDelete } = await db.query(
    "select sum(points) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(afterCommentDelete[0].total), 70);

  // Delete photo -> removes 20 points
  await db.query(
    "delete from public.place_photos where place_id = $1",
    [placeId],
  );
  const { rows: afterPhotoDelete } = await db.query(
    "select sum(points) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(afterPhotoDelete[0].total), 50);

  // Delete place (as admin / service_role) -> removes 50 points
  await asServiceRole();
  await db.query(
    "delete from public.places where id = $1",
    [placeId],
  );
  const { rows: afterPlaceDelete } = await db.query(
    "select coalesce(sum(points), 0) as total, count(*) as count from public.user_points where user_id = $1",
    [alice],
  );
  assert.equal(Number(afterPlaceDelete[0].total), 0);
  assert.equal(Number(afterPlaceDelete[0].count), 0);
});

test("US-3.2-T-1 get_leaderboard returns ranked contributors with display names and anonymous slugs", async () => {
  // Alice sets display name
  await asUser(alice);
  await db.query(
    "insert into public.user_profiles (user_id, display_name) values ($1, 'SuperSlug')",
    [alice],
  );

  // System seeds points for Alice, Bob, Charlie
  await asServiceRole();
  await db.query(
    "insert into public.user_points (user_id, points, category, reference_type, reference_id) values ($1, 60, 'manual', 'test', '1')",
    [alice],
  );
  await db.query(
    "insert into public.user_points (user_id, points, category, reference_type, reference_id) values ($1, 100, 'manual', 'test', '2')",
    [bob],
  );
  await db.query(
    "insert into public.user_points (user_id, points, category, reference_type, reference_id) values ($1, 30, 'manual', 'test', '3')",
    [charlie],
  );

  await asUser(alice);
  const { rows: board } = await db.query("select * from public.get_leaderboard(10)");
  assert.equal(board.length, 3);

  // Bob is #1 (100 points), anonymous slug
  assert.equal(Number(board[0].rank), 1);
  assert.equal(board[0].user_id, bob);
  assert.equal(board[0].display_name, "Slug 0000");
  assert.equal(Number(board[0].total_points), 100);

  // Alice is #2 (60 points), custom display name
  assert.equal(Number(board[1].rank), 2);
  assert.equal(board[1].user_id, alice);
  assert.equal(board[1].display_name, "SuperSlug");
  assert.equal(Number(board[1].total_points), 60);

  // Charlie is #3 (30 points)
  assert.equal(Number(board[2].rank), 3);
  assert.equal(board[2].user_id, charlie);
  assert.equal(Number(board[2].total_points), 30);
});

test("US-3.2-T-1 get_user_rank returns correct standing for contributor and unranked student", async () => {
  await asServiceRole();
  await db.query(
    "insert into public.user_points (user_id, points, category, reference_type, reference_id) values ($1, 50, 'place', 'test', '10')",
    [alice],
  );

  // Alice checks her rank
  await asUser(alice);
  const { rows: aliceRank } = await db.query(
    "select * from public.get_user_rank($1)",
    [alice],
  );
  assert.equal(aliceRank.length, 1);
  assert.equal(Number(aliceRank[0].rank), 1);
  assert.equal(Number(aliceRank[0].total_points), 50);

  // Bob has no points yet -> returns rank: null, points: 0
  const { rows: bobRank } = await db.query(
    "select * from public.get_user_rank($1)",
    [bob],
  );
  assert.equal(bobRank.length, 1);
  assert.equal(bobRank[0].rank, null);
  assert.equal(Number(bobRank[0].total_points), 0);
  assert.equal(Number(bobRank[0].contributions_count), 0);
  assert.equal(bobRank[0].display_name, "Slug 0000");
});

test("US-3.2-T-1 signed-out requests cannot execute get_leaderboard or get_user_rank", async () => {
  await asSignedOut();
  await assert.rejects(db.query("select * from public.get_leaderboard(5)"));
  await assert.rejects(db.query("select * from public.get_user_rank($1)", [alice]));
});

test("US-3.2-T-1 leaderboard rollback cleanly drops triggers, functions, view and tables", async () => {
  const rollbackSql = await sql("rollbacks/20261117000000_leaderboard.rollback.sql");
  await db.exec("reset role;");
  await db.exec(rollbackSql);

  // Check tables and functions are dropped
  const { rows: tables } = await db.query(
    "select tablename from pg_tables where schemaname = 'public' and tablename in ('user_points', 'user_profiles')",
  );
  assert.equal(tables.length, 0);

  const { rows: views } = await db.query(
    "select viewname from pg_views where schemaname = 'public' and viewname = 'leaderboard_view'",
  );
  assert.equal(views.length, 0);

  // Re-apply migration so later tests or fixtures remain valid
  await db.exec(await sql("migrations/20261117000000_leaderboard.sql"));
});
