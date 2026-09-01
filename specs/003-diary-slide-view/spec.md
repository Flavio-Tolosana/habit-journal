# Feature Specification: Diary Slide View

**Feature Branch**: `003-diary-slide-view`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Quiero añadir una pagina donde se puedan ver las frases del Diario que se haya puesto cada día. Lo quiero de tal manera que sean como slides para pasar los días. Arriba seleccionar el mes, y si un día no tiene diario no ponerlo. Empieza por el día actual, es decir que habría que ir hacia atrás con el dedo deslizando hacia atrás (izquierda) y luego hacia adelante (derecha)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Daily Diary Entries as Slides (Priority: P1)

As a user, I want to swipe through my daily journal entries one day at a time, like slides, so I can reflect on what I wrote each day in a fluid, focused way.

**Why this priority**: This is the core experience of the feature — viewing diary text as swipeable slides. Without this, the feature provides no value.

**Independent Test**: Can be fully tested by having at least 2 days with journal entries, opening the slide view, and swiping between them to confirm each entry is displayed correctly and days without entries are skipped.

**Acceptance Scenarios**:

1. **Given** the user has journal entries on multiple days, **When** they open the diary slide view, **Then** they see today's journal entry (if one exists) as the first slide, or the most recent past day with an entry if today has none.
2. **Given** the user is viewing a slide, **When** they swipe left (or drag/flick to the left), **Then** the view transitions to the previous day's entry (older in time), skipping any days that have no journal text.
3. **Given** the user is viewing a slide, **When** they swipe right (or drag/flick to the right), **Then** the view transitions to the next day's entry (more recent in time), skipping any days that have no journal text, up to today's entry.
4. **Given** the user is on the earliest available entry, **When** they swipe left, **Then** the view does not transition further — a visual boundary indicator is shown (e.g., bounce effect).
5. **Given** the user is on the most recent entry (today or latest available), **When** they swipe right, **Then** the view does not transition further — a visual boundary indicator is shown.
6. **Given** the user is viewing a slide, **When** the slide is displayed, **Then** it shows the date of the entry, the full journal text, and the month's mantra (if one is set) clearly.
7. **Given** the user is viewing a slide with the month's mantra set, **When** the slide is displayed, **Then** the habit checkmarks for that day are hidden; the user can tap a button to reveal them.

---

### User Story 2 - Month Selector for Filtering (Priority: P1)

As a user, I want to select a specific month from a dropdown or selector at the top of the slide view, so I can quickly jump to entries from a particular month without swiping through all intervening days.

**Why this priority**: The month selector is essential for efficient navigation. Without it, a user with months of data would need to swipe through hundreds of days. It is co-primary with Story 1 because the two together form the complete browsing experience.

**Independent Test**: Can be tested by selecting different months from the selector and verifying that the slides update to show only entries from the selected month.

**Acceptance Scenarios**:

1. **Given** the user is on the diary slide view, **When** they look at the top of the screen, **Then** a month selector is visible showing the current month and year.
2. **Given** the user is viewing entries for the current month, **When** they open the month selector, **Then** they see a list of all months that have at least one journal entry, ordered from most recent to oldest.
3. **Given** the user selects a different month from the selector, **When** the selection is confirmed, **Then** the slide view updates to show the most recent entry within that selected month (or the first entry if navigating forward from the start of the month).
4. **Given** the user selects a month that has entries, **When** they swipe through slides, **Then** only entries from that month are shown — the view does not cross month boundaries.
5. **Given** the user is in a past month's view, **When** they change the month selector back to the current month, **Then** the view returns to showing the current month's entries starting from today.

---

### User Story 3 - Empty State and No-Entry Feedback (Priority: P2)

As a user, when I select a month that has no journal entries or when there are no entries at all, I want to see a clear, friendly message so I understand why the view is empty.

**Why this priority**: Good UX requires clear feedback for empty states. This prevents confusion and provides a polished experience.

**Independent Test**: Can be tested by navigating to a month with no entries and verifying the empty state message appears correctly.

**Acceptance Scenarios**:

1. **Given** the user selects a month with no journal entries, **When** the slide view loads, **Then** a message is displayed indicating there are no entries for that month (e.g., "No hay entradas de diario para este mes").
2. **Given** the user has no journal entries at all in the entire app, **When** they open the diary slide view, **Then** a message is displayed inviting them to write their first entry.
3. **Given** the user is viewing entries and the currently displayed day has no entry (edge case during month boundary), **When** the view renders, **Then** the system skips to the next available entry or shows the empty state message.

---

### Edge Cases

