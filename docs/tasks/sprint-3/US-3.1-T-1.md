---
id: US-3.1-T-1
story: US-3.1
sprint: 3
assignee: Dan Pham
estimate_hours: 5
---

# Store, list, and delete place photos in Supabase

## Description
Serves US-3.1 (see campus places such as water fountains, bathrooms, and classrooms, and information about them). This task adds the backend for place photos: a private Supabase Storage bucket, a `place_photos` table with access rules, a rollback script, and client functions to upload, list, and delete a place's photos.

Out of scope: the Photos section on screen, picking a photo, and removing location data from photos (US-3.1-T-2); videos; editing or reporting a photo; a "my uploads" list.

## Specs
- Migration `supabase/migrations/20261113000000_place_photos.sql` creates:
  - Storage bucket `place-photos`: not public, file size limit 5,242,880 bytes (5 MB), allowed types `image/jpeg`, `image/png`, `image/webp`.
  - Table `public.place_photos`: `id` (generated), `place_id` (required, references `public.places`), `user_id` (required, defaults to the signed-in user), `storage_path` (required, unique), `created_at` (defaults to now).
- Access rules, enforced with row-level security on `public.place_photos` and on `storage.objects` for the `place-photos` bucket:
  - Signed-in users can read every place photo row and file. Signed-out users can read none.
  - A signed-in user can add a row or file only as themselves, under a path that starts with their own user id: `<user id>/<place id>/<file name>`.
  - Only the uploader can delete their row or file. Nobody can edit a row.
  - Deleting a place deletes its photo rows.
- Rollback `supabase/rollbacks/20261113000000_place_photos.rollback.sql` removes the policies, the table, and the bucket.
- Functions in `src/components/places/photos.ts`, each taking a Supabase client:
  - `uploadPlacePhoto(client, placeId, photo)`, where `photo` is `{ data: ArrayBuffer, contentType: string }`:
    - Rejects with "Sign in to add photos." when nobody is signed in.
    - Rejects with "Use a JPEG, PNG, or WebP photo." for any other content type, and "Photos must be 5 MB or smaller." for larger data. Nothing is uploaded in these cases.
    - Uploads the file to `place-photos` at `<user id>/<place id>/<random id>.<jpg|png|webp>`, inserts the `place_photos` row, and returns the new photo.
    - If the row insert fails, removes the uploaded file and rejects with "Could not save the photo. Please try again."
  - `getPlacePhotos(client, placeId)` returns the place's photos, newest first, each as `{ id, placeId, userId, storagePath, createdAt, url }`, where `url` is a signed URL valid for 3,600 seconds. A place with no photos returns `[]`.
  - `deletePlacePhoto(client, photo)` deletes the row, then the file. If no row was deleted (for example, it is another student's photo), it rejects with "Could not delete the photo." and does not delete the file.

## Requirements
- Follow `AGENTS.md` and `docs/privacy-and-security.md`: photos are Tier 2 data, readable by signed-in UCSC users, with writes and deletes restricted to the uploader. Enforce access in the database, not only in the app.
- Add a new migration and its matching rollback script, both wrapped in `begin; … commit;`. Do not edit existing migrations.
- Use the existing Supabase client from `@/lib/supabase`. No service-role key in app code.
- No new runtime dependencies.
- Existing tests must keep passing.

## Acceptance criteria
1. The migration creates a private `place-photos` bucket limited to 5 MB and to JPEG, PNG, and WebP files.
2. A signed-in student can add a photo row and file under their own user id, and another signed-in student can read both.
3. A signed-out request reads no photo rows or files.
4. A student cannot add a photo row or file under another student's user id.
5. Only the uploader can delete their photo row or file; another student's delete removes nothing.
6. Deleting a place deletes its photo rows.
7. `uploadPlacePhoto` rejects a signed-out user, a non-image content type, and data over 5 MB, without uploading anything.
8. `uploadPlacePhoto` stores the file at `<user id>/<place id>/<random id>.<extension>` and returns the saved photo.
9. If saving the row fails, `uploadPlacePhoto` removes the uploaded file and rejects with "Could not save the photo. Please try again."
10. `getPlacePhotos` returns a place's photos newest first, each with a signed URL valid for 3,600 seconds, and returns `[]` when there are none.
11. `deletePlacePhoto` deletes the row and the file, and keeps the file and rejects with "Could not delete the photo." when no row was deleted.
12. The rollback script removes the policies, the table, and the bucket.
