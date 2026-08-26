# Feature Specification: Habit Journal PWA

**Feature Branch**: `001-habit-tracker-pwa`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Quiero una aplicacion web para registrar logros en el dia a dia, a modo de libreta de seguimiento de habitos mensual. Para cada mes: un pequeño mantra. Para cada dia del mes: texto para los hechos relevantes del dia o que te haga feliz, un tracker de habitos (cada mes unos habitos, pudiendo repetir entre meses si se quiere o modificarlos). Se deben de ir marcando. Ademas quiero visualizaciones de como han ido los habitos, es decir graficas. Debe ser Mobile-first, funciona como PWA y el stack debe ser uno frontend moderno y fiable que concuerde con la constitution del proyecto y como capa de persistencia sera IndexedDB (idb). Para desplegar en github pages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Habit Tracking (Priority: P1)

As a user, I want to open the app and see today's date with my monthly habits listed, so I can quickly mark which ones I've completed today and write about my day.

**Why this priority**: This is the core interaction loop. Without the ability to track habits daily, the app provides no value. It is the minimum viable product.

**Independent Test**: Can be fully tested by opening the app on any day, marking habits as done, writing a journal entry, and confirming the data persists after closing and reopening the app.

**Acceptance Scenarios**:

1. **Given** the user opens the app for the first time in a month, **When** they view the current day, **Then** they see the day's date, a list of the current month's habits (each with a checkbox), and a text area for journaling.
2. **Given** the user is viewing today's entry, **When** they tap a habit checkbox, **Then** the habit is marked as completed for that day and the change persists immediately.
3. **Given** the user is viewing today's entry, **When** they write text in the journal area, **Then** the text is saved automatically without requiring a manual save action.
4. **Given** the user has already completed some habits today, **When** they reopen the app, **Then** the previously marked habits remain checked and the journal text is preserved.
5. **Given** the user is viewing today's entry, **When** they uncheck a previously completed habit, **Then** the habit is marked as incomplete for that day.

---

### User Story 2 - Monthly Setup and Navigation (Priority: P1)

As a user, I want to set up each new month with a personal mantra and define which habits I want to track, so the app reflects my current goals. I also want to navigate between months to review past entries.

**Why this priority**: Monthly configuration is essential for the app to function as a recurring tracker. Without it, habits cannot be defined and the journal cannot be organized by month. Together with Story 1, this forms the complete core loop.

**Independent Test**: Can be tested by creating a month's setup (mantra + habits), navigating to the next month, verifying the previous month's data is preserved, and confirming habits can be different per month.

**Acceptance Scenarios**:

1. **Given** the user is viewing a new month with no data, **When** they access the month setup (or see the first-visit prompt), **Then** they can enter a mantra (short text) and define a list of habits for that month, optionally carrying over habits from the previous month.
2. **Given** the user has defined habits for a previous month, **When** they set up the next month, **Then** they can choose to repeat some or all of the previous month's habits, or start with a fresh list.
3. **Given** the user is on any day, **When** they navigate to a different month, **Then** they see the data (habits, journal entries, mantra) for that month.
4. **Given** the user has completed habits across multiple days in a month, **When** they navigate away from that month and return, **Then** all data is intact and accurately reflects what was entered.
5. **Given** the user is viewing a past month, **When** they view the habit list, **Then** the habits are read-only — no editing, adding, or removing is permitted for that month.

---

### User Story 3 - Habit Visualization and Charts (Priority: P2)

As a user, I want to see graphical visualizations of my habit completion over time, so I can understand my consistency and identify patterns.

**Why this priority**: Visualizations provide the motivational insight that makes the tracker more than a simple checklist. It is important but secondary to the ability to track and view data.

**Independent Test**: Can be tested by completing habits over several days, then viewing the charts page to verify the visualizations accurately reflect the entered data.

**Acceptance Scenarios**:

