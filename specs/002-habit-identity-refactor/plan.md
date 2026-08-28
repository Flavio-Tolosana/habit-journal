# Implementation Plan: Habit Identity Refactor

**Branch**: `002-habit-identity-refactor` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-habit-identity-refactor/spec.md`

## Summary

Rediseñar el modelo de datos para que cada hábito sea una entidad global única identificada por su nombre (colección), reutilizable entre meses y gestionable desde un apartado propio; ajustar el export/import CSV al nuevo modelo evitando la duplicación del texto del diario (fila-por-hábito, con el journalText solo en la primera fila de cada día); y extender rachas/gráficas para agregar la historia de un hábito a través de los meses.

**Enfoque técnico** (ver `research.md`):
- `Habit` (colección) con `id` = slug determinista derivado del nombre; los meses usan `memberships` (inline) en lugar de `HabitDefinition` por mes.
- `DailyEntry.completions` usa el id global del hábito.
- Migración IndexedDB `DB_VERSION` 1→2 con consolidación por slug.
- CSV nuevo: colección + months + memberships + entries (fila-por-hábito, journalText solo en la primera fila de cada día).
- Selector autocompletado en MonthSetup; nueva página `habits` de gestión (renombrar/eliminar solo si no referenciado).
- Rachas/stats multi-mes (pasar todas las entradas relevantes al cálculo).

## Technical Context

**Language/Version**: TypeScript 6 / Svelte 5 (runes) / SvelteKit 2 / Vite 8

**Primary Dependencies**: `@sveltejs/adapter-static`, `idb`, `chart.js`, `vite-plugin-pwa`

**Storage**: IndexedDB vía `idb` (offline-first), almacenes: `months`, `habits`, `entries`, `meta`

**Testing**: `vitest` + `jsdom` + `@testing-library/svelte`; comandos: `npm test`, `npm run check`, `npm run lint`

**Target Platform**: PWA web estática en GitHub Pages (subpath `/habit-journal/`), navegadores modernos

**Project Type**: Aplicación web PWA (frontend-only, SPA/SSR estático)

**Performance Goals**: Operaciones de lectura/escritura IndexedDB percibidas como instantáneas (<100ms); sin degradación con meses pasados

**Constraints**: Offline-first, datos solo locales, subpath de GitHub Pages

**Scale/Scope**: Single-user en local; volumen bajo (decenas de hábitos, cientos de entradas)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity Over Cleverness**: El modelo de colección global usa nombre (string) como clave natural, evitando UUIDs por mes. Se reutiliza la indexación por `monthId` existente (by-month). Sin capas de abstracción nuevas.
- **III. Data Integrity First**: La migración debe consolidar nombres sin pérdida de entradas; las mutaciones pasan por funciones únicas en `lib/db/`.
- **IV. Offline-First**: Todo permanece local en IndexedDB.
- **V. Minimal Dependency Footprint**: No se añaden dependencias; normalización de nombres y CSV se implementan con código propio.
- **VI. Test-Driven Development (NON-NEGOTIABLE)**: Tests primero para migración, normalización de nombres, rachas multi-mes y export/import.
- **X. Versioned Data Contracts**: Se sube `DB_VERSION` a 2 con lógica de `upgrade` para migrar datos existentes.
- **Security & Data Validation**: Validación de nombres (trim, longitud 1–100) y entrada de CSV en el punto de entrada.

### Re-check post-diseño (Phase 1)

Gate evaluado tras generar `research.md`, `data-model.md`, `contracts/` y `quickstart.md`.

| Principio | Estado | Notas del diseño |
|-----------|--------|------------------|
| I. Simplicidad | ✅ | `slugify` determinista para `Habit.id` elimina UUIDs por mes y su gestión |
| II. Single Responsibility | ✅ | `habits.ts` (colección), `months.ts` (meses), `entries.ts` (entradas), `export.ts` (CSV) separados |
| III. Data Integrity | ✅ | Migración v1→v2 consolida sin pérdida; funciones únicas validan en el borde |
| IV. Offline-First | ✅ | Todo local: colección, months (memberships inline), entries |
| V. Dependencias | ✅ | Sin dependencias nuevas; slugify + CSV propios |
| VI. TDD | ✅ | Tests planificados para migración, normalización, rachas, export/import (ver quickstart E1–E6) |
| VII. Accesible | ✅ | Selector autocompletado con `datalist`/listbox accesible; gestión de hábitos con HTML semántico |
| VIII. Errores | ✅ | Import inválido lanza error con contexto; opciones locked con mensaje |
| IX. Progressive Disclosure | ✅ | Gestión de hábitos es apartado opt-in; setup mantiene flujo simple |
| X. Versionado | ✅ | `DB_VERSION=2` + migración en `upgrade` |

Todos los gates pasan. Múltiples opciones de diseño se descartaron en `research.md` (UUID por hábito, mantener por-mes, compatibilidad CSV antiguo) con su fundamento.

## Project Structure

### Documentation (this feature)

```text
specs/002-habit-identity-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── db-contracts.md  # Fase 1: contratos de almacenamiento
│   └── csv-contracts.md # Fase 1: contrato del formato CSV
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db/
│   │   ├── index.ts        # migración IndexedDB (v1→v2)
│   │   ├── types.ts        # nuevo modelo (Habit, HabitDefinition, DailyEntry)
│   │   ├── habits.ts       # colección global + membership por mes
│   │   ├── months.ts       # paso a referencias por nombre (sin cambios en API externa)
│   │   ├── entries.ts      # completions por id de hábito global
│   │   └── export.ts       # nuevo formato CSV + import
│   ├── components/
│   │   ├── MonthSetup.svelte      # selector con autocomplete de la colección
│   │   └── HabitManager.svelte    # NUEVO: ver/renombrar/eliminar hábitos
│   └── utils/
│       ├── streaks.ts      # rachas multi-mes
│       └── stats.ts        # estadísticas considerando historia multi-mes
├── routes/
│   ├── settings/+page.svelte       # enlace a gestión de hábitos
│   └── habits/+page.svelte         # NUEVA página de gestión de hábitos
│   └── charts/+page.svelte         # agregación multi-mes

tests/
├── unit/
│   ├── db/
│   │   ├── habits.test.ts          # colección + normalización
│   │   ├── migration.test.ts       # NUEVO: migración v1→v2
│   │   └── export.test.ts          # NUEVO: export/import CSV
│   └── utils/
│       ├── streaks.test.ts         # rachas multi-mes
│       └── stats.test.ts           # estadísticas multi-mes
```

**Structure Decision**: Monorepo de un solo proyecto (frontend-only). Los cambios se concentran en `src/lib/db/` (modelo, migración, export) y en componentes/UI (MonthSetup, nueva página habits, charts). Los tests viven bajo `tests/unit/` replicando la estructura existente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Migración IndexedDB v1→v2 | Conservar datos existentes del usuario (principio X) | Reset de datos se descartó porque viola Data Integrity |
