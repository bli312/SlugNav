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
const create = (
  name = "Sample room",
  type = "classroom",
  lat = 37,
  lng = -122,
) =>
  db.query(
    "insert into public.places (name, type, latitude, longitude) values ($1,$2,$3,$4) returning *",
    [name, type, lat, lng],
  );

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
});
beforeEach(async () => {
  await db.exec(`reset role;
    truncate auth.users, public.places restart identity cascade;
    insert into auth.users values ('${alice}'), ('${bob}');`);
  await asUser(alice);
});
after(() => db.close());

test("a place persists with its creator and is readable by another student", async () => {
  const {
    rows: [place],
  } = await create();
  assert.equal(place.name, "Sample room");
  assert.equal(place.type, "classroom");
  assert.equal(place.latitude, 37);
  assert.equal(place.longitude, -122);
  assert.equal(place.created_by, alice);
  assert.ok(place.id && place.created_at);
  await asUser(bob);
  assert.deepEqual((await db.query("select * from public.places")).rows, [
    place,
  ]);
});

test("place constraints reject blank names, unknown types and invalid coordinates", async () => {
  for (const values of [
    [" \t\n"],
    ["Room", "unknown"],
    ["Room", "classroom", null],
    ["Room", "classroom", 91],
    ["Room", "classroom", -91],
    ["Room", "classroom", 37, 181],
    ["Room", "classroom", 37, -181],
    ["Room", "classroom", "NaN"],
    ["Room", "classroom", 37, "Infinity"],
  ])
    await assert.rejects(create(...values), (error) =>
      ["23502", "23514"].includes(error.code),
    );
  for (const type of ["classroom", "bathroom", "water_fountain"])
    await create("Place", type);
});

test("clients cannot forge creators, update, delete or access places while logged out", async () => {
  await create();
  for (const creator of [bob, null]) {
    await assert.rejects(
      db.query(
        `insert into public.places (name, type, latitude, longitude, created_by)
      values ('Forged', 'bathroom', 37, -122, $1)`,
        [creator],
      ),
      { code: "42501" },
    );
  }
  for (const user of [alice, bob]) {
    await asUser(user);
    await assert.rejects(
      db.query("update public.places set name = 'Changed'"),
      { code: "42501" },
    );
    await assert.rejects(db.query("delete from public.places"), {
      code: "42501",
    });
  }
  await db.exec("reset role; set role anon;");
  await assert.rejects(create(), { code: "42501" });
  await assert.rejects(db.query("select * from public.places"), {
    code: "42501",
  });
});

test("removing a creator's account preserves the shared place", async () => {
  await create();
  await db.exec("reset role;");
  await db.query("delete from auth.users where id = $1", [alice]);
  await asUser(bob);
  assert.deepEqual(
    (await db.query("select name, created_by from public.places")).rows,
    [{ name: "Sample room", created_by: null }],
  );
});
