# DB Contracts: Habit Identity Refactor

**Date**: 2026-08-27

Estos contratos definen la superficie de la API de IndexedDB que usa la aplicación. Todo acceso a datos pasa por las funciones de `lib/db/` — no hay acceso directo a `objectStore` fuera de este módulo.

Los cambios principales respecto a `specs/001-habit-tracker-pwa/contracts/db-contracts.md`:
- `HabitDefinition` por mes se sustituye por `Month.memberships` (inline).
- Nueva colección global `Habit` con `getOrCreateHabit`.
- `habits.ts` expone operaciones de **colección** y el selector.

---

## Habit (Colección global)

```ts
// lib/db/habits.ts

/**
 * Devuelve todos los hábitos de la colección global, ordenados por nombre.
 */
function getAllHabits(): Promise<Habit[]>

/**
 * Busca un hábito por su id (slug). Devuelve undefined si no existe.
 */
function getHabitById(id: string): Promise<Habit | undefined>

/**
 * Busca un hábito por su nombre exacto tras trim (case-sensitive).
 * Devuelve undefined si no existe.
 */
function findHabitByName(name: string): Promise<Habit | undefined>

/**
 * Crea un hábito nuevo en la colección a partir de un nombre.
 * Calcula el slug automáticamente. Lanza si ya existe un hábito con el mismo slug.
 */
function createHabit(name: string): Promise<Habit>

/**
 * Obtiene un hábito existente por nombre exacto, o lo crea si no existe.
 * Devuelve el hábito (existente o recién creado).
 */
function getOrCreateHabit(name: string): Promise<Habit>

/**
 * Cuenta cuántas entradas referencian un habitId en sus completions
 * más cuántos meses lo incluyen en memberships. 0 => renombrable/eliminable.
 */
function getHabitReferenceCount(habitId: string): Promise<number>

/**
 * Renombra un hábito SI referenciaCount === 0. Lanza en caso contrario.
 * El renombrado crea una identidad nueva (nuevo slug) y elimina la antigua.
 */
function renameHabit(habitId: string, newName: string): Promise<Habit>

/**
 * Elimina un hábito de la colección SI referenciaCount === 0. Lanza en caso contrario.
 */
function deleteHabit(habitId: string): Promise<void>
```

**Reglas**:
- `createHabit`/`getOrCreateHabit` deben validar nombre (trim, 1–100 chars) y que `slugify` no devuelva vacío.
- `renameHabit`/`deleteHabit` son las ÚNICAS vías de modificar/borrar la colección — respetan la regla "no referenciado".
- La migración v1→v2 es la única vía que consolida hábitos pre-existentes.

---

## Month Operations

```ts
// lib/db/months.ts

/**
 * Igual que antes, pero month.habits pasa a month.memberships.
 * createMonth recibe miembros por nombre y resuelve a slugs globales.
 */
function getMonth(id: string): Promise<Month | undefined>

function getLatestMonth(): Promise<Month | undefined>

function getAllMonths(): Promise<Month[]>

function createMonth(input: {
  id: string;
  mantra?: string;
  members: Array<{ name: string; order: number }>; // names de la colección
}): Promise<Month>

function updateMantra(id: string, mantra: string): Promise<void>
```

**Reglas**:
- `createMonth` devuelve el `Month` con `memberships` resueltos: para cada `member.name` llama a `getOrCreateHabit(name)` y guarda `{ habitId, order }`.
- `createMonth` debe validar `id` (`YYYY-MM`) y `setupComplete=true` al crearse.

---

## Entry Operations

```ts
// lib/db/entries.ts

/**
 * Sin cambios de firma respecto a v1; internamente completions usa habitId global.
 */
function getEntry(date: string): Promise<DailyEntry | undefined>

function getEntriesForMonth(monthId: string): Promise<DailyEntry[]>

function getAllEntries(): Promise<DailyEntry[]>

function upsertEntry(entry: DailyEntry): Promise<void>
```

**Reglas**: `completions` usa `habitId` global (slug). `getAllEntries` se añade para sustentar rachas/multi-mes (charts).

---

## Migration

```ts
// lib/db/index.ts
const DB_VERSION = 2; // sube de 1
```
El callback `upgrade` (cuando `oldVersion < 2`) consolida `habits` v1 en la colección, reescribe `months.memberships` y `entries.completions` con slugs, y actualiza el esquema de almacenes. No debe lanzar en datos reales (ver `quickstart.md` para el caso de prueba).
