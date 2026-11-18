---
id: US-3.1-T-2
story: US-3.1
sprint: 3
assignee: Dan Pham
estimate_hours: 5
---

# Add, view, and delete photos in a place's details

## Description
Serves US-3.1 (see campus places such as water fountains, bathrooms, and classrooms, and information about them). This task adds a Photos section to the place details window (`PlaceFeedbackModal`), so students can see a place's photos, add a photo from their photo library, and delete their own photos. It uses the photo functions from US-3.1-T-1 (`src/components/places/photos.ts`) without changing them.

Out of scope: taking a photo with the camera, videos, a full-screen photo viewer, reporting photos, and a "my uploads" list. Points for photos are already awarded by the leaderboard's database trigger; this task only shows the existing points pop-up.

## Specs
- New component `src/components/places/PlacePhotos.tsx`, shown in the scrollable area of `PlaceFeedbackModal` for the open place, under a "Photos" heading.
  - While loading, it shows "Loading photos…". It loads with `getPlacePhotos(client, place.id)`.
  - It shows the place's photos newest first, each as an image with the accessibility label "Photo of <place name>".
  - A place with no photos shows "No photos yet. Be the first to add one."
  - If the photos can't be loaded, it shows the alert "Could not load photos."
- An "Add photo" button opens the photo library, limited to images.
  - If the student cancels, nothing is uploaded and the list does not change.
  - The chosen photo is prepared by `preparePhoto(uri, width)` in new file `src/components/places/preparePhoto.ts`: it resizes the photo to at most 1600 px wide (keeping its shape; narrower photos keep their size) and saves it as a new JPEG at 0.8 quality, returning `{ data: ArrayBuffer, contentType: "image/jpeg" }`. Only this re-saved JPEG is uploaded, never the original file, so data embedded in the original (such as where it was taken) is not uploaded.
  - It is uploaded with `uploadPlacePhoto(client, place.id, photo)`. While uploading, the button is disabled and reads "Uploading…".
  - On success, the new photo appears first in the list and the existing points pop-up shows "+20 Points!" with "Photo added".
  - On failure, the error message from the upload (for example "Photos must be 5 MB or smaller.") shows as an alert, and the list does not change.
- Each photo uploaded by the signed-in student has a "Delete your photo" button; other students' photos have none.
  - Deleting calls `deletePlacePhoto(client, photo)` and removes the photo from the list.
  - If deleting fails, the alert "Could not delete the photo." shows and the photo stays in the list.

## Requirements
- Use `getPlacePhotos`, `uploadPlacePhoto`, and `deletePlacePhoto` from US-3.1-T-1 unchanged, with the existing Supabase client from `@/lib/supabase`.
- New runtime dependencies, installed with `npx expo install` so they match the Expo SDK: `expo-image-picker` (choose a photo) and `expo-image-manipulator` (resize and re-save). Both are official Expo packages that work in Expo Go and on the web.
- Keep the existing likes, votes, comments, and reports in `PlaceFeedbackModal` working unchanged.
- Do not add points logic; use the existing points pop-up (`usePointsToast`).
- Existing tests must keep passing.

## Acceptance criteria
1. The place details window shows a Photos section with the open place's photos, newest first, each labeled "Photo of <place name>".
2. A place with no photos shows "No photos yet. Be the first to add one."
3. If the photos can't be loaded, the alert "Could not load photos." shows.
4. `preparePhoto` resizes a photo wider than 1600 px to 1600 px wide, keeps narrower photos at their size, and saves it as a JPEG at 0.8 quality.
5. Adding a photo uploads the re-saved JPEG from `preparePhoto`, not the original file, and the new photo appears first in the list.
6. Cancelling the photo library uploads nothing and leaves the list unchanged.
7. While a photo is uploading, the "Add photo" button is disabled and reads "Uploading…".
8. After a successful upload, the points pop-up shows "+20 Points!" and "Photo added".
9. A failed upload shows its error message as an alert, and the list does not change.
10. Only the signed-in student's own photos have a "Delete your photo" button, and deleting removes the photo from the list.
11. A failed delete shows "Could not delete the photo." and keeps the photo in the list.
