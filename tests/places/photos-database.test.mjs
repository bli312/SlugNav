import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Synthetic users; not real accounts.
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";

const sql = (path) =>
  readFile(new URL(`../../supabase/${path}`, import.meta.url), "utf8");

// A stand-in for Supabase: roles, auth.uid(), and the storage tables the
// photo policies use. Real Supabase already enables RLS on storage.objects.
async function createDatabase() {
  const db = new PGlite();
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
  await db.exec(await sql("migrations/20261113000000_place_photos.sql"));
  return db;
}

let db;
let placeId;
const asUser = async (id) => {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
};
const asSignedOut = async () => {
  await db.exec("reset role; set role anon");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
};
const addPhotoRow = (path, userId) =>
  db.query(
    "insert into public.place_photos (place_id, user_id, storage_path) values ($1, $2, $3) returning *",
    [placeId, userId, path],
  );
const addFile = (path) =>
  db.query(
    "insert into storage.objects (bucket_id, name) values ('place-photos', $1) returning *",
    [path],
  );
const count = async (query, params = []) => {
  try {
    return (await db.query(query, params)).rows.length;
  } catch {
    return 0; // No permission at all also means nothing was read.
  }
};

before(async () => {
  db = await createDatabase();
});
beforeEach(async () => {
  await db.exec(`reset role;
    truncate auth.users, public.places, storage.objects restart identity cascade;
    insert into auth.users values ('${alice}'), ('${bob}');`);
  await asUser(alice);
  const { rows } = await db.query(
    "insert into public.places (name, type, latitude, longitude) values ('Sample room', 'classroom', 37, -122) returning id",
  );
  placeId = rows[0].id;
});
after(() => db.close());

test("US-3.1-T-1 creates a private place-photos bucket limited to 5 MB and JPEG, PNG, WebP", async () => {
  await db.exec("reset role");
  const {
    rows: [bucket],
  } = await db.query("select * from storage.buckets where id = 'place-photos'");
  assert.equal(bucket.public, false);
  assert.equal(Number(bucket.file_size_limit), 5 * 1024 * 1024);
  assert.deepEqual(bucket.allowed_mime_types, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
});

test("US-3.1-T-1 a student adds a photo row and file under their own id and another student reads both", async () => {
  const path = `${alice}/${placeId}/a.jpg`;
  const {
    rows: [photo],
  } = await addPhotoRow(path, alice);
  await addFile(path);
  assert.equal(photo.user_id, alice);
  assert.ok(photo.id && photo.created_at);

  await asUser(bob);
  assert.equal(
    await count("select * from public.place_photos where storage_path = $1", [
      path,
    ]),
    1,
  );
  assert.equal(
    await count("select * from storage.objects where name = $1", [path]),
    1,
  );
});

test("US-3.1-T-1 a signed-out request reads no photo rows or files", async () => {
  const path = `${alice}/${placeId}/a.jpg`;
  await addPhotoRow(path, alice);
  await addFile(path);
  await asSignedOut();
  assert.equal(await count("select * from public.place_photos"), 0);
  assert.equal(await count("select * from storage.objects"), 0);
});

test("US-3.1-T-1 a student cannot add a photo row or file under another student's id", async () => {
  await assert.rejects(addPhotoRow(`${bob}/${placeId}/a.jpg`, bob));
  await assert.rejects(addPhotoRow(`${bob}/${placeId}/a.jpg`, alice));
  await assert.rejects(addPhotoRow(`${alice}/${placeId}/a.jpg`, bob));
  await assert.rejects(addFile(`${bob}/${placeId}/a.jpg`));
  await db.exec("reset role");
  assert.equal(await count("select * from public.place_photos"), 0);
  assert.equal(await count("select * from storage.objects"), 0);
});

test("US-3.1-T-1 only the uploader can delete their photo row or file", async () => {
  const path = `${alice}/${placeId}/a.jpg`;
  await addPhotoRow(path, alice);
  await addFile(path);

  await asUser(bob);
  assert.equal(
    (await db.query("delete from public.place_photos returning id")).rows
      .length,
    0,
  );
  assert.equal(
    (await db.query("delete from storage.objects returning id")).rows.length,
    0,
  );
  await assert.rejects(
    db.query("update public.place_photos set storage_path = 'x'"),
  );

  await asUser(alice);
  assert.equal(
    (await db.query("delete from public.place_photos returning id")).rows
      .length,
    1,
  );
  assert.equal(
    (await db.query("delete from storage.objects returning id")).rows.length,
    1,
  );
});

test("US-3.1-T-1 deleting a place deletes its photo rows", async () => {
  await addPhotoRow(`${alice}/${placeId}/a.jpg`, alice);
  await db.exec("reset role");
  await db.query("delete from public.places where id = $1", [placeId]);
  assert.equal(await count("select * from public.place_photos"), 0);
});

test("US-3.1-T-1 rollback refuses while files remain, then removes the policies, table, and bucket", async () => {
  const fresh = await createDatabase();
  const rollback = await sql(
    "rollbacks/20261113000000_place_photos.rollback.sql",
  );
  try {
    await fresh.exec(
      "insert into storage.objects (bucket_id, name) values ('place-photos', 'x/1/a.jpg')",
    );
    await assert.rejects(fresh.exec(rollback), /Empty the place-photos bucket/);
    await fresh.exec("rollback; delete from storage.objects");

    await fresh.exec(rollback);
    const {
      rows: [state],
    } = await fresh.query(`select
      to_regclass('public.place_photos') as photo_table,
      (select count(*) from pg_policies where policyname like 'place_photo%')::int as policies,
      (select count(*) from storage.buckets where id = 'place-photos')::int as buckets`);
    assert.deepEqual(state, { photo_table: null, policies: 0, buckets: 0 });
  } finally {
    await fresh.close();
  }
});
