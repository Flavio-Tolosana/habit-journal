# Feature Specification: Habit Identity Refactor

**Feature Branch**: `002-habit-identity-refactor`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Rediseñar el modelo de datos para que el hábito se identifique por su nombre (colección global reutilizable entre meses, poder seleccionar hábitos pasados al crear un mes) y rediseñar el export CSV actual, que repite el texto del diario de forma redundante."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reusable Habit Collection (Priority: P1)

As a user, I want my habits to be identified by their name as a persistent, reusable collection, so that when I set up a new month I can pick from habits I've used before instead of retyping them, and so that the same habit is recognized across months as a single thing.

**Why this priority**: This is the core of the request. It changes the fundamental identity model — a habit is no longer a throwaway instance per month but a stable, name-based entity. Without this, the other improvements (selecting past habits, cleaner data semantics) cannot exist.

**Independent Test**: Can be tested by setting up a first month with habits, then setting up a second month and verifying the habits from the first month are offered as selectable options, and that selecting one reuses the same identity (not a duplicate).

**Acceptance Scenarios**:

1. **Given** a habit named "Meditar" already exists from a previous month, **When** the user sets up a new month and starts typing "Meditar", **Then** the app suggests "Meditar" as an option derived from the collection of previously used habits.
2. **Given** the user selects a previously used habit during month setup, **When** the month is created, **Then** the habit retains the same identity/name as before (no duplicate created).
3. **Given** the user creates a brand-new habit whose name does not exist in the collection, **When** the month is created, **Then** the new habit is added to the collection and becomes available for future months.
4. **Given** the user has set up multiple months all containing a habit named "Leer", **When** they review their data, **Then** "Leer" is treated consistently across those months (single identity, not independent copies).

---

### User Story 2 - Recurring Habit Selection in Month Setup (Priority: P1)

As a user, I want to explicitly select from my past habits when configuring a month, rather than only copying wholesale from the previous month, so I can build each month's habit list from any of my habits, not just last month's set.

**Why this priority**: Closely tied to the collection concept — the value of a global habit collection is realized when the user can choose which of their known habits to include. It directly improves the month-setup workflow.

**Independent Test**: Can be tested by setting up a month and confirming that habits from multiple different past months (not just the immediately previous one) can be added to the current month's list.

**Acceptance Scenarios**:

1. **Given** the user is configuring a new month's habits, **When** they add a habit, **Then** they can choose from all habits previously used across any past month, not just the most recent.
2. **Given** the user is in month setup, **When** they add a habit from the past-habit selector, **Then** it appears in the month's habit list in the chosen order alongside any new habits they type.
3. **Given** the user chooses the "copy from previous month" option, **When** the copy completes, **Then** the habits are reused from the collection (same names/identities), not recreated as new instances.

---

### User Story 3 - Non-Redundant Data Export (Priority: P2)

As a user, I want my exported CSV to represent my data faithfully without repeating the journal text once per habit, so the backup file is smaller and the semantics are cleaner.

**Why this priority**: This addresses the observed deficiency in the current export where the same day's journal text is duplicated across multiple rows (one per habit). It directly improves data portability and file quality.

**Note on scope**: The row model remains per-habit (one CSV row per habit completion), as confirmed. The improvement ensures the journal text for a day is not needlessly repeated for every habit in that day's row. The export format is permitted to change because it is used for manual backup/restore only.

**Independent Test**: Can be tested by exporting a month that has days with multiple habits completed and a journal entry, then inspecting the file and confirming the journal text appears without per-habit duplication.

**Acceptance Scenarios**:

1. **Given** a day has 3 habits completed and a journal entry, **When** the data is exported, **Then** the journal text is not repeated 3 times — it appears exactly once per day.
2. **Given** the user exports their data, **When** the file is examined by a tool, **Then** it contains the global habit collection (each unique habit listed once) plus the per-month habit references and daily completion rows.
3. **Given** the user exports and then imports the file into a fresh installation, **When** the import completes, **Then** all months, habits, completions, and journal text are restored accurately.

---

### User Story 4 - Manage Habit Collection (Priority: P2)

As a user, I want to view and correct my collection of habits in a dedicated section, so I can fix or remove a habit I created by accident (e.g., a duplicate or a misspelled name).

**Why this priority**: The autocomplete selection workflow avoids most duplicates, but mistakes can still happen (e.g., saving a typo as a new habit). Without a management view the user cannot undo such mistakes, which undermines the trust in the collection. It is a supporting flow for the P1 collection feature.

