# Data Model: Habit Journal PWA

**Date**: 2026-08-26

## Entities

### Month

Represents a calendar month. The container for all data within a time period.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Primary key, format `YYYY-MM` | e.g., `"2026-08"` |
| `year` | `number` | Required, >= 2020 | Calendar year |
| `month` | `number` | Required, 1-12 | Calendar month (1 = January) |
| `mantra` | `string` | Max 280 chars, optional | Monthly intention/mantra |
| `habits` | `HabitDefinition[]` | Required, min 1 item | Immutable habit list for this month |
| `setupComplete` | `boolean` | Required, default `false` | Whether the user has completed month setup |

**Validation rules**:
- `id` must match `/^\d{4}-\d{2}$/`
- `habits` array must have at least 1 item when `setupComplete` is `true`
- `mantra` is optional — can be empty string or omitted

**State transitions**:
```
[not created] → setup (setupComplete: false) → ready (setupComplete: true)
```

Once `setupComplete` is `true`, `habits` array is immutable.

---

### HabitDefinition

A habit bound to a specific month. Created during month setup.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Primary key, UUID v4 | Unique across all months |
| `monthId` | `string` | Foreign key → Month.id | Which month this habit belongs to |
| `name` | `string` | Required, 1-100 chars | Display name of the habit |
| `order` | `number` | Required, >= 0 | Sort position within the month |

**Validation rules**:
- `name` must be non-empty after trimming
- `order` must be unique within a month (no two habits share the same order)
- Once created for a month, `name` and `order` are immutable

**Relationships**:
- Belongs to exactly one Month (via `monthId`)
- Has many HabitCompletions (via `id`)

---

### DailyEntry

A single day's record. Created automatically on first interaction (habit mark or journal write).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date` | `string` | Primary key, format `YYYY-MM-DD` | e.g., `"2026-08-26"` |
| `monthId` | `string` | Foreign key → Month.id | Which month this day belongs to |
| `journalText` | `string` | Max 2000 chars, optional | Free-form journal entry |
| `completions` | `Record<string, boolean>` | Optional (defaults to `{}`) | Map of habitId → completed status |

**Validation rules**:
- `date` must match `/^\d{4}-\d{2}-\d{2}$/`
- `monthId` must match the month derived from `date`
- `journalText` truncated at 2000 characters on input
- `completions` keys must be valid habit IDs from the associated month

**State transitions**:
```
[not created] → exists (on first habit mark or journal write)
```

Entries are never deleted automatically — they persist until explicitly removed by the user.

---

### Meta

Schema metadata store.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `key` | `string` | Primary key | Metadata key name |
| `value` | `any` | Required | Metadata value |

**Records**:
- `{ key: "version", value: number }` — Current schema version

---

## Derived Data

### Streak

Computed at runtime, never stored. Calculated from HabitCompletion data.

| Field | Type | Description |
|-------|------|-------------|
| `habitId` | `string` | Which habit this streak belongs to |
| `startDate` | `string` | First day of the streak (`YYYY-MM-DD`) |
| `endDate` | `string` | Last day of the streak (`YYYY-MM-DD`) |
| `length` | `number` | Number of consecutive days |

**Calculation rules**:
- Streak counts consecutive days where `completions[habitId] === true`
- A streak breaks when a day is missed (habit not completed)
- Current streak: from last break point to today (or yesterday if today not yet marked)
- Longest streak: maximum length across all time

### CompletionRate

Computed at runtime for charts.

| Field | Type | Description |
|-------|------|-------------|
| `habitId` | `string` | Which habit |
| `monthId` | `string` | Which month |
| `totalDays` | `number` | Days elapsed in the month (up to today for current month) |
| `completedDays` | `number` | Days where habit was completed |
| `rate` | `number` | `completedDays / totalDays` (0.0 - 1.0) |

---

## IndexedDB Schema

**Database name**: `habit-journal`
**Version**: 1

### Object Stores

| Store | Key Path | Indexes | Description |
|-------|----------|---------|-------------|
| `months` | `id` | — | Month records |
| `habits` | `id` | `by-month` (on `monthId`) | Habit definitions |
| `entries` | `date` | `by-month` (on `monthId`) | Daily entries |
| `meta` | `key` | — | Schema metadata |

### Key Design Decisions

1. **Composite keys avoided**: Using `YYYY-MM` and `YYYY-MM-DD` as string keys enables natural range queries and排序
2. **Habit completions embedded in entries**: Rather than a separate `completions` store, completions are a map inside `DailyEntry`. This keeps reads atomic — fetching a day's data is a single `get()` call.
3. **Month ID derived from date**: `monthId` on entries is denormalized for index-based queries (fetch all entries for a month)
4. **No separate streak store**: Streaks are computed at runtime. Storing them would require invalidation logic on every habit mark — not worth the complexity (Principle I)
