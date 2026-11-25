---
id: US-4.1-T-2
story: US-4.1
sprint: 4
assignee: Dan Pham
estimate_hours: 3
---

# Open a place's photos full screen

## Description
Serves US-4.1 (see campus places such as water fountains, bathrooms, and classrooms, and information about them). Photo thumbnails in a place's details are only 120 px, too small to see what a place looks like. This task lets a student tap a thumbnail to open the photo full screen and step through the place's other photos.

Out of scope: pinch-to-zoom, swipe gestures, deleting or sharing a photo from the full-screen view, and the "manage my uploads" list (US-4.1-T-1). Adding, loading, and deleting photos (US-3.1-T-2) stay unchanged.

## Specs
- In `src/components/places/PlacePhotos.tsx`, each photo thumbnail is a button with the accessibility label "Open photo <n> of <total>". The thumbnail image keeps its label "Photo of <place name>".
- Tapping a thumbnail opens the new full-screen viewer `src/components/places/PhotoViewer.tsx` on that photo.
- The viewer shows:
  - the photo filling the screen without cropping, with the accessibility label "Photo <n> of <total> of <place name>";
  - the position as text, "<n> of <total>";
  - "Previous" and "Next" buttons that move through the place's photos in the same order as the thumbnails (newest first). "Previous" is disabled on the first photo and "Next" on the last, so a place with one photo has both disabled.
  - a "Close" button.
- "Close", or the device back button / Escape (the modal's close request), closes the viewer and returns to the place's details with the thumbnails unchanged.
- If the viewer's photo is deleted from the list while the viewer is closed, opening another thumbnail still shows the right photo and total.

## Requirements
- Use React Native's built-in `Modal` and `Image`; no new dependencies.
- Keep the existing Photos section behavior (load, add, delete, points pop-up) and its tests unchanged.
- Name the test file after the new component (`tests/places/PhotoViewer.spec.tsx`), and commit in small steps.
- Existing tests must keep passing.

## Acceptance criteria
1. Each thumbnail is a button labeled "Open photo <n> of <total>", and tapping it opens that photo full screen.
2. The full-screen photo is labeled "Photo <n> of <total> of <place name>" and the viewer shows "<n> of <total>".
3. "Next" and "Previous" move to the next and previous photos in thumbnail order.
4. "Previous" is disabled on the first photo and "Next" is disabled on the last photo; with one photo, both are disabled.
5. "Close", or a close request from the device back button or Escape, closes the viewer and shows the place's thumbnails again.
6. After a photo is deleted, opening a thumbnail shows that photo with the updated total.