**Independent Test**: Can be tested by creating two similar-but-distinct habits, then opening the habit management section, confirming both are listed, and confirming a referenced habit cannot be renamed/deleted while an unreferenced one can.

**Acceptance Scenarios**:

1. **Given** the user opens the habit management section, **When** the collection is rendered, **Then** every habit in the collection is listed.
2. **Given** a habit has never been used in any daily entry, **When** the user renames it, **Then** the rename succeeds and the habit now appears under the new name.
3. **Given** a habit has never been used in any daily entry, **When** the user deletes it, **Then** the habit is removed from the collection.
4. **Given** a habit has been used in at least one daily entry, **When** the user attempts to rename or delete it, **Then** the action is blocked (the habit is locked).

---

### Edge Cases

- What happens if the user renames a habit? → **Resolved**: A habit's name is its identity. Renaming is permitted through the habit management view **only** when the habit is not referenced by any daily entry; otherwise the habit is locked (see FR-016/FR-017). Renaming intentionally recreates the identity; historical months that referenced the habit are kept intact.
- What happens when two habits with the same name but different spelling/case are entered (e.g., "Meditar" vs "meditar")? → **Resolved**: Names are compared exactly after trimming (case-sensitive, "Meditar" ≠ "meditar"). Duplicates are avoided by UX: habits are selected from an autocomplete dropdown, and a name matches only if it equals an existing collection name exactly; otherwise the user creates a new collection habit. Non-existent names never collide silently.
- What happens to existing user data (months already configured) when the new model is introduced? → **Resolved via migration**: existing habits must be migrated so that existing completion data is not lost and existing habit names are consolidated into the collection.
- What happens when the user deletes a habit from the collection that is still referenced by past months? → **Resolved**: Deleting is blocked for any habit referenced by a daily entry (FR-017), so this scenario cannot occur; referenced habits are locked. Only unreferenced habits can be deleted.
- What happens if a user imports a CSV produced by the old format? → **Resolved**: Only the new export format is supported; importing an old-format CSV is not required (confirmed Q2). A clear error is shown if the file does not match the new format.
- What happens when the collection contains a habit with a leading/trailing space that looks identical to another? → Names are trimmed before comparison to avoid near-duplicates.
- Can a habit's streak span across months? → **Resolved**: Yes (confirmed Q3). A streak is computed across the habit's full history using its stable identity, so consecutive completed days continue across month boundaries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain a persistent collection of habits, each uniquely identified by its name. Each habit in the collection MUST be unique (no two distinct habits with the same normalized name).
- **FR-002**: When a month is set up, the habits included in that month MUST reference the global habit collection. Selecting an existing habit name MUST reuse the same identity as all other months that used that name.
- **FR-003**: When creating a new habit whose normalized name does not yet exist in the collection, System MUST add it to the collection and include it in the current month.
- **FR-004**: During month setup, System MUST offer a way to select from the full collection of previously used habits (across all past months), not only from the immediately previous month.
- **FR-005**: The "copy from previous month" option MUST reuse the collection identities of the previous month's habits (same names, same identities), not create new independent instances.
- **FR-006**: A habit's month membership and ordering MUST be preserved independently of the global collection (i.e., which habits a month includes and their order can differ per month even if they share identity).
- **FR-007**: Daily habit completions MUST be recorded against the stable habit identity, so that a habit's history is consistent across months.
- **FR-008**: System MUST migrate existing user data (months, habits, completions) to the new model without data loss. Existing habit names MUST be consolidated into the collection; existing completion data MUST remain attached to the correct habit.
- **FR-009**: The exported CSV MUST contain a representation of the global habit collection, listing each unique habit once with its stable identity.
- **FR-010**: The exported CSV MUST use per-habit granularity for completions (one row per habit) while NOT repeating the journal text once per habit. Each day's journal text MUST appear exactly once in the export (the first row of each day carries the text; subsequent rows of the same day leave it empty).
- **FR-011**: The exported CSV MUST contain per-month habit membership/order and per-day habit completion rows, using stable habit identities.
- **FR-012**: System MUST support importing a CSV produced by the new export format, restoring months, the habit collection, completions, and journal text accurately.
- **FR-013**: Habit names MUST be matched against the collection using exact comparison after trimming (case-sensitive). The autocomplete selector MUST suggest existing collection habits as the user types; an entered name that exactly matches an existing habit MUST select that habit, and one that does not match MUST be offered as "create new habit in the collection". This prevents near-duplicate habits from being created silently.
- **FR-014**: Charts, streaks, and completion-rate calculations MUST account for a habit's complete history across months using its stable identity. A streak MUST be able to cross month boundaries (e.g., completion on the last day of one month and the first day of the next counts as consecutive). Charts MUST be able to aggregate a habit's data across multiple months.
- **FR-015**: System MUST provide a dedicated habit management view that lists all habits in the collection, so the user can review what habits exist (including any created by accident).
- **FR-016**: System MUST allow renaming a habit in the habit management view, but ONLY when the habit is not referenced by any daily entry. If it is referenced, the habit MUST be locked from renaming.
- **FR-017**: System MUST allow deleting a habit from the collection in the habit management view, but ONLY when the habit is not referenced by any daily entry. If it is referenced, deletion MUST be prevented.

