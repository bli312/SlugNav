---
id: US-3.2-T-2
story: US-3.2
sprint: 3
assignee: Leo
estimate_hours: 3
---

# Display instant visual feedback toast on student contributions

## Description
Serves US-3.2 (receive points and recognition for campus contributions). This slice adds instant visual feedback (a centered toast card, e.g. "+50 Points! Added campus place", "+10 Points! Comment posted", "+5 Points! Liked this location") when a student makes new contributions to the campus map.

Out of scope: photo upload UI feedback (deferred until the photo upload UI component is built in Sprint 3 task US-3.1-T-2); server-sent push notifications or operating system lock-screen notifications (covered in US-3.4); sound effects or haptic vibration feedback; and achievement badges or animated confettis.

## Specs
- Provider and hook `src/components/leaderboard/PointsToast.tsx`:
  - `PointsToastProvider`: React Context provider wrapping the app root in `src/app/_layout.tsx` to manage toast state.
  - `PointsToastView`: Toast overlay component rendered in the center of the active viewport or feedback modal.
  - `usePointsToast()` hook: returns `{ showPointsToast(points: number, message: string): void, hidePointsToast(): void, registerModal(): () => void }`.
  - Toast visual element:
    - Renders a centered celebration card with a celebration icon (🎉), bold point text (e.g. `+50 Points!`), and the contribution message (e.g. `Added campus place: Science Hill Cafe`).
    - Uses campus dark green styling (`#174B35`), high contrast gold text (`#FFD700`), rounded borders, and subtle shadow.
    - Set with `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` so screen readers announce the point reward.
    - Dismisses automatically after 3000ms or immediately when tapped by the user.
    - Consecutive calls update the toast with the newest reward and reset the dismissal timer.
- Integration with student contribution actions:
  - Place creation (`src/components/places/AddPlaceForm.tsx`): triggers `showPointsToast(50, "Added campus place: <name>")` upon successful place creation.
  - Comment submission (`src/components/places/PlaceFeedbackModal.tsx`): triggers `showPointsToast(10, "Comment posted")` upon successful comment submission.
  - Like & initial feature vote (`src/components/places/PlaceFeedbackModal.tsx`): triggers `showPointsToast(5, "Liked this location")` upon initial like, or `showPointsToast(5, "Voted on <optionKey>")` upon initial feature vote.
  - Changing an existing feature vote, re-selecting the same choice, or unliking/deleting a contribution does NOT show a positive point award toast (preventing misleading feedback when no new points are awarded in the database).
  - Modal integration: When `PlaceFeedbackModal` is open, it registers with the toast context and renders `PointsToastView` directly on the active white modal card.

## Requirements
- Use React Native core components (`View`, `Text`, `Animated`, `Pressable`, `StyleSheet`). No external toast libraries or dependencies.
- Follow `AGENTS.md` and `docs/privacy-and-security.md`. Never display student email addresses or private schedules in toast notifications.
- Accessible: includes `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
- Existing places, comments, search, and leaderboard tests must keep passing.

## Acceptance criteria
1. Successfully creating a campus place displays an instant toast notification showing "+50 Points!" with the place creation description.
2. Successfully posting a place comment displays an instant toast notification showing "+10 Points!" with the comment description.
3. Successfully liking a location or casting a first-time feature vote displays an instant toast notification showing "+5 Points!" with the vote description.
4. Changing an existing feature vote to a different choice or pressing the same choice again does not display a positive point award toast.
5. The toast notification automatically dismisses after 3 seconds, dismisses immediately upon user press, and exposes `accessibilityRole="alert"`.
6. Unliking a place or deleting a comment does not display a positive point award toast.
