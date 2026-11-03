import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const schemaSql = await readFile(
  new URL("../../supabase/classes.sql", import.meta.url),
  "utf8",
);
const importSql = await readFile(
  new URL(
    "../../supabase/migrations/20261102010000_import_pisa_meetings.sql",
    import.meta.url,
  ),
  "utf8",
);

before(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
  `);
  await db.exec(schemaSql);
  await db.exec(importSql);
});
after(() => db.close());

async function asUser(id) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}

beforeEach(async () => {
  await db.exec(`
    reset role;
    truncate auth.users, public.classes, public.class_meetings, public.user_classes restart identity cascade;
    insert into auth.users values ('${alice}'), ('${bob}');
    insert into public.classes (name, owner_id) values
      ('Catalog class', null), ('Alice private', '${alice}'), ('Bob private', '${bob}');
    insert into public.class_meetings (class_id, days_of_week, start_time, end_time, location_text) values
      (1, '{1,3}', '09:00', '10:00', 'Catalog room'),
      (2, '{2,4}', '11:00', '12:00', 'Alice room'),
      (3, '{5}', '13:00', '14:00', 'Bob room');
    insert into public.user_classes (user_id, class_id) values
      ('${alice}', 2), ('${bob}', 1), ('${bob}', 3);
  `);
  await asUser(alice);
});

test("students see only catalog classes and their own manual classes and meetings", async () => {
  assert.deepEqual(
    (await db.query("select id from public.classes order by id")).rows,
    [{ id: 1 }, { id: 2 }],
  );
  assert.deepEqual(
    (
      await db.query(
        "select class_id from public.class_meetings order by class_id",
      )
    ).rows,
    [{ class_id: 1 }, { class_id: 2 }],
  );
  await asUser(bob);
  assert.deepEqual(
    (await db.query("select id from public.classes order by id")).rows,
    [{ id: 1 }, { id: 3 }],
  );
});

const saveCatalog = () =>
  db.query(`
  insert into public.user_classes (user_id, class_id) values (auth.uid(), 1)
  on conflict (user_id, class_id) do nothing
`);

test("saving a catalog class persists for its owner and duplicate requests leave one save", async () => {
  await Promise.all([saveCatalog(), saveCatalog()]);
  await asUser(bob);
  await asUser(alice);
  assert.deepEqual(
    (
      await db.query(
        "select class_id from public.user_classes order by class_id",
      )
    ).rows,
    [{ class_id: 1 }, { class_id: 2 }],
  );
});

test("removing a catalog save preserves the catalog, its meetings, and another student's save", async () => {
  await saveCatalog();
  await db.query(
    "delete from public.user_classes where user_id = auth.uid() and class_id = 1",
  );
  assert.equal(
    (await db.query("select * from public.user_classes where class_id = 1"))
      .rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.classes where id = 1")).rows.length,
    1,
  );
  assert.equal(
    (await db.query("select * from public.class_meetings where class_id = 1"))
      .rows.length,
    1,
  );
  await asUser(bob);
  assert.equal(
    (await db.query("select * from public.user_classes where class_id = 1"))
      .rows.length,
    1,
  );
});

async function createManual(title = "Study class", meetings = []) {
  const { rows } = await db.query(
    "select public.create_manual_class($1, $2, $3, $4::jsonb) as result",
    [title, "CSE 115A - 02", "Instructor", JSON.stringify(meetings)],
  );
  return rows[0].result;
}

test("manual creation saves class details and multiple meeting patterns to the owner's schedule", async () => {
  const result = await createManual(" My class ", [
    {
      days_of_week: [1, 3],
      start_time: "09:30",
      end_time: "10:45",
      location_text: " Room 12 ",
    },
    {
      days_of_week: [5],
      start_time: "14:00",
      end_time: "15:00",
      location_text: "Online",
    },
  ]);
  assert.equal(result.owner_id, alice);
  assert.equal(result.name, "My class");
  assert.equal(result.code, "CSE 115A - 02");
  assert.equal(result.instructor_name, "Instructor");
  assert.deepEqual(
    result.class_meetings.map(
      ({ days_of_week, start_time, end_time, location_text }) => ({
        days_of_week,
        start_time,
        end_time,
        location_text,
      }),
    ),
    [
      {
        days_of_week: [1, 3],
        start_time: "09:30:00",
        end_time: "10:45:00",
        location_text: "Room 12",
      },
      {
        days_of_week: [5],
        start_time: "14:00:00",
        end_time: "15:00:00",
        location_text: "Online",
      },
    ],
  );
  await asUser(bob);
  assert.equal(
    (await db.query("select * from public.classes where id = $1", [result.id]))
      .rows.length,
    0,
  );
  await asUser(alice);
  assert.equal(
    (
      await db.query("select * from public.user_classes where class_id = $1", [
        result.id,
      ])
    ).rows.length,
    1,
  );
});

test("removing a manual class deletes its meetings and save without touching other classes", async () => {
  await db.query(
    "delete from public.classes where id = 2 and owner_id = auth.uid()",
  );
  await db.exec("reset role");
  assert.deepEqual(
    (await db.query("select id from public.classes order by id")).rows,
    [{ id: 1 }, { id: 3 }],
  );
  assert.equal(
    (await db.query("select * from public.class_meetings where class_id = 2"))
      .rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.user_classes where class_id = 2"))
      .rows.length,
    0,
  );
  assert.equal(
    (
      await db.query("select * from public.user_classes where user_id = $1", [
        bob,
      ])
    ).rows.length,
    2,
  );
});

test("students cannot edit or delete another student's class or meetings, or the catalog", async () => {
  for (const owner of [null, bob]) {
    await assert.rejects(
      db.query(
        "insert into public.classes (name, owner_id) values ('Not mine', $1)",
        [owner],
      ),
      { code: "42501" },
    );
  }
  for (const id of [1, 3]) {
    assert.equal(
      (
        await db.query(
          "update public.classes set name = 'Changed' where id = $1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.classes where id = $1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update public.class_meetings set location_text = 'Changed' where class_id = $1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.class_meetings where class_id = $1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.class_meetings (class_id, location_text) values ($1, 'Changed')",
        [id],
      ),
      { code: "42501" },
    );
  }
  await assert.rejects(
    db.query("update public.classes set owner_id = $1 where id = 2", [bob]),
    { code: "42501" },
  );
  await assert.rejects(
    db.query("update public.classes set owner_id = null where id = 2"),
    { code: "42501" },
  );
});

test("students cannot read or change another student's saved schedule, or save their private classes", async () => {
  assert.equal(
    (
      await db.query("select * from public.user_classes where user_id = $1", [
        bob,
      ])
    ).rows.length,
    0,
  );
  await assert.rejects(
    db.query("insert into public.user_classes values ($1, 2)", [bob]),
    { code: "42501" },
  );
  assert.equal(
    (
      await db.query(
        "delete from public.user_classes where user_id = $1 returning class_id",
        [bob],
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    db.query("update public.user_classes set class_id = 2 where user_id = $1", [
      bob,
    ]),
    { code: "42501" },
  );
  await assert.rejects(
    db.query("insert into public.user_classes values ($1, 3)", [alice]),
    { code: "42501" },
  );
  await asUser(bob);
  assert.deepEqual(
    (
      await db.query(
        "select class_id from public.user_classes order by class_id",
      )
    ).rows,
    [{ class_id: 1 }, { class_id: 3 }],
  );
});

test("blank titles and invalid meeting details are rejected without leaving partial records", async () => {
  const { rows: initial } = await db.query(
    "select (select count(*) from public.classes) as classes, (select count(*) from public.class_meetings) as meetings, (select count(*) from public.user_classes) as saves",
  );
  for (const [title, meetings] of [
    [" \t\n ", []],
    ["Invalid time", [{ start_time: "14:00", end_time: "13:00" }]],
    ["Invalid time", [{ start_time: "09:00", end_time: "09:00" }]],
    ["Invalid time", [{ start_time: "27:90" }]],
    ["Invalid day", [{ days_of_week: [8] }]],
  ]) {
    await assert.rejects(createManual(title, meetings));
  }
  assert.deepEqual(
    (
      await db.query(
        "select (select count(*) from public.classes) as classes, (select count(*) from public.class_meetings) as meetings, (select count(*) from public.user_classes) as saves",
      )
    ).rows,
    initial,
  );
});

test("manual classes can omit every optional detail", async () => {
  const { rows } = await db.query(
    "select public.create_manual_class('Class name only') as result",
  );
  assert.equal(rows[0].result.name, "Class name only");
  assert.equal(rows[0].result.code, null);
  assert.equal(rows[0].result.instructor_name, null);
  assert.equal(rows[0].result.class_number, null);
  assert.equal(rows[0].result.term, null);
  assert.deepEqual(rows[0].result.class_meetings, []);
  assert.deepEqual(rows[0].result.user_classes, [{ user_id: alice }]);
});

test("failure at the final schedule insert rolls back the class and meetings", async () => {
  await db.exec(
    "reset role; revoke insert on public.user_classes from authenticated;",
  );
  try {
    await asUser(alice);
    await assert.rejects(
      createManual("Failed class", [
        { days_of_week: [1], location_text: "Room" },
      ]),
      { code: "42501" },
    );
    assert.equal(
      (
        await db.query(
          "select * from public.classes where name = 'Failed class'",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select * from public.class_meetings where location_text = 'Room'",
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.exec(
      "reset role; grant insert on public.user_classes to authenticated;",
    );
  }
});

test("logged-out requests cannot read schedules or create classes", async () => {
  await db.exec("reset role; set role anon;");
  for (const table of ["classes", "class_meetings", "user_classes"]) {
    await assert.rejects(db.query(`select * from public.${table}`), {
      code: "42501",
    });
  }
  await assert.rejects(createManual(), { code: "42501" });
});

const pisaClass = {
  code: "TEST 100 - 01",
  name: "Fall class",
  class_number: 12345,
  instructor_name: "Staff",
  location: "Room 1",
  day_and_time: "MWF 09:00AM-10:00AM",
  meetings: [
    {
      days_of_week: [1, 3, 5],
      start_time: "09:00",
      end_time: "10:00",
      location_text: "Room 1",
    },
  ],
};
const importCatalog = (classes = [pisaClass], term = 2268) =>
  db.query("select public.import_pisa_classes($1, $2::jsonb)", [
    term,
    JSON.stringify(classes),
  ]);

test("PISA refreshes replace catalog meetings without duplicates or changes to saved IDs and manual classes", async () => {
  await db.exec("reset role; set role service_role;");
  const before = (
    await db.query("select * from public.class_meetings order by id")
  ).rows;
  await importCatalog();
  const {
    rows: [initial],
  } = await db.query("select * from public.classes where term = 2268");
  const fallId = initial.id;
  assert.equal(initial.owner_id, null);
  assert.ok(initial.updated_at);
  await asUser(alice);
  await db.query("insert into public.user_classes values ($1, $2)", [
    alice,
    fallId,
  ]);

  await db.exec("reset role; set role service_role;");
  const updated = {
    ...pisaClass,
    name: "Updated fall class",
    location: "Room 2",
    meetings: [
      {
        days_of_week: [2],
        start_time: "12:00",
        end_time: "13:00",
        location_text: "Room 2",
      },
      {
        days_of_week: [4],
        start_time: "11:00",
        end_time: "13:00",
        location_text: "Room 2",
      },
    ],
  };
  await importCatalog([updated]);
  await importCatalog([updated]);
  await importCatalog([{ ...pisaClass, name: "Winter class" }], 2270);
  assert.equal(
    (
      await db.query(
        "select count(*) from public.classes where class_number = 12345",
      )
    ).rows[0].count,
    2,
  );
  assert.deepEqual(
    (
      await db.query(
        "select * from public.class_meetings where class_id <= 3 order by id",
      )
    ).rows,
    before,
  );
  assert.deepEqual(
    (
      await db.query(
        "select days_of_week, start_time, end_time, location_text from public.class_meetings where class_id = $1 order by id",
        [fallId],
      )
    ).rows,
    [
      {
        days_of_week: [2],
        start_time: "12:00:00",
        end_time: "13:00:00",
        location_text: "Room 2",
      },
      {
        days_of_week: [4],
        start_time: "11:00:00",
        end_time: "13:00:00",
        location_text: "Room 2",
      },
    ],
  );
  await asUser(alice);
  assert.deepEqual(
    (
      await db.query(
        `select c.name, c.location from public.user_classes u
       join public.classes c on c.id = u.class_id where c.id = $1`,
        [fallId],
      )
    ).rows,
    [{ name: "Updated fall class", location: "Room 2" }],
  );
});

test("a bad meeting rolls back the entire import, preserving the prior classes and meetings", async () => {
  await db.exec("reset role; set role service_role;");
  await importCatalog();
  const classes = (await db.query("select * from public.classes order by id"))
    .rows;
  const meetings = (
    await db.query("select * from public.class_meetings order by id")
  ).rows;
  await assert.rejects(
    importCatalog([
      { ...pisaClass, name: "Should roll back", meetings: [] },
      {
        ...pisaClass,
        class_number: 12346,
        meetings: [{ start_time: "10:00", end_time: "09:00" }],
      },
    ]),
    { code: "23514" },
  );
  assert.deepEqual(
    (await db.query("select * from public.classes order by id")).rows,
    classes,
  );
  assert.deepEqual(
    (await db.query("select * from public.class_meetings order by id")).rows,
    meetings,
  );
});

test("an unknown schedule removes old parsed meetings and keeps the new raw text", async () => {
  await db.exec("reset role; set role service_role;");
  await importCatalog();
  await importCatalog([
    { ...pisaClass, day_and_time: "Cancelled Cancelled", meetings: [] },
  ]);
  assert.deepEqual(
    (
      await db.query(`
    select c.day_and_time, count(m.id) as meetings from public.classes c
    left join public.class_meetings m on m.class_id = c.id
    where c.class_number = 12345 group by c.id
  `)
    ).rows,
    [{ day_and_time: "Cancelled Cancelled", meetings: 0 }],
  );
});

test("only the backend can import PISA classes, and import keys are required", async () => {
  await assert.rejects(importCatalog(), { code: "42501" });
  await db.exec("reset role; set role anon;");
  await assert.rejects(importCatalog(), { code: "42501" });
  await db.exec("reset role; set role service_role;");
  await assert.rejects(importCatalog([pisaClass], null), /positive PISA term/);
  await assert.rejects(
    importCatalog([{ ...pisaClass, class_number: null }]),
    /positive PISA class number/,
  );
});

test("removing the legacy public-read policy restores class privacy without deleting saves", async () => {
  await db.exec(`
    reset role;
    grant select on public.classes to anon;
    create policy "Classes are readable by everyone" on public.classes
      for select to anon, authenticated using (true);
  `);
  const migration = await readFile(
    new URL(
      "../../supabase/migrations/20261102000000_remove_public_class_read.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(migration);
  await asUser(alice);
  assert.deepEqual(
    (await db.query("select id from public.classes order by id")).rows,
    [{ id: 1 }, { id: 2 }],
  );
  assert.deepEqual(
    (
      await db.query(
        "select class_id from public.user_classes order by class_id",
      )
    ).rows,
    [{ class_id: 2 }],
  );
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.query("select * from public.classes"), {
    code: "42501",
  });
});

test("rebuilding clears class data and restores private saves without deleting user accounts", async () => {
  await db.exec("reset role;");
  await db.exec(schemaSql);
  for (const table of ["classes", "class_meetings", "user_classes"]) {
    assert.equal(
      (await db.query(`select * from public.${table}`)).rows.length,
      0,
    );
  }
  assert.equal((await db.query("select * from auth.users")).rows.length, 2);
  await asUser(alice);
  const created = await createManual("After rebuild", [
    { location_text: "Room" },
  ]);
  await asUser(bob);
  assert.equal((await db.query("select * from public.classes")).rows.length, 0);
  assert.equal(
    (await db.query("select * from public.class_meetings")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.user_classes")).rows.length,
    0,
  );
  await asUser(alice);
  await db.query("delete from public.classes where id = $1", [created.id]);
  await db.exec("reset role;");
  assert.equal(
    (await db.query("select * from public.class_meetings")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.user_classes")).rows.length,
    0,
  );
});