1. **Given** the user has tracked habits for at least a few days in a month, **When** they access the visualization view, **Then** they see a chart showing habit completion per day for the current month.
2. **Given** the user is viewing charts, **When** they look at a specific habit's data, **Then** they see the completion rate (percentage of days completed) and any streak information.
3. **Given** the user has data from multiple months, **When** they view the visualization, **Then** they can see a summary of completion trends across months. *(Deferred to v2 — initial release shows current month only)*
4. **Given** the user is viewing charts, **When** they interact with a data point, **Then** they can tap to see the specific day's details (habits completed, journal entry).

---

### User Story 4 - Offline Operation (Priority: P2)

As a user, I want the app to work fully without an internet connection, since I may not always have connectivity when I want to log my day.

**Why this priority**: Offline-first is a core architectural requirement per the constitution. It ensures reliability and trust in the tool. It is P2 because the core data entry and viewing works regardless — this story ensures the PWA infrastructure is properly set up.

**Independent Test**: Can be tested by loading the app, disconnecting from the network, and verifying all core operations (create entry, mark habits, navigate months, view charts) still function.

**Acceptance Scenarios**:

1. **Given** the user has visited the app at least once, **When** they lose internet connectivity, **Then** the app continues to function for all core operations without errors.
2. **Given** the user is offline, **When** they create a new entry or mark habits, **Then** all changes are persisted locally.
3. **Given** the user is offline, **When** they navigate between months, **Then** all previously stored data is accessible.
4. **Given** the user visits the app URL for the first time, **When** the browser prompts to install the PWA, **Then** the app can be installed to the home screen.

---

### User Story 5 - Data Export and Import (Priority: P3)

As a user, I want to export my journal data and import it on another device, so I don't lose my history if I switch phones or browsers.

**Why this priority**: Important for data portability and user trust, but not essential for the initial launch. Users can still get value without this feature.

**Independent Test**: Can be tested by exporting data, clearing the app storage, importing the data, and verifying all entries and habits are restored.

**Acceptance Scenarios**:

1. **Given** the user has data in the app, **When** they access the export option, **Then** they receive a downloadable file containing all their monthly data, habits, and journal entries.
2. **Given** the user has an export file, **When** they import it into a fresh installation, **Then** all data is restored accurately.
3. **Given** the user imports data that overlaps with existing data, **When** the import completes, **Then** the system handles duplicates gracefully (merge or replace, not duplicate entries).

---

### Edge Cases

- What happens when the user opens the app on the last day of a month and a new month begins at midnight?
- What happens when a habit list is empty for a month (no habits defined)?
- What happens when the user tries to enter a mantra longer than the allowed character limit?
- How does the app handle the transition between months — does it auto-create the new month or require explicit setup? → **Resolved**: On first visit to a new month, the app shows a one-time prompt offering to carry over previous habits or start fresh.
- What happens when IndexedDB storage is nearly full?
- What happens when the user deletes a habit that has historical data? → **Resolved**: Not applicable — habits are immutable once a month is set up. No deletion is possible mid-month.
- How does the app handle daylight saving time transitions?
- What happens if the user's device clock is set to a different timezone or incorrect date?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to define a monthly mantra (short text, max 280 characters) for each calendar month.
- **FR-002**: System MUST allow users to create habits on a per-month basis. Once a month's habits are defined, they MUST be immutable for that month — no adding, editing, deleting, or reordering is permitted until the next month.
- **FR-003**: System MUST allow users to copy the habit list from a previous month as a starting point when setting up a new month. The copied habits are new independent instances, not linked to the previous month's habits.
- **FR-004**: System MUST allow users to mark habits as completed or incomplete for any given day.
- **FR-005**: System MUST automatically save all user input (habit marks, journal text, mantra) without requiring an explicit save action.
- **FR-006**: System MUST persist all data locally using IndexedDB so the app works offline.
- **FR-007**: System MUST default to showing today's entry (habits + journal) on launch. System MUST provide a secondary navigation path (tab, swipe, or menu) to a monthly calendar view where users can select any day to view its entry.
- **FR-008**: System MUST allow users to write free-form journal text for each day (max 2000 characters).
- **FR-009**: System MUST display visualizations of habit completion data as charts (bar chart for daily completion, summary stats for monthly progress).
- **FR-010**: System MUST calculate and display habit completion rates (percentage of days completed in a month).
- **FR-011**: System MUST calculate and display current and longest streaks for each habit.
- **FR-012**: System MUST function as a Progressive Web App (installable, offline-capable).
- **FR-013**: System MUST present a mobile-first interface that works well on screen sizes from 320px width upward.
- **FR-014**: System MUST support data export to CSV format.
- **FR-015**: System MUST support data import from a previously exported CSV file.
- **FR-016**: System MUST validate all user input at the point of entry (character limits, required fields).
- **FR-017**: System MUST handle the transition between months gracefully, preserving all data from the previous month. On the first visit to a new month, System MUST present a prompt asking the user whether to carry over the previous month's habits and mantra or start fresh.
- **FR-018**: System MUST allow users to navigate to any past month that has data.
- **FR-019**: System MUST provide a way to delete individual days' entries or entire months of data.
- **FR-020**: System MUST present habit completion data in a way that is accessible (screen reader compatible chart descriptions, keyboard navigable).