### Key Entities

- **Habit (Collection)**: A persistent, globally unique habit identified by its normalized name. It is the single source of truth for a habit's identity and is reusable across any number of months. Key attributes: normalized name, stable identifier.
- **Month Habit (Membership)**: The inclusion of a habit in a specific month, with an order position. References a habit from the collection. Multiple months can reference the same collection habit, each with its own order.
- **Month**: Represents a calendar month. Contains a mantra and a list of month-habit memberships (ordered). Key attributes: year, month number, mantra, setup complete flag.
- **Daily Entry**: Represents a single day's record. Key attributes: date, journal text, and a map of habit completions (habit identity → completed boolean).
- **Habit Completion**: The record that a specific habit was completed on a specific day. Key attributes: habit identity, date, completed status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can set up a new month by selecting from previously used habits in less than 3 interactions (select + confirm), without retyping the habit name.
- **SC-002**: 100% of existing user data (months, habits, completions, journal text) is preserved through the migration to the new model — no entries lost.
- **SC-003**: A habit used across multiple months is always recognized as the same identity (single record in the collection per unique name).
- **SC-004**: In the exported CSV, a day's journal text appears exactly once regardless of how many habits were completed that day (0 duplication).
- **SC-005**: The export→import round trip restores 100% of data (months, collection, habits, completions, journal text) accurately in a fresh installation.
- **SC-006**: Charts and streak calculations correctly account for a habit's history; a streak that crosses a month boundary is computed correctly (e.g., a habit completed every day in the last week of August and first week of September is shown as one continuous streak).

## Assumptions

- The app remains single-user with data stored locally in the browser (IndexedDB).
- The habit collection is derived from and maintained by the history of months the user has created and through the dedicated habit-management view; habits can be created/reused during month setup and reviewed/corrected in the management view.
- Renaming a habit is only allowed when it is not referenced by any daily entry; renaming intentionally recreates the identity (confirmed Q1).
- Deleting a habit from the collection is only allowed when it is not referenced by any daily entry; referenced habits are locked (confirmed Q1).
- The exported CSV may change format from previous versions; old-format CSVs are not required to import successfully (confirmed by user).
- The export format keeps the per-habit row granularity for completions (confirmed by user), with the day's journal text written only on the first row of that day so it is not duplicated.
- Data migration must run automatically and transparently when the app next loads existing data, preserving all user content.

## Clarifications

### Session 2026-08-27

- Q: ¿Cómo debe normalizarse el nombre de un hábito para considerar que dos variantes son el mismo hábito? → A: Comparación exacta tras recortar espacios (sensible a mayúsculas, "Meditar" ≠ "meditar"). La prevención de duplicados se apoya en la UX: el hábito se elige de un desplegable autocompletado; si lo escrito no coincide exactamente, se ofrece "crear hábito nuevo en la colección".
- Q: (nuevo alcance) Gestión de la colección → A: Añadir un apartado para ver los hábitos y poder modificarlos (renombrar/eliminar) siempre que no hayan sido referenciados en ninguna entrada.
- Q: Compatibilidad de importación con CSV antiguos (Q2) → A: No es necesario mantenerla; solo se soporta el nuevo formato.
- Q: Alcance de gráficas/rachas multi-mes (Q3) → A: Extender las rachas y gráficas para agregar la historia de un hábito a través de varios meses (p. ej. una racha que cruce meses) usando la identidad única del hábito.
