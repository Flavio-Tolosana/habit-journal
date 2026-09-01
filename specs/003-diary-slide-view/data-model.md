# Data Model: Diary Slide View

**Date**: 2026-09-01

## Overview

La función es **solo-lectura**. **No introduce cambios persistentes** en el esquema de IndexedDB (stores `months`, `habits`, `entries`, `meta` permanecen intactos; no hay migración ni `DB_VERSION++`). Lo que se modela aquí es el **modelo de vista derivado** que consume la página `/diary`: cómo se construye la secuencia de slides a partir de las entidades existentes.

## Entidades persistentes existentes (sin cambios)

| Entidad | Store | Clave | Uso en esta función |
|---------|-------|-------|---------------------|
| `Month` | `months` | `id` (`YYYY-MM`) | `mantra` mostrado en cada slide (FR-002) |
| `Habit` | `habits` | `id` (slug) | Resolución de miembros del mes (`memberships`) |
| `DailyEntry` | `entries` | `date` (`YYYY-MM-DD`) | `journalText` → contenido del slide; `completions` → checkmarks de hábitos |
| `Meta` | `meta` | `key` | No se usa |

**Fuente de datos**: `getAllEntries()` (para derivar meses con diario), `getEntriesForMonth(monthId)` (para la secuencia de un mes), `getMonth(monthId)` (para el mantra), `getHabitsForMonth(monthId)` (para la lista de hábitos a revelar).

## Modelo de vista derivado

### DiaryMonth (mes con diario)

Mes que el selector ofrece al usuario. Detallado para el carrusel.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | `/^\d{4}-\d{2}$/` | Mes (`YYYY-MM`) |
| `hasDiary` | `boolean` | `true` | Por construcción — solo meses con ≥1 entrada con texto no vacío |

Derivado de `getAllEntries()`: meses con al menos una `DailyEntry` cuyo `journalText` tras `trim()` no está vacío. Orden de listado: **descendente** (más reciente primero).

### DiarySlide

Una entrada de diario presentada como slide (lectura).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date` | `string` | `/^\d{4}-\d{2}-\d{2}$/` | Fecha del día |
| `journalText` | `string` | no vacío tras trim | Texto del día (contenido del slide) |
| `mantra` | `string \| undefined` | — | `Month.mantra` del mes al que pertenece (FR-002) |
| `completions` | `Record<string, boolean>` | habitId → boolean | `DailyEntry.completions` (para revelar hábitos, FR-019) |

### SlideSequence (secuencia de un mes)

La lista ordenada de `DiarySlide` dentro del mes seleccionado.

| Campo | Regla |
|-------|-------|
| Orden del DOM | **Descendente por fecha** (más reciente a la izquierda) — hoy en `scrollLeft=0` |
| Filtrado | Solo entradas con `journalText` no vacío tras trim (FR-005) |
| Límite | Exclusivamente entradas del mes seleccionado — no cruza fronteras de mes (FR-007) |

## Identity & Relationships

```
Month.id ('YYYY-MM')  1 ──── *  DailyEntry.monthId
   │                                │
   │ mantra                         │ journalText (no vacío) → DiarySlide
   ▼                                ▼
Slides del mes           completions ── * Habit.id (revelable vía toggle)
```

- **DiarySlide** es una proyección de `DailyEntry` + `Month.mantra` + (opcionalmente) `Habit` por cada habitId de `completions`.
- Los checkmarks revelados usan la **misma** identidad de hábito global (`Habit.id`) — coherente con el modelo de la funcionalidad 002.

## State Transitions

Modelo **estático** (solo-lectura): no hay transiciones de estado. Los cambios de la UI (selección de mes, apertura del toggle de hábitos) no alteran datos.

## Validation Rules

- `hasDiaryText(entry): boolean` → `entry.journalText.trim().length > 0` (regla pura, única criterio de inclusión).
- La secuencia de un mes solo contiene `DiarySlide` cuyo `getMonthId(date) === mes seleccionado`.
- El montaje inicial: si hoy tiene diario → hoy; si no → la entrada más reciente con diario **≤ hoy** dentro del mes seleccionado; si el mes no tiene ninguna → estado vacío (FR-011/012).

## Migration

Ninguna — el esquema persistente no cambia.