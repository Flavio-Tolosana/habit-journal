# Quickstart Validation: Habit Journal PWA

**Date**: 2026-08-26

## Prerequisites

- Node.js 18+
- npm or pnpm
- Modern browser (Chrome, Firefox, Safari, Edge)

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run check
```

## Validation Scenarios

### V1: First-Time User — Month Setup

**Prerequisites**: Fresh browser (no IndexedDB data)

1. Open `http://localhost:5173`
2. **Expected**: Empty state — no month data exists. A setup prompt appears asking to create a new month.
3. Enter a mantra: "August focus"
4. Add 3 habits: "Exercise", "Read", "Meditate"
5. Submit the setup
6. **Expected**: Today's date is shown with 3 habit checkboxes and a journal text area.
7. Close the browser tab
8. Reopen `http://localhost:5173`
9. **Expected**: The same month, habits, and any entered data persist.

**Validates**: FR-001, FR-002, FR-005, FR-006, FR-017, SC-003

---

### V2: Daily Habit Tracking

**Prerequisites**: Month already set up (from V1)

1. Open the app → see today's entry
2. Check the "Exercise" checkbox
3. **Expected**: Checkbox is marked, data persists without any save button
4. Write "Had a great workout today" in the journal area
5. **Expected**: Text saves automatically (verify by checking IndexedDB in DevTools > Application > IndexedDB)
6. Uncheck the "Exercise" checkbox
7. **Expected**: Checkbox is now unchecked
8. Close and reopen the app
9. **Expected**: Exercise is unchecked, journal text is preserved

**Validates**: FR-004, FR-005, FR-008, SC-001, SC-003

---

### V3: Month Navigation

**Prerequisites**: At least one month with data

1. Open the app → see today's entry
2. Navigate to the calendar/month view
3. Select a previous day in the current month
4. **Expected**: That day's habits and journal entry are shown
5. Navigate to a previous month (if data exists)
6. **Expected**: Previous month's habits and data are displayed correctly
7. Navigate back to the current month
8. **Expected**: All data is intact

**Validates**: FR-007, FR-018, SC-007

---

### V4: Month Transition Prompt

**Prerequisites**: Current month has data, no data for the next month

1. Manually advance the device clock to the 1st of the next month (or test with a mock date)
2. Open the app
3. **Expected**: A prompt appears: "Would you like to carry over last month's habits and mantra, or start fresh?"
4. Choose "Carry over"
5. **Expected**: Previous month's habits and mantra are pre-filled in the setup
6. Submit the setup
7. **Expected**: New month is created with the carried-over habits

**Validates**: FR-017

---

### V5: Charts and Visualization

**Prerequisites**: Month with at least 5 days of habit data

1. Navigate to the charts view
2. **Expected**: Bar chart shows daily habit completion for the current month
3. Check that completion rate percentage is displayed
4. Check that streak information is shown
5. Tap on a data point
6. **Expected**: Day details are shown (habits completed, journal entry)

**Validates**: FR-009, FR-010, FR-011, SC-005, SC-006

---

### V6: Offline Operation

**Prerequisites**: App loaded at least once (service worker installed)

1. Open Chrome DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh the app
4. **Expected**: App loads and functions normally (service worker serves cached assets)
5. Mark habits, write journal entry
6. **Expected**: All changes persist (IndexedDB works offline)
7. Navigate between months
8. **Expected**: All data accessible
9. Uncheck "Offline"
10. **Expected**: App continues to work, no data loss

**Validates**: FR-012, SC-004, SC-008

---

### V7: Export and Import (CSV)

**Prerequisites**: App with existing data

1. Go to settings
2. Tap "Exportar CSV"
3. **Expected**: A CSV file (`habit-journal-{date}.csv`) is downloaded
4. Open DevTools → Application → IndexedDB → habit-journal → right-click → "Delete database"
5. Refresh the app (should show empty state)
6. Go to settings → "Importar CSV" → select the exported file
7. **Expected**: All months, habits, and entries are restored
8. Verify charts show the same data as before export

**Validates**: FR-014, FR-015

---

### V8: Accessibility Check

**Prerequisites**: Any screen with data

1. Navigate using only keyboard (Tab, Enter, Space, Arrow keys)
2. **Expected**: All interactive elements are focusable and operable
3. Open a screen reader (VoiceOver, NVDA, or TalkBack)
4. **Expected**: Habit checkboxes are announced with their label and state
5. **Expected**: Charts have text alternatives describing the data
6. Check color contrast (DevTools > Rendering > Contrast ratio)
7. **Expected**: All text meets 4.5:1 contrast ratio (WCAG AA)

**Validates**: FR-020, SC-006

---

### V9: Unit Test Coverage

```bash
npm run test:coverage
```

**Expected**:
- Business logic (`lib/utils/`) has ≥90% line coverage
- Data layer (`lib/db/`) has integration tests for all CRUD operations
- Component tests exist for HabitCheckbox, JournalEditor, MonthSetup
