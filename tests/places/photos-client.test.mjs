import assert from "node:assert/strict";
import { test } from "node:test";

import {
  deletePlacePhoto,
  getPlacePhotos,
  uploadPlacePhoto,
} from "../../src/components/places/photos.ts";

const MB = 1024 * 1024;
const photo = (bytes = 1000, contentType = "image/png") => ({
  data: new ArrayBuffer(bytes),
  contentType,
});

// A fake Supabase client that records what the code asked it to do.
function fakeClient({
  userId = "student-1",
  rows = [],
  insertFails = false,
  deletedRows = [{ id: 7 }],
} = {}) {
  const calls = {
    uploads: [],
    inserted: [],
    removed: [],
    order: [],
    signedFor: [],
    deletedIds: [],
  };
  const signedUrl = (path, seconds) =>
    `https://signed.test/${path}?expires=${seconds}`;
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: userId ? { user: { id: userId } } : null },
      }),
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, "place-photos");
        return {
          upload: async (path, data, options) => {
            calls.uploads.push({ path, data, options });
            return { data: { path }, error: null };
          },
          remove: async (paths) => {
            calls.removed.push(...paths);
            return { data: [], error: null };
          },
          createSignedUrl: async (path, seconds) => ({
            data: { signedUrl: signedUrl(path, seconds) },
            error: null,
          }),
          createSignedUrls: async (paths, seconds) => {
            calls.signedFor.push(...paths);
            return {
              data: paths.map((path) => ({
                path,
                signedUrl: signedUrl(path, seconds),
                error: null,
              })),
              error: null,
            };
          },
        };
      },
    },
    from: (table) => {
      assert.equal(table, "place_photos");
      return {
        insert: (row) => {
          calls.inserted.push(row);
          return {
            select: () => ({
              single: async () =>
                insertFails
                  ? { data: null, error: { message: "Synthetic failure" } }
                  : {
                      data: {
                        id: 7,
                        created_at: "2026-11-13T00:00:00Z",
                        ...row,
                      },
                      error: null,
                    },
            }),
          };
        },
        select: () => ({
          eq: (column, value) => {
            assert.deepEqual([column, value], ["place_id", 42]);
            return {
              order: async (...args) => {
                calls.order.push(args);
                return { data: rows, error: null };
              },
            };
          },
        }),
        delete: () => ({
          eq: (column, value) => {
            calls.deletedIds.push(value);
            return { select: async () => ({ data: deletedRows, error: null }) };
          },
        }),
      };
    },
  };
  return { client, calls };
}

test("US-3.1-T-1 upload rejects a signed-out user, a non-image type, and data over 5 MB without uploading", async () => {
  const signedOut = fakeClient({ userId: null });
  await assert.rejects(uploadPlacePhoto(signedOut.client, 42, photo()), {
    message: "Sign in to add photos.",
  });
  assert.equal(signedOut.calls.uploads.length, 0);

  const { client, calls } = fakeClient();
  await assert.rejects(uploadPlacePhoto(client, 42, photo(1000, "image/gif")), {
    message: "Use a JPEG, PNG, or WebP photo.",
  });
  await assert.rejects(uploadPlacePhoto(client, 42, photo(5 * MB + 1)), {
    message: "Photos must be 5 MB or smaller.",
  });
  assert.equal(calls.uploads.length, 0);
  assert.equal(calls.inserted.length, 0);
});

test("US-3.1-T-1 upload stores the file under <user id>/<place id>/ and returns the saved photo", async () => {
  const { client, calls } = fakeClient();
  const data = photo(5 * MB, "image/webp"); // exactly 5 MB is allowed
  const saved = await uploadPlacePhoto(client, 42, data);

  const [upload] = calls.uploads;
  assert.match(upload.path, /^student-1\/42\/[\w-]+\.webp$/);
  assert.equal(upload.data, data.data);
  assert.equal(upload.options.contentType, "image/webp");
  assert.deepEqual(calls.inserted, [
    { place_id: 42, user_id: "student-1", storage_path: upload.path },
  ]);
  assert.deepEqual(saved, {
    id: 7,
    placeId: 42,
    userId: "student-1",
    storagePath: upload.path,
    createdAt: "2026-11-13T00:00:00Z",
    url: `https://signed.test/${upload.path}?expires=3600`,
  });

  await uploadPlacePhoto(client, 42, photo(10, "image/jpeg"));
  assert.match(calls.uploads[1].path, /\.jpg$/);
  assert.notEqual(calls.uploads[1].path, upload.path);
});

test("US-3.1-T-1 upload removes the file and rejects when saving the row fails", async () => {
  const { client, calls } = fakeClient({ insertFails: true });
  await assert.rejects(uploadPlacePhoto(client, 42, photo()), {
    message: "Could not save the photo. Please try again.",
  });
  assert.equal(calls.uploads.length, 1);
  assert.deepEqual(calls.removed, [calls.uploads[0].path]);
});

test("US-3.1-T-1 getPlacePhotos returns newest first with 1-hour signed URLs, and [] when there are none", async () => {
  const rows = [
    {
      id: 2,
      place_id: 42,
      user_id: "student-2",
      storage_path: "student-2/42/new.jpg",
      created_at: "2026-11-13T02:00:00Z",
    },
    {
      id: 1,
      place_id: 42,
      user_id: "student-1",
      storage_path: "student-1/42/old.png",
      created_at: "2026-11-13T01:00:00Z",
    },
  ];
  const { client, calls } = fakeClient({ rows });
  const photos = await getPlacePhotos(client, 42);
  assert.deepEqual(calls.order, [["created_at", { ascending: false }]]);
  assert.deepEqual(
    photos.map((item) => [item.id, item.url]),
    [
      [2, "https://signed.test/student-2/42/new.jpg?expires=3600"],
      [1, "https://signed.test/student-1/42/old.png?expires=3600"],
    ],
  );
  assert.equal(photos[0].userId, "student-2");
  assert.equal(photos[0].storagePath, "student-2/42/new.jpg");

  const empty = fakeClient({ rows: [] });
  assert.deepEqual(await getPlacePhotos(empty.client, 42), []);
  assert.deepEqual(empty.calls.signedFor, []);
});

test("US-3.1-T-1 deletePlacePhoto deletes the row and the file, and keeps the file when no row was deleted", async () => {
  const target = { id: 7, storagePath: "student-1/42/a.png" };
  const { client, calls } = fakeClient();
  await deletePlacePhoto(client, target);
  assert.deepEqual(calls.deletedIds, [7]);
  assert.deepEqual(calls.removed, ["student-1/42/a.png"]);

  const notMine = fakeClient({ deletedRows: [] });
  await assert.rejects(deletePlacePhoto(notMine.client, target), {
    message: "Could not delete the photo.",
  });
  assert.deepEqual(notMine.calls.removed, []);
});
