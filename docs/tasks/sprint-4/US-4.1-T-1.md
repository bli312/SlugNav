---
id: US-4.1-T-1
story: US-4.1
sprint: 4
assignee: Dan Pham
estimate_hours: 4
---

# See and delete all of your own place photos in one place

## Description
Serves US-4.1 (see campus places and information about them, including user-added data). Students can add photos to places, but to find or remove one later they have to remember which place it was on. This task adds a "My photos" screen listing every photo the signed-in student has uploaded, across all places, where they can open a photo full screen or delete it. It is reached from a "My photos" button on the existing Feedback and Reports screen, which already manages the student's comments, votes, and reports.

Out of scope: deleting or editing places, photo captions, and changing the Feedback and Reports screen's tabs.

## Specs
- New function `getMyPhotos(client)` in `src/components/places/photos.ts`:
  - Rejects with "Sign in to see your photos." when nobody is signed in, without querying.
  - Returns only the signed-in student's photos from `place_photos`, newest first, each as a photo with `{ id, placeId, userId, storagePath, createdAt, url }` plus `placeName` (the place's name), where `url` is a signed URL valid for 3,600 seconds.
  - Returns `[]` when the student has no photos.
- New screen `src/components/places/MyPhotosScreen.tsx`, shown by the new route `src/app/my-photos.tsx` (title "My photos"), available only when signed in like the other screens in `src/app/_layout.tsx`.
  - While loading, it shows "Loading your photos…". If loading fails, it shows the alert with the error's message (for example "Could not load your photos.").
  - With no photos, it shows "You haven't added any photos yet."
  - Otherwise it lists each photo, newest first, with a thumbnail, the place's name, and the date it was added ("Added Nov 25, 2026").
  - Each thumbnail is a button labeled "Open photo <n> of <total>" that opens the existing full-screen `PhotoViewer` on that photo, labeled "Photo <n> of <total> of <place name>".
  - Each photo has a button labeled "Delete photo of <place name>". Deleting calls `deletePlacePhoto` and removes the photo from the list; if it fails, the alert "Could not delete the photo." shows and the photo stays.
- `src/app/feedback-reports.tsx` shows a "My photos" button in its header that opens the My photos screen.

## Requirements
- Reuse `deletePlacePhoto` and `PhotoViewer` unchanged; no new dependencies and no database changes (existing row-level security already limits deletes to the uploader).
- Do not change `FeedbackReportsScreen.tsx`; the button goes in the route's header.
- Name test files after the files they test, and commit in small steps.
- Existing tests must keep passing.

## Acceptance criteria
1. `getMyPhotos` returns only the signed-in student's photos, newest first, each with its place name and a signed URL valid for 3,600 seconds, and returns `[]` when there are none.
2. `getMyPhotos` rejects with "Sign in to see your photos." when nobody is signed in, without querying.
3. The Feedback and Reports screen has a "My photos" button that opens the My photos screen.
4. The My photos screen lists each photo newest first with its place name and "Added <date>".
5. With no photos, the screen shows "You haven't added any photos yet."; if loading fails, it shows the error as an alert.
6. Tapping a photo's "Open photo <n> of <total>" button opens it full screen, labeled "Photo <n> of <total> of <place name>".
7. Deleting a photo removes it from the list; a failed delete shows "Could not delete the photo." and keeps it.
