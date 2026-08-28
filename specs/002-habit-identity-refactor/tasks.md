---

description: "Task list template for feature implementation"
---

# Tasks: Habit Identity Refactor

**Input**: Design documents from `/specs/002-habit-identity-refactor/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos (la constitución exige TDD en el principio VI — NON-NEGOTIABLE). Cada historia incluye sus tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup

- [X] T001 Definir/ajustar la función `slugify(name)` en `src/lib/utils/slugify.ts` (lowercase, sin acentos, espacios múltiples a uno, eliminar no alfanuméricos, devuelve id determinista). No vacío si el nombre es válido.
- [X] T002 [P] Actualizar `src/lib/db/types.ts` con las nuevas entidades: `Habit` (id, name), `Month.memberships: Array<{ habitId: string; order: number }>` (eliminar `habits: HabitDefinition[]`), `DailyEntry.completions: Record<string, boolean>` usando habitId global. Eliminar/ajustar la interfaz `HabitDefinition` obsoleta.

## Phase 2: Foundational (bloqueante — migración de datos)

- [X] T003 ~~Escribir test (rojo) de migración v1→v2~~ **Descartada**: no hay datos antiguos que migrar (decisión del usuario).
- [X] T004 Escribir test (rojo) de `getAllHabits`, `findHabitByName`, `createHabit`, `getOrCreateHabit`, `getHabitReferenceCount`, `renameHabit`, `deleteHabit` en `tests/unit/db/habits.test.ts` para el nuevo modelo de colección.
- [X] T005 ~~Implementar la migración en `src/lib/db/index.ts`~~ **Descartada**: no hay datos antiguos que consolidar; el esquema se crea fresco (decisión del usuario).
- [X] T006 Implementar el CRUD de la colección global en `src/lib/db/habits.ts`: `getAllHabits` (orden por name), `getHabitById`, `findHabitByName` (coincidencia exacta tras trim, case-sensitive), `createHabit`, `getOrCreateHabit`, `getHabitReferenceCount` (entradas con el habitId + meses que lo incluyen en memberships), `renameHabit`/`deleteHabit` (solo si referenceCount===0, lanzar si no).
- [X] T007 Actualizar `src/lib/db/months.ts` para que `createMonth` reciba `members: Array<{ name: string; order: number }>` y resuelva cada nombre a un hábito global vía `getOrCreateHabit`, guardando `Month.memberships`. `getMonth`/`getAllMonths`/`getLatestMonth`/`updateMantra` se ajustan al nuevo shape.
- [X] T008 Actualizar `src/lib/db/entries.ts`: `upsertEntry`/`getEntry`/`getEntriesForMonth` usan el nuevo shape de `completions`; añadir `getAllEntries()` para sostener rachas/multi-mes.

## Phase 3: User Story 1 — Reusable Habit Collection (P1)

- [X] T009 [P] [US1] Ajustar `src/lib/components/DayView.svelte` para que las completions usen `habit.id` global (sin cambios de lógica; verificar que resuelve habits desde memberships).
- [X] T010 [US1] Ajustar `src/routes/+page.svelte` para leer el mes con `memberships` y resolver los hábitos a la colección (getHabitsForMonth → membresías resueltas).
- [X] T011 [P] [US1] Actualizar `src/lib/utils/streaks.ts` y `src/lib/utils/stats.ts` para recibir todas las entradas relevantes (multi-mes) filtrando por `habit.id` global; el cálculo por fechas consecutivas ya cruza el límite de mes.
- [X] T012 [P] [US1] Escribir tests de rachas/estadísticas multi-mes en `tests/unit/utils/streaks.test.ts` y `tests/unit/utils/stats.test.ts` (racha que cruza de agosto a septiembre; estadísticas coherentes).
- [X] T013 [US1] Ajustar `src/routes/month/[year]/[month]/+page.svelte` para cargar memberships y entradas multi-mes del hábito, pasando todas las entradas a streaks/stats.

**Test independiente (US1)**: configurar mes A y mes B con "Leer"; comprobar que "Leer" es la misma identidad (sin duplicado) y que la racha/completions son consistentes (E2, E3 de quickstart).

## Phase 4: User Story 2 — Recurring Habit Selection in Month Setup (P1)

- [X] T014 [P] [US2] Escribir test del selector/autocomplete en `tests/unit/components/MonthSetup.test.ts`: escribir "Meditar" sugiere el existente; nombre nuevo ofrece "Crear nuevo hábito «X»"; "copiar del mes anterior" reutiliza ids estables.
- [X] T015 [US2] Modificar `src/lib/components/MonthSetup.svelte`: convertir el campo de hábito en autocompletado que consulta `getAllHabits` al escribir; coincidencia exacta tras trim → selecciona el existente; si no, ofrece "Crear nuevo hábito a la colección"; flujo "copiar del mes anterior" reutiliza ids estables. Usar `<datalist>`/listbox accesible (WCAG AA, principio VII).
- [X] T016 [US2] Ajustar `MonthSetup.svelte` para construir el `Month` llamando a `createMonth` con `members: Array<{ name; order }>` (resolución de la colección ocurre en `months.ts`).

**Test independiente (US2)**: configurar un mes eligiendo hábitos pasados de varios meses distintos + uno nuevo; verificar selección y creación (E2 de quickstart).

## Phase 5: User Story 3 — Non-Redundant Data Export (P2)

- [X] T017 [P] [US3] Escribir tests de export/import en `tests/unit/db/export.test.ts`: (a) export de un día con 3 hábitos + diario produce una fila por hábito pero el journalText aparece solo en la primera fila de ese día (FR-010); (b) export incluye colección una vez por hábito, months, memberships, entries por hábito; (c) import en BD limpia restaura 100% de datos (SC-005); (d) import de formato antiguo/`meta` ausente lanza error "formato no soportado".
- [X] T018 [US3] Reimplementar `exportToCSV` en `src/lib/db/export.ts` según `contracts/csv-contracts.md`: cabecera `type,id,name,monthId,mantra,date,journalText,order,completed,value,key`; filas `habit` (colección), `month`, `member`, `entry` (fila-por-hábito; journalText solo en la primera fila de cada día, `completed` 1/0), `meta` con versión. Escapar comas/comillas/espacios en texto.
- [X] T019 [US3] Reimplementar `importFromCSV` en `src/lib/db/export.ts`: validar `meta` con `key=format` (error "formato no soportado" si falta), reconstruir colección → meses → memberships → entradas respetando la integridad referencial.

**Test independiente (US3)**: export→import en BD limpia restaura el 100% de meses, colección, membresías, completions y journalText (E4, E5 de quickstart).

## Phase 6: User Story 4 — Manage Habit Collection (P2)

- [X] T020 [P] [US4] Escribir test de componentes en `tests/unit/components/HabitManager.test.ts`: la lista muestra todos los hábitos; renombrar/eliminar un hábito no referenciado tiene éxito; renombrar/eliminar uno referenciado está bloqueado con mensaje.
- [X] T021 [US4] Crear el componente `src/lib/components/HabitManager.svelte`: lista los hábitos de la colección (nombre, nº de meses y de entradas que lo referencian), con acciones Renombrar/Eliminar habilitadas solo si `getHabitReferenceCount` === 0; si no, deshabilitadas/locked con mensaje explicativo.
- [X] T022 [US4] Crear la página `src/routes/habits/+page.svelte` que renderiza `HabitManager`.
- [X] T023 [US4] Añadir enlace a la página de hábitos desde `src/routes/settings/+page.svelte` (y/o navbar según diseño de navegación existente) de forma accesible.

**Test independiente (US4)**: abrir la página Habits; verificar lista completa y bloqueo de hábitos referenciados (E6 de quickstart).

## Phase 7: Polish & Cross-Cutting

- [X] T024 [P] Ajustar `src/routes/charts/+page.svelte` para agregar los datos de un hábito a lo largo de todos los meses que lo incluyen (historia completa multi-mes), usando `getAllEntries` y las membresías.
- [X] T025 [P] Actualizar `src/lib/components/MonthCalendar.svelte` (si afecta) para resolver hábitos desde memberships en los días con entradas. No afecta: el calendario solo muestra entradas por fecha.
- [X] T026 Actualizar los tests de db existentes (`tests/unit/db/months.test.ts`, `tests/unit/db/entries.test.ts`, `tests/unit/db/habits.test.ts`) al nuevo shape (`memberships`, `completions` por habitId global) para que no queden rotos.
- [X] T027 Verificación final y de conformidad: `npm run check` (0 errores), `npm run lint` (0 errores), `npm run test` (todo en verde, sin tests previos rotos), `npm run build` con `BASE_PATH=/habit-journal`.

---

## Dependency Graph (orden de historias)

```
Setup (T001, T002)
   ↓
