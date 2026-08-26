# DB Contracts: Habit Journal PWA

**Date**: 2026-08-26

These contracts define the IndexedDB API surface used by the application. All data access goes through these functions — no direct `objectStore` access outside `lib/db/`.

---

## Month Operations

```ts
// lib/db/months.ts

/**
 * Get a month by ID (e.g., "2026-08").
 * Returns undefined if month doesn't exist.
 */
function getMonth(id: string): Promise<Month | undefined>

/**
 * Get the most recent month that has data.
 * Returns undefined if no months exist yet.
 */
function getLatestMonth(): Promise<Month | undefined>

/**
 * Get all months that have data, sorted by id descending (newest first).
 */
function getAllMonths(): Promise<Month[]>

/**
 * Create a new month with the given mantra and habits.
 * Sets setupComplete = true immediately.
 * Throws if month already exists.
 */
function createMonth(input: {
  id: string;
  mantra?: string;
  habits: Array<{ name: string; order: number }>;
}): Promise<Month>

/**
 * Update a month's mantra only.
 * Throws if month doesn't exist or setupComplete is false.
 */
function updateMantra(id: string, mantra: string): Promise<void>
```

**Contract rules**:
- `createMonth` must validate `id` format (`YYYY-MM`)
- `updateMantra` must validate length (max 280 chars)
- All operations use IndexedDB transactions — atomic and offline-safe

---

## Habit Operations

```ts
// lib/db/habits.ts

/**
 * Get all habits for a given month, sorted by order.
 */
function getHabitsForMonth(monthId: string): Promise<HabitDefinition[]>

/**
 * Create habits for a month. Replaces any existing habits.
 * Used during month setup.
 * Throws if month doesn't exist.
 */
function createHabitsForMonth(
  monthId: string,
  habits: Array<{ name: string; order: number }>
): Promise<HabitDefinition[]>
```

**Contract rules**:
- Habit names must be non-empty after trimming (max 100 chars)
- Order values must be unique within a month
- `createHabitsForMonth` is idempotent — calling it again with the same data replaces the old habits

---

## Entry Operations

```ts
// lib/db/entries.ts

/**
 * Get a daily entry by date.
 * Returns undefined if no entry exists for that date.
 */
function getEntry(date: string): Promise<DailyEntry | undefined>

/**
 * Get all entries for a given month, sorted by date ascending.
 */
function getEntriesForMonth(monthId: string): Promise<DailyEntry[]>

/**
 * Mark a habit as completed or incomplete for a given date.
 * Creates the entry if it doesn't exist.
 * Throws if habitId doesn't belong to the entry's month.
 */
function setHabitCompletion(
  date: string,
  habitId: string,
  completed: boolean
): Promise<void>

/**
 * Update journal text for a given date.
 * Creates the entry if it doesn't exist.
 * Throws if text exceeds 2000 characters.
 */
function setJournalText(
  date: string,
  text: string
): Promise<void>

/**
 * Delete a daily entry.
 */
function deleteEntry(date: string): Promise<void>

/**
 * Delete all data for a given month (month record + habits + entries).
 */
function deleteMonth(monthId: string): Promise<void>
```

**Contract rules**:
- `setHabitCompletion` must validate that `habitId` exists in the month's habit list
- `setJournalText` must truncate at 2000 characters
- `date` must match `/^\d{4}-\d{2}-\d{2}$/`
- All mutations are atomic (single IndexedDB transaction)

---

## Export/Import Operations (CSV)

```ts
// lib/db/export.ts

/**
 * Export all data as a CSV string.
 * Includes months, habits, and entries in a single file with type-based rows.
 */
function exportToCSV(): Promise<string>

/**
 * Import data from a CSV string.
 * Strategy: merge — existing records are overwritten by primary key, new records are added.
 * No data is deleted during import.
 */
function importFromCSV(csv: string): Promise<{ months: number; habits: number; entries: number }>
```

**CSV format**:
```csv
type,id,monthId,name,order,date,journalText,habitId,completed,value,key
month,2026-08,,August Focus,,2026-08-01,,,,,
habit,abc-123,2026-08,Exercise,0,,,,,,
habit,def-456,2026-08,Read,1,,,,,,
entry,,2026-08,,"Had a great workout today",2026-08-01,,"abc-123",true,,
meta,,,,,,,,,1,version
```

**Row types**:
- `month`: id, year (derived from id), month (derived from id), mantra (in `name` field), setupComplete (always `true` on export)
- `habit`: id, monthId, name, order
- `entry`: monthId (derived from date), date, journalText, habitId, completed (per habit in the entry — one row per habit per day)
- `meta`: key, value

**Contract rules**:
- CSV must have a header row as the first line
- Import must validate row `type` field exists and is one of: `month`, `habit`, `entry`, `meta`
- Import must validate each row's required fields based on type
- Import uses a single transaction per store for atomicity
- Duplicate records (same primary key) are overwritten during merge
- Export generates one row per habit per day for entries (denormalized for CSV simplicity)
- The user-facing buttons are labeled "Exportar CSV" and "Importar CSV"

---

## Statistics (Computed, Not Stored)

```ts
// lib/utils/stats.ts

/**
 * Calculate streaks for all habits in a month.
 */
function calculateStreaks(
  habits: HabitDefinition[],
  entries: DailyEntry[]
): Map<string, { current: number; longest: number }>

/**
 * Calculate completion rate for a habit in a month.
 */
function completionRate(
  habitId: string,
  entries: DailyEntry[],
  totalDaysInMonth: number
): { completed: number; total: number; rate: number }

/**
 * Prepare chart data for a month's habit completion.
 */
function chartDataForMonth(
  habits: HabitDefinition[],
  entries: DailyEntry[]
): {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}
```
