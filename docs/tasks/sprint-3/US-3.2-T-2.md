---
id: US-3.2-T-2
story: US-3.2
sprint: 3
assignee: Leo
estimate_hours: 3
---

# Display instant visual feedback toast on student contributions

## Description
Serves US-3.2 (receive points and recognition for campus contributions). This slice adds instant visual feedback (a floating toast notification, e.g. "+50 Points! Added new place", "+20 Points! Uploaded photo", "+10 Points! Comment posted", "+5 Points! Liked") when a student contributes to the campus map.

Out of scope: server-sent push notifications or operating system lock-screen notifications (covered in US-3.4); sound effects or haptic vibration feedback; and achievement badges or animated confettis.

## Specs
- Provider and hook `src/components/leaderboard/PointsToast.tsx`:
  - `PointsToastProvider`: React Context provider wrapping the app root in `src/app/_layout.tsx` to render the floating toast overlay above all screens.
  - `usePointsToast()` hook: returns `{ showPointsToast(points: number, message: string): void }`.
  - Toast visual element:
    - Renders a floating banner with a trophy / star badge, bold point text (e.g. `+50 Points!`), and the contribution message (e.g. `Added new place`).
    - Uses campus dark green styling (`#174B35`), high contrast text (`#FFFFFF`), rounded borders, and subtle shadow.
    - Set with `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` so screen readers announce the point reward.
    - Dismisses automatically after 3000ms or when tapped by the user.
    - Consecutive calls update the toast with the newest reward and reset the dismissal timer.
- Integration with student contribution actions:
  - Place creation (`src/components/places/CreatePlaceModal.tsx` or `PlaceMap.tsx`): triggers `showPointsToast(50, "Added new campus place")` upon successful place creation.
  - Photo upload (`src/components/places/PlacePhotosModal.tsx`): triggers `showPointsToast(20, "Uploaded place photo")` upon successful image upload.
  - Comment submission (`src/components/places/PlaceFeedbackModal.tsx`): triggers `showPointsToast(10, "Comment posted")` upon successful comment submission.
  - Like & feature vote (`src/components/places/PlaceFeedbackModal.tsx`): triggers `showPointsToast(5, "Place liked")` upon successful like, or `showPointsToast(5, "Voted on place feature")` upon successful vote.
  - Unliking or removing a contribution does NOT show a positive point award toast.

## Requirements
- Use React Native core components (`View`, `Text`, `Animated`, `Pressable`, `StyleSheet`). No external toast libraries or dependencies.
- Follow `AGENTS.md` and `docs/privacy-and-security.md`. Never display student email addresses or private schedules in toast notifications.
- Accessible: includes `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
- Existing places, photos, comments, search, and leaderboard tests must keep passing.

## Acceptance criteria
1. Successfully creating a campus place displays an instant toast notification showing "+50 Points!" with the place creation description.
2. Successfully uploading a place photo displays an instant toast notification showing "+20 Points!" with the photo upload description.
3. Successfully posting a place comment displays an instant toast notification showing "+10 Points!" with the comment description.
4. Successfully liking a location or casting a feature vote displays an instant toast notification showing "+5 Points!" with the vote description.
5. The toast notification automatically dismisses after 3 seconds or upon user press, and exposes `accessibilityRole="alert"`.
6. Unliking a place or deleting a contribution does not display a positive point award toast.
