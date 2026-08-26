# Tasks: Habit Journal PWA

**Input**: Design documents from `/specs/001-habit-tracker-pwa/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/db-contracts.md, research.md, quickstart.md

**Tests**: Included — Constitution Principle VI mandates TDD (tests written first, must fail before implementation).

**Organization**: Tasks grouped by user story. US1 + US2 = MVP (P1). US3 + US4 = P2. US5 = P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, configuration

- [x] T001 Initialize SvelteKit project with TypeScript and static adapter: `npx sv create habit-journal --template minimal --types ts` then configure `svelte.config.js` with `@sveltejs/adapter-static` and `fallback: 'index.html'`
- [x] T002 [P] Install runtime dependencies in project root: `npm install idb chart.js` (~1.2KB + ~20KB gzipped)
- [x] T003 [P] Install dev dependencies in project root: `npm install -D vitest @testing-library/svelte jsdom @sveltejs/adapter-static vite-plugin-pwa` then configure `vitest.config.ts` with `environment: 'jsdom'`
- [x] T004 [P] Configure ESLint + Prettier in project root: install `eslint prettier eslint-plugin-svelte`, create `.prettierrc` and `eslint.config.js`
- [x] T005 [P] Add npm scripts to `package.json`: `"dev"`, `"build"`, `"preview"`, `"test"`, `"test:coverage"`, `"lint"`, `"check"`

**Checkpoint**: Project builds, dev server runs, tests execute, linter passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer, types, stores, app shell — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Types & Database Schema

- [x] T006 Define TypeScript interfaces in `src/lib/db/types.ts`: `Month`, `HabitDefinition`, `DailyEntry`, `Meta` per data-model.md entity definitions
- [x] T007 Implement IndexedDB initialization + schema in `src/lib/db/index.ts`: openDB with version 1, create object stores (months, habits, entries, meta) with indexes per data-model.md schema, export `getDB()` function

### Foundation Tests (TDD — write FIRST, must fail)

> **⚠️ Constitution Principle VI**: Tests MUST be written before implementation. These tests define the contracts — implementation follows.

- [x] T018 Write unit tests for date utilities in `tests/unit/utils/dates.test.ts`: test getToday, getMonthId, getDaysInMonth, formatDisplayDate, timezone edge cases
- [x] T019 [P] Write unit tests for streak calculator in `tests/unit/utils/streaks.test.ts`: test current streak, longest streak, streak break, empty entries, single day
- [x] T020 [P] Write unit tests for stats calculator in `tests/unit/utils/stats.test.ts`: test completionRate, chartDataForMonth with various entry patterns
- [x] T021 Write integration tests for IndexedDB operations in `tests/unit/db/months.test.ts`, `habits.test.ts`, `entries.test.ts`: test all CRUD operations, validation errors, atomicity

### Utilities (implement AFTER tests pass as red)

- [x] T011 Implement date utilities in `src/lib/utils/dates.ts`: `getToday()` (returns `YYYY-MM-DD` in local timezone), `getMonthId(date)`, `getDaysInMonth(year, month)`, `formatDisplayDate(date)`, `isSameMonth(date1, date2)` — no ad-hoc date arithmetic (Principle III)
- [x] T012 [P] Implement streak calculator in `src/lib/utils/streaks.ts`: `calculateStreaks(habits, entries)` returning `Map<string, { current: number; longest: number }>` per contracts/db-contracts.md Statistics
- [x] T013 [P] Implement stats calculator in `src/lib/utils/stats.ts`: `completionRate()`, `chartDataForMonth()` per contracts/db-contracts.md Statistics

### Database Operations (implement AFTER tests pass as red)

- [x] T008 [P] Implement month CRUD in `src/lib/db/months.ts`: `getMonth()`, `getLatestMonth()`, `getAllMonths()`, `createMonth()`, `updateMantra()` per contracts/db-contracts.md Month Operations
- [x] T009 [P] Implement habit CRUD in `src/lib/db/habits.ts`: `getHabitsForMonth()`, `createHabitsForMonth()` per contracts/db-contracts.md Habit Operations
- [x] T010 [P] Implement entry CRUD in `src/lib/db/entries.ts`: `getEntry()`, `getEntriesForMonth()`, `setHabitCompletion()`, `setJournalText()`, `deleteEntry()`, `deleteMonth()` per contracts/db-contracts.md Entry Operations

### App Shell & Stores

- [x] T014 Create Svelte stores in `src/lib/stores/app.ts`: `currentDate` (writable, today), `currentMonthId` (derived from currentDate), `selectedMonth` (writable), `setupPromptOpen` (writable boolean)
- [x] T015 Create global styles in `src/app.css`: CSS custom properties for colors/spacing, mobile-first reset, base typography (320px+), accessible focus styles
- [x] T016 Create app shell layout in `src/routes/+layout.svelte`: semantic HTML shell, Nav component slot, mobile viewport meta tag
- [x] T017 [P] Create Nav component in `src/lib/components/Nav.svelte`: bottom tab bar with Today, Calendar, Charts, Settings tabs — keyboard navigable, ARIA labels, active state indicator

**Checkpoint**: Foundation ready — types defined, DB initialized, all tests green, app shell renders

---

## Phase 3: User Story 1 — Daily Habit Tracking (Priority: P1) 🎯 MVP

**Goal**: User can open the app, see today's habits, mark them complete, and write a journal entry that persists across sessions.

**Independent Test**: Open app → see habits → check/uncheck → write journal → close & reopen → data persists.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T022 [P] [US1] Write unit tests for HabitCheckbox component in `tests/unit/components/HabitCheckbox.test.ts`: renders with label, toggles on click, emits change event, keyboard accessible (Space/Enter)
- [x] T023 [P] [US1] Write unit tests for JournalEditor component in `tests/unit/components/JournalEditor.test.ts`: renders textarea, auto-saves on input (debounced), enforces 2000 char limit, shows character count
- [x] T024 [US1] Write integration test for daily tracking flow in `tests/integration/daily-tracking-flow.test.ts`: create month → mark habits → write journal → verify persistence → verify reload

### Implementation for User Story 1

- [x] T025 [P] [US1] Create HabitCheckbox component in `src/lib/components/HabitCheckbox.svelte`: checkbox input with label, two-way binding for checked state, `on:change` dispatch, semantic `<label>`, `aria-checked` attribute
- [x] T026 [P] [US1] Create JournalEditor component in `src/lib/components/JournalEditor.svelte`: `<textarea>` with auto-save (debounce 500ms via `setJournalText`), 2000 char max, live character counter, `aria-label`
- [x] T027 [US1] Create DayView component in `src/lib/components/DayView.svelte`: renders date header, list of HabitCheckbox components (one per habit), JournalEditor below — all wired to DB operations via `setHabitCompletion` and `setJournalText`
- [x] T028 [US1] Create today's entry page in `src/routes/+page.svelte`: loads current month's habits via `getHabitsForMonth()`, loads today's entry via `getEntry()`, renders DayView component; if no month exists, shows empty state with link to setup

**Checkpoint**: User Story 1 fully functional — daily habit tracking and journaling works end-to-end, data persists offline

---

## Phase 4: User Story 2 — Monthly Setup and Navigation (Priority: P1) 🎯 MVP

**Goal**: User can set up a new month with a mantra and habit list, navigate between months, and view past data (read-only for past months).

**Independent Test**: Create month setup → navigate to previous month → verify data intact → verify habits are read-only for past months.

### Tests for User Story 2

- [x] T030 [P] [US2] Write unit tests for MonthSetup component in `tests/unit/components/MonthSetup.test.ts`: renders form with mantra input + habit list builder, validates required fields, copies previous month habits when offered
- [x] T031 [P] [US2] Write unit tests for MonthCalendar component in `tests/unit/components/MonthCalendar.test.ts`: renders month grid, highlights days with entries, click navigates to day, keyboard navigation between days
- [x] T032 [US2] Write integration test for month setup flow in `tests/integration/month-setup-flow.test.ts`: first visit → setup prompt → create month → verify habits stored → navigate away → return → data intact

### Implementation for User Story 2

- [x] T033 [P] [US2] Create MonthSetup component in `src/lib/components/MonthSetup.svelte`: form with mantra input (max 280 chars), habit name inputs (add/remove rows, reorder), "copy from previous month" checkbox, submit creates month via `createMonth()` + `createHabitsForMonth()`
- [x] T034 [P] [US2] Create MonthCalendar component in `src/lib/components/MonthCalendar.svelte`: renders a month grid (Sun-Sat), each day cell shows entry indicator (dot/color), click navigates to `/month/{year}/{month}/{day}`, keyboard arrow-key navigation between cells
- [x] T035 [US2] Create monthly view page in `src/routes/month/[year]/[month]/+page.svelte`: loads month data via `getMonth()`, loads habits via `getHabitsForMonth()`, loads entries via `getEntriesForMonth()`, renders MonthCalendar; if month not set up, shows MonthSetup
- [x] T036 [US2] Create day detail page in `src/routes/month/[year]/[month]/[day]/+page.svelte`: loads specific entry via `getEntry()`, loads habits, renders DayView in read-only mode if month is in the past (no checkbox toggling)
- [x] T036b [US2] Add delete functionality (FR-019): on day detail page, add a "Delete entry" button (with confirmation dialog) that calls `deleteEntry(date)`. On monthly view, add a "Delete month" option (with double confirmation) that calls `deleteMonth(monthId)` and navigates back
- [x] T037 [US2] Implement first-visit month prompt (FR-017): on app load, check if current month exists in DB; if not, show MonthSetup with "copy from previous month" pre-checked if previous month has data — copy both habits AND mantra from the previous month as defaults
- [x] T038 [US2] Update Nav component in `src/lib/components/Nav.svelte`: add "Calendar" tab linking to current month's calendar view, active state based on current route

**Checkpoint**: User Stories 1 AND 2 both functional — complete monthly setup → daily tracking → month navigation cycle works end-to-end

---

## Phase 5: User Story 3 — Habit Visualization and Charts (Priority: P2)

**Goal**: User can see graphical visualizations of habit completion — bar charts, completion rates, and streaks.

**Independent Test**: Enter 5+ days of habit data → open charts page → verify bar chart shows correct completion per day, completion rate %, and streak info.

### Tests for User Story 3

- [x] T039 [P] [US3] Write unit tests for Charts component in `tests/unit/components/Charts.test.ts`: renders canvas element, has accessible aria-label, updates when data changes, shows "no data" state for empty month
- [x] T040 [US3] Write integration test for chart data accuracy in `tests/integration/chart-accuracy.test.ts`: create month with 5 days of mixed completions → generate chart data → verify labels, dataset values, completion rates match expected

### Implementation for User Story 3

- [x] T041 [P] [US3] Create Charts component in `src/lib/components/Charts.svelte`: wraps Chart.js bar chart, accepts `data` prop (labels + datasets), registers Chart.js modules, handles canvas lifecycle (create/destroy), `role="img"` + `aria-label` for accessibility
- [x] T042 [US3] Create charts page in `src/routes/charts/+page.svelte`: loads current month's habits + entries, computes chart data via `chartDataForMonth()`, computes streaks via `calculateStreaks()`, renders Charts component + streak summary table below chart. **Note**: Multi-month trend summary deferred to v2 (US3 scenario 3)
- [x] T043 [US3] Add data table fallback below chart for screen readers: render a `<table>` with habit names as rows, dates as columns, completion status as cells — visually hidden but accessible to screen readers (`aria-hidden="true"` on visual chart, table linked via `aria-describedby`)
- [x] T044 [US3] Add interactive tap-to-detail: clicking a bar in the chart navigates to that day's entry page (`/month/{year}/{month}/{day}`)

**Checkpoint**: User Story 3 functional — charts accurately visualize habit data with accessible alternatives

---

## Phase 6: User Story 4 — Offline Operation (Priority: P2)

**Goal**: App works fully offline after first visit. PWA is installable.

**Independent Test**: Load app once → go offline → all operations work → PWA install prompt appears.

### Tests for User Story 4

- [x] T045 [US4] Write integration test for offline resilience in `tests/integration/offline.test.ts`: mock service worker → load app → simulate offline → verify all DB operations succeed → verify navigation works → verify service worker serves cached assets
- [x] T046 [US4] Write integration test for PWA installability in `tests/integration/pwa-install.test.ts`: verify manifest.json exists with required fields, verify service worker is registered, verify install prompt can be triggered

### Implementation for User Story 4

- [x] T047 [US4] Configure PWA in `vite.config.ts`: add `SvelteKitPWA` plugin with `registerType: 'autoUpdate'`, manifest (name, short_name, theme_color, icons), workbox config with `globPatterns` and `navigateFallback`
- [x] T048 [US4] Generate PWA icons in `static/`: create `icon-192.png` and `icon-512.png` (simple habit/journal themed icon), add `favicon.ico`
- [x] T049 [US4] Add PWA manifest link in `src/app.html`: `<link rel="manifest" href="/manifest.webmanifest">`, theme-color meta tag, apple-touch-icon
- [x] T050 [US4] Verify offline behavior: test in Chrome DevTools (offline checkbox) that all operations work, IndexedDB persists, service worker caches static assets

**Checkpoint**: User Story 4 functional — app is installable, works offline, service worker caches assets

---

## Phase 7: User Story 5 — Data Export and Import (Priority: P3)

**Goal**: User can export all data as JSON and import it on another device.

**Independent Test**: Export data → clear IndexedDB → import data → verify all records restored.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T051 [P] [US5] Write unit tests for CSV export/import in `tests/integration/export-import.test.ts`: export produces valid CSV with header row, CSV contains all months/habits/entries data, import parses CSV correctly, import merges duplicates (overwrites by primary key), import validates CSV format
- [x] T052 [P] [US5] Write unit tests for ExportImport component in `tests/unit/components/ExportImport.test.ts`: "Export CSV" button triggers CSV download, "Import CSV" button opens file picker, import shows success/error feedback, two distinct buttons rendered

### Implementation for User Story 5

- [x] T053 [P] [US5] Implement CSV export/import operations in `src/lib/db/export.ts`: `exportToCSV()` reads all stores and generates CSV string with headers (type, id, monthId, name, order, date, journalText, habitId, completed, value, key), `importFromCSV()` parses CSV, validates rows by type, merges into stores atomically — per contracts/db-contracts.md Export/Import Operations
- [x] T054 [US5] Create ExportImport component in `src/lib/components/ExportImport.svelte`: two separate buttons — "Exportar CSV" triggers download of `habit-journal-{date}.csv`, "Importar CSV" opens file picker → reads CSV → calls `importFromCSV()` → shows success count or error message
- [x] T055 [US5] Create settings page in `src/routes/settings/+page.svelte`: renders ExportImport component (two CSV buttons), shows app version, shows data stats (months count, total entries)
- [x] T056 [US5] Update Nav component in `src/lib/components/Nav.svelte`: add "Settings" tab linking to `/settings`

**Checkpoint**: User Story 5 functional — export/import works, data portability confirmed

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, edge cases, final validation

- [x] T057 [P] Audit WCAG 2.1 AA compliance: verify all interactive elements have ARIA labels, all focusable elements have visible focus styles, color contrast ratios ≥ 4.5:1, all charts have text alternatives
- [x] T058 [P] Audit keyboard navigation: verify Tab order is logical across all pages, MonthCalendar supports arrow-key navigation, all modals/dialogs trap focus
- [x] T059 [P] Add edge case handling: mantra validation (280 char max), empty habit list prevention, IndexedDB full storage error message, device clock incorrect date handling (warn user if date seems wrong)
- [x] T060 [P] Performance check: verify bundle size < 25KB gzipped (JS), verify first contentful paint < 2s on simulated 3G, verify no layout shift on load
- [x] T061 Run quickstart.md validation: execute all 9 validation scenarios (V1-V9) in `quickstart.md`, document any failures
- [x] T062 [P] Configure GitHub Pages deployment: add GitHub Action workflow in `.github/workflows/deploy.yml` that runs `npm run build` and deploys `build/` to `gh-pages` branch, set `BASE_PATH` env var

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — starts immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 complete — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 complete
- **Phase 4 (US2)**: Depends on Phase 2 complete — can run parallel with US1
- **Phase 5 (US3)**: Depends on Phase 2 complete — can run parallel with US1/US2
- **Phase 6 (US4)**: Depends on Phase 1 complete (PWA config) — can run parallel with US1-US3
- **Phase 7 (US5)**: Depends on Phase 2 complete — can run parallel with US1-US4
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US3 (P2)**: Can start after Phase 2 — no dependencies on other stories
- **US4 (P2)**: Can start after Phase 1 — PWA config is independent of data layer
- **US5 (P3)**: Can start after Phase 2 — no dependencies on other stories

### Within Each User Story

- Tests FIRST (must fail before implementation)
- Components before pages (components are building blocks)
- DB integration after components exist
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004, T005 (all Setup tasks) can run in parallel
- T008, T009, T010 (all DB modules) can run in parallel
- T012, T013 (streaks + stats) can run in parallel
- T022, T023 (US1 tests) can run in parallel
- T025, T026 (US1 components) can run in parallel
- T030, T031 (US2 tests) can run in parallel
- T033, T034 (US2 components) can run in parallel
- T041 (US3 chart component) is independent
- T047, T048, T049 (US4 PWA setup) can run in parallel
- T051, T052 (US5 tests) can run in parallel
- T053 (export/import DB ops) is independent
- T057, T058, T059, T060, T062 (Polish tasks) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for HabitCheckbox component in tests/unit/components/HabitCheckbox.test.ts"
Task: "Write unit tests for JournalEditor component in tests/unit/components/JournalEditor.test.ts"

# Launch all components for User Story 1 together:
Task: "Create HabitCheckbox component in src/lib/components/HabitCheckbox.svelte"
Task: "Create JournalEditor component in src/lib/components/JournalEditor.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Daily Habit Tracking)
4. Complete Phase 4: User Story 2 (Monthly Setup + Navigation)
5. **STOP and VALIDATE**: Full monthly cycle works end-to-end
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Test independently → Deploy/Demo (**MVP!**)
3. US3 → Test independently → Deploy/Demo (charts added)
4. US4 → Test independently → Deploy/Demo (PWA installable)
5. US5 → Test independently → Deploy/Demo (export/import)
6. Polish → Final validation → Production ready

### Total Task Count

- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 16 tasks
- **Phase 3 (US1)**: 7 tasks
- **Phase 4 (US2)**: 10 tasks
- **Phase 5 (US3)**: 6 tasks
- **Phase 6 (US4)**: 6 tasks
- **Phase 7 (US5)**: 6 tasks
- **Phase 8 (Polish)**: 6 tasks
- **Total**: 62 tasks

---

## Notes

- [P] tasks = different files, no dependencies — safe to run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests MUST fail before implementation (TDD — Constitution Principle VI)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution Principles I-X must be upheld throughout implementation
