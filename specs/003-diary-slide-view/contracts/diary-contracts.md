# Diary Contracts: Diary Slide View

**Date**: 2026-09-01

Contrato de la capa de lógica pura (`src/lib/utils/diary.ts`) que la página `/diary` y el carrusel consumen. Complementa a [data-model.md](../data-model.md). **No cambia** la API de `lib/db/` existente — se base en ella (solo-lectura).

Funciones de `lib/db/` utilizadas (sin cambios de firma):

```ts
// lib/db/entries.ts
function getAllEntries(): Promise<DailyEntry[]>          // todas, orden ascendente por date
function getEntriesForMonth(monthId: string): Promise<DailyEntry[]>
// lib/db/months.ts
function getMonth(id: string): Promise<Month | undefined>
// lib/db/habits.ts
function getHabitsForMonth(monthId: string): Promise<MonthHabit[]>  // resuelve memberships → { id, name, order }
```

---

## `diary.ts` — funciones puras

```ts
// lib/utils/diary.ts

/**
 * Un día cuenta como entrada de diario si y solo si su journalText
 * no está vacío tras recortar espacios. (FR-005)
 */
function hasDiaryText(entry: Pick<DailyEntry, 'journalText'>): boolean

/**
 * Meses (YYYY-MM) que contienen al menos una entrada con texto de diario,
 * ordenados de más reciente a más antiguo. (FR-006)
 * Solo incluye meses presentes en `entries`; completo y determinista.
 */
function monthsWithDiary(entries: DailyEntry[]): string[]

/**
 * Construye la secuencia de slides de un mes a partir de sus entradas.
 * - Filtra entradas sin texto de diario (FR-005).
 * - Ordena DESCENDENTE por fecha (hoy/la más reciente a la izquierda) — R4.
 * - Solo entradas del monthId dado — no cruza fronteras de mes (FR-007).
 * Devuelve [] si el mes no tiene entradas con diario.
 */
function buildSlideSequence(
  entries: DailyEntry[],      // entradas del mes (getEntriesForMonth)
  monthId: string,            // mes seleccionado (YYYY-MM)
  mantra: string | undefined  // Month.mantra del mes seleccionado (FR-002)
): DiarySlide[]

/**
 * Fecha del slide inicial (FR-004): hoy si tiene diario; si no, la entrada
 * más reciente con diario <= hoy dentro de la secuencia; undefined si no hay.
 */
function initialSlideDate(slides: DiarySlide[], today: string): string | undefined

/**
 * Índice (0-based) en la secuencia descendente del slide correspondiente a
 * initialSlideDate. Sobre él se posiciona scrollLeft = index * slideWidth.
 * Devuelve -1 si `slides` está vacío.
 */
function initialSlideIndex(slides: DiarySlide[], today: string): number
```

## Tipos derivados (contrato de salida)

```ts
/** Proyección de lectura de una entrada de diario presentada como slide. */
interface DiarySlide {
  date: string;                       // 'YYYY-MM-DD'
  journalText: string;                // no vacío tras trim
  mantra: string | undefined;         // Month.mantra del mes (FR-002)
  completions: Record<string, boolean>; // DailyEntry.completions (FR-019)
}
```

## Reglas de uso (responsabilidad de la página `/diary`)

1. **Carga**: `const all = await getAllEntries()` → `const months = monthsWithDiary(all)`.
2. **Mes por defecto**: mes actual (`getMonthId(getToday())`) si existe en `months` o si tiene un `Month` creado; en caso contrario el primer mes de `months` (el más reciente con diario).
3. **Datos del mes**: al seleccionar mes `M`: `entries = await getEntriesForMonth(M)`, `month = await getMonth(M)`, `habits = await getHabitsForMonth(M)` (solo si hay slides y será revelado).
4. **Secuencia**: `slides = buildSlideSequence(entries, M, month?.mantra)`.
5. **Posición inicial**: `index = initialSlideIndex(slides, getToday())`; contenedor en `scrollLeft = index * slideWidth` (sobre `requestAnimationFrame` tras montar).
6. **Estados**: `slides.length === 0` y `months.length === 0` → estado vacío global (FR-012); `slides.length === 0` y `months.length > 0` → estado vacío del mes (FR-011); throw de cualquier lectura → error inline con "Reintentar" (FR-017).
7. **Selector de mes**: pinta `months` (+ el mes actual aunque no tenga diario) con aria-label en español (FR-018); al cambiar, se repite 2–5.
8. **Toggle "Mostrar hábitos"** (FR-019): por slide, `aria-expanded`; renderiza `HabitCheckbox` solo-lectura con `checked = slide.completions[habit.id] ?? false` usando `habits` del mes.

## Errores

- Toda lectura de BD se envuelve en try/catch; el error se muestra inline (nunca se propaga como pantalla en blanco) y se registra con `console.error` (principio VIII).
- `initialSlideIndex` debe devolver un índice válido si `slides.length > 0`; si `slides` está vacío devuelve `-1` y la página muestra el estado vacío.