Foundational / Migración (T003–T008)   ← bloqueante para todas las historias
   ↓
US1 (T009–T013) ──→ US2 (T014–T016)   (US2 depende de la colección/migración de US1)
   │
   ├──→ US3 (T017–T019)               (depende de modelo/migración, independiente de US1/US2 UI)
   └──→ US4 (T020–T023)               (depende de modelo/migración, independiente de UI de setup)
   ↓
Polish (T024–T027)
```

- **Orden recomendado**: Phase 1 → Phase 2 (obligatorio) → US1 → US2 → (US3 ó US4 en paralelo) → Polish.
- **US3 y US4** comparten como prerrequisito la migración/colección (Phase 2) pero NO dependen entre sí ni de US1/US2 → ejecutables en paralelo tras Phase 2.

## Parallel Execution Examples

- **Tras Phase 1**: `T003 + T004 + T009 + T011 + T014 + T017 + T020` son independientes (test-first de distintas áreas, archivos distintos).
- **Tras Phase 2**: `US3 (T017–T019)` y `US4 (T020–T023)` se pueden implementar en paralelo.
- **Polish**: `T024`, `T025`, `T026` paralelizables.

## Implementation Strategy (MVP)

1. **MVP = User Story 1** (colección global + migración + rachas multi-mes): entrega el núcleo del rediseño de identidad. Entregable: migración sin pérdida, hábitos consolidados por nombre, rachas cruzan meses.
2. **Siguiente**: User Story 2 (selector en setup) — el valor de la colección se hace evidente al elegir hábitos pasados.
3. **Después**: User Story 3 (export sin duplicar journal) y User Story 4 (gestión de hábitos) — paralelizables.
4. **Final**: Polish (charts multi-mes + conformidad de lint/check/test/build).

Cada historia es un incremento desplegable e independientemente testeable (ver criterios por historia arriba).