- What happens when the user swipes very quickly between slides? → The system MUST debounce rapid swipes and animate each transition cleanly without skipping entries or showing blank slides.
- What happens when a month has only one entry? → That single entry is shown as the only slide; swipe gestures show the bounce boundary effect on both sides.
- What happens at the boundary between months in the slide view? → Slides MUST NOT cross month boundaries. When on the last day of the selected month, swiping right shows a boundary indicator. When on the first day, swiping left shows a boundary indicator.
- What happens if the journal entry text is very long (approaching the 2000-character limit)? → The text MUST be scrollable within the slide. The date header and slide chrome remain fixed while the text area scrolls vertically.
- What happens when the user changes the month selector while a swipe animation is in progress? → The current animation MUST complete or be cancelled, and the view MUST update to reflect the new month selection.
- What happens if the device is in landscape orientation? → The slide view MUST remain functional and readable in both portrait and landscape orientations.
- What happens when local storage cannot be read (corruption, quota exceeded)? → The system MUST display an inline error message within the slide view with a retry option, without navigating away from the view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated diary slide view page accessible from the app's navigation.
- **FR-002**: System MUST display one journal entry per slide, showing the date, the full journal text, and the selected month's mantra (if one is set).
- **FR-003**: System MUST support horizontal swipe gestures (left and right) to navigate between slides — left swipe moves to the previous (older) day, right swipe moves to the next (more recent) day.
- **FR-004**: System MUST start the slide view on the current day's entry if it exists; otherwise, on the most recent day with an entry.
- **FR-005**: System MUST skip days that have no journal entry text when navigating via swipe — only days with actual diary text are shown as slides.
- **FR-006**: System MUST provide a month selector at the top of the slide view that allows the user to choose any month that contains at least one journal entry.
- **FR-007**: System MUST restrict slide navigation to the selected month — swiping does not cross into adjacent months.
- **FR-008**: System MUST display the month and year of the current slide in the month selector when the user navigates within a month.
- **FR-009**: System MUST show visual boundary indicators (e.g., bounce, fade, or edge glow) when the user attempts to swipe past the first or last entry in the current month.
- **FR-010**: System MUST handle long journal entries by making the text area scrollable within the slide while keeping the date header fixed.
- **FR-011**: System MUST display an empty state message when the selected month has no journal entries.
- **FR-012**: System MUST display a welcoming empty state message when the user has no journal entries in the entire app.
- **FR-013**: System MUST animate slide transitions smoothly with a consistent transition duration.
- **FR-014**: System MUST debounce rapid swipe gestures to prevent accidental multi-slide jumps.
- **FR-015**: System MUST support both touch swipe gestures and keyboard arrow keys for navigation (accessibility).
- **FR-016**: System MUST display the slide view correctly in both portrait and landscape orientations.
- **FR-017**: System MUST display an inline error message within the slide view with a retry option when journal data cannot be read from local storage (e.g., corruption or quota issue), keeping the user in context rather than navigating away.
- **FR-018**: System MUST display all user-facing text (empty states, error messages, month names, date formatting) in Spanish.
- **FR-019**: System MUST hide the day's habit checkmarks by default on each slide and reveal them only when the user taps a button (progressive disclosure).

### Key Entities

- **Diary Slide**: A read-only view of a single day's journal entry, displayed as a full-screen or near-full-screen card. Key attributes: date, journal text, position within the current month's entry sequence.
- **Month Filter**: The user-selected month that constrains which entries are shown in the slide view. Key attributes: year, month number. Derived from the set of months that have at least one journal entry.
- **Slide Sequence**: The ordered list of diary entries within the selected month, sorted by date ascending. Days without entries are excluded from this sequence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can swipe through diary entries with smooth, jank-free animations at 60fps on mid-range mobile devices.
- **SC-002**: Users can reach any entry within a month in at most N swipes, where N is the number of days with entries in that month.
- **SC-003**: Changing the month selector updates the slide view in under 500ms.
- **SC-004**: The slide view is fully navigable using only a keyboard (arrow keys), meeting accessibility requirements.
- **SC-005**: Users with no entries see a helpful empty state within 1 second of opening the slide view.
- **SC-006**: 95% of swipe interactions result in the correct slide being displayed on the first attempt (no misdirection or stuck animations).
- **SC-007**: The feature works fully offline — all journal data is read from local storage with no network requests.

## Assumptions

- Journal entries are already persisted in IndexedDB by the existing daily entry feature (User Story 1 from the original spec). This feature only reads and displays them — it does not create or edit entries.
- The app's existing date handling and timezone strategy (local date, no UTC normalization) is reused for this feature.
- The existing month data model (which months have entries) can be queried efficiently from IndexedDB without loading all entry text.
- The slide view is a read-only browsing experience — no editing of journal text is possible from this view.
- Swipe gestures are the primary interaction method; the feature also supports keyboard navigation for accessibility but does not require dedicated on-screen prev/next buttons (though they may be added as a secondary affordance).
- The month selector uses a simple list/picker UI — not a full calendar grid picker.
- All slide view UI text is displayed in Spanish, matching the app's existing language (Spanish) and the low expectations established by the original app description. No localization framework is required — text is hardcoded in Spanish.

## Clarifications

### Session 2026-09-01

- Q: What should the app show when journal data cannot be read from local storage? → A: Show an inline error message within the slide view with a retry option (Option A).
- Q: In which language should the UI text appear? → A: Spanish only (Option A).
- Q: Besides the date and diary text, what should each slide display? → A: Also the month's mantra (if set); habit checkmarks are hidden by default and revealed via a button tap (Option C modified).