### Key Entities

- **Month**: Represents a calendar month. Contains a mantra, an immutable list of habits (locked once defined), and references to daily entries. Key attributes: year, month number, mantra text, list of habit definitions, setup complete flag.
- **Habit Definition**: A habit bound to a specific month. Once defined at the start of the month, it is immutable for that month. Key attributes: name, sort order, associated month. Habits with the same name in different months are independent instances.
- **Daily Entry**: Represents a single day's record. Key attributes: date, journal text, map of habit completions (habit ID → completed boolean).
- **Habit Completion**: The record of whether a specific habit was completed on a specific day. Key attributes: habit ID, date, completed status.
- **Streak**: Derived data representing consecutive days a habit was completed. Key attributes: habit ID, start date, end date, length.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can mark all of today's habits and write a journal entry in under 60 seconds.
- **SC-002**: The app loads and becomes interactive in under 2 seconds on a 3G connection.
- **SC-003**: All data persists correctly after closing and reopening the app (100% data integrity across sessions).
- **SC-004**: The app is installable as a PWA and functions entirely offline after the first visit.
- **SC-005**: Charts accurately reflect entered habit data (100% data consistency between entry and visualization).
- **SC-006**: The interface meets WCAG 2.1 AA standards — all interactive elements are keyboard navigable, color contrast ratios meet minimums, and charts have text alternatives.
- **SC-007**: Users can navigate to any month in under 3 taps/clicks from the main view.
- **SC-008**: 95% of core operations (mark habit, write entry, navigate) complete without errors on mobile devices.

## Clarifications

### Session 2026-08-26

- Q: When a new month begins, should the app auto-create a draft, require explicit setup, or prompt the user? → A: Prompt on first visit — show a one-time dialog asking if the user wants to carry over last month's habits or start fresh.
- Q: Are habits reusable templates across months or bound to a specific month? Can habits be modified mid-month? → A: Habits are bound to a specific month. Once the month is set up, habits are immutable for that month. Each month gets its own independent set of habit instances, even if they share the same name. No mid-month edits allowed.
- Q: What should the default main screen show? → A: Today's entry (habits + journal) as default — monthly calendar accessible via secondary navigation.

## Assumptions

- The app is for a single user (no multi-user or authentication required).
- Data is stored exclusively in the browser's IndexedDB — there is no server-side storage or sync.
- The app will be deployed as a static site to GitHub Pages.
- Users interact primarily via touch on mobile devices but should also work with mouse/keyboard.
- The user's device clock is assumed to be accurate for date handling.
- Timezone is handled by using the user's local date (no UTC normalization needed for a single-user local app).
- The initial version does not require notifications or reminders.
- The chart library used should be lightweight and offline-compatible (no CDN dependencies).
- The mantra field is optional — users can skip it if they don't want one for a given month.
