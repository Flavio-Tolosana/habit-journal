# Implementation Plan: Habit Journal PWA

**Branch**: `001-habit-tracker-pwa` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-habit-tracker-pwa/spec.md`

## Summary

A mobile-first PWA for daily habit tracking and journaling, organized by month. Users define a mantra and habit list at the start of each month, then mark habits complete and write journal entries daily. The app provides chart visualizations of completion data, works fully offline via IndexedDB, and deploys as a static site to GitHub Pages. Built with SvelteKit (static adapter) + TypeScript.

## Technical Context

**Language/Version**: TypeScript 5.x + Svelte 5.x + SvelteKit 2.x

**Primary Dependencies**:
- `svelte` / `@sveltejs/kit` — framework + static adapter
- `idb` — minimal IndexedDB wrapper (~1.2KB)
- `chart.js` — lightweight charting (~60KB, tree-shakeable to ~20KB)
- `vite-plugin-pwa` — PWA service worker + manifest generation

**Storage**: IndexedDB (via `idb` library)

**Testing**: Vitest + `@testing-library/svelte` + `vitest-browser-mode` for component tests

**Target Platform**: Modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+), mobile-first (320px+)

**Project Type**: Web application (PWA, static SPA)

**Performance Goals**: <2s interactive on 3G, <60s for daily habit entry workflow, ~20KB JS gzipped (framework + app code)

**Constraints**: Offline-first, static deployment to GitHub Pages, no server-side logic, single-user local-only data

**Scale/Scope**: Single user, ~12 months of data per year, ~30 habits per month, ~31 daily entries per month, ~5 years of data retention (~1860 entries total)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Over Cleverness | ✅ PASS | Svelte compiles away framework overhead. No virtual DOM. idb is ~1.2KB. Minimal dependency footprint. |
| II. Single Responsibility | ✅ PASS | Clear separation: `lib/db/` (data), `lib/utils/` (business logic), `lib/components/` (UI), `routes/` (pages). |
| III. Data Integrity First | ✅ PASS | All mutations go through `lib/db/` layer. Date handling uses local dates consistently. IndexedDB provides atomic transactions. |
| IV. Offline-First Resilience | ✅ PASS | IndexedDB for all storage. Service worker caches static assets. No network dependency after first visit. |
| V. Minimal Dependency Footprint | ✅ PASS | 4 runtime dependencies (svelte, kit, idb, chart.js). Each justified: framework, static adapter, storage, visualization. |
| VI. Test-Driven Development | ✅ PASS | Vitest + Testing Library. Business logic tested before implementation. Component tests for critical flows. |
| VII. Accessible by Default | ✅ PASS | Semantic HTML, ARIA labels on checkboxes/charts, keyboard navigation, color contrast ratios verified. |
| VIII. Explicit Error Handling | ✅ PASS | IndexedDB errors surfaced to user. Input validation at boundary. No silent failures. |
| IX. Progressive Disclosure | ✅ PASS | Default view is today's entry. Charts and calendar are secondary. Setup prompt only on first visit to new month. |
| X. Versioned Data Contracts | ⚠️ TODO | IndexedDB schema must include version number. Migration path needed for schema changes. Will be defined in data-model.md. |

**Gate Result**: ✅ PASS — No violations. Principle X addressed in Phase 1 (data model versioning).

## Project Structure

### Documentation (this feature)

```text
specs/001-habit-tracker-pwa/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── db-contracts.md  # IndexedDB interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db/
│   │   ├── index.ts          # IndexedDB initialization + schema
│   │   ├── months.ts         # Month CRUD operations
│   │   ├── habits.ts         # Habit definition operations
│   │   ├── entries.ts        # Daily entry operations
│   │   └── export.ts         # Data export/import
│   ├── utils/
│   │   ├── dates.ts          # Date utilities (local date handling)
│   │   ├── streaks.ts        # Streak calculation logic
│   │   └── stats.ts          # Completion rate + chart data transforms
│   ├── components/
│   │   ├── HabitCheckbox.svelte
│   │   ├── JournalEditor.svelte
│   │   ├── MonthCalendar.svelte
│   │   ├── DayView.svelte
│   │   ├── MonthSetup.svelte
│   │   ├── Charts.svelte
│   │   ├── Nav.svelte
│   │   └── ExportImport.svelte
│   └── stores/
│       └── app.ts            # Svelte stores for app state
├── routes/
│   ├── +layout.svelte        # App shell + nav
│   ├── +page.svelte          # Today's entry (default)
│   ├── /month/[year]/[month]/
│   │   ├── +page.svelte      # Monthly view (calendar)
│   │   └── /[day]/+page.svelte  # Specific day entry
│   ├── /charts/
│   │   └── +page.svelte      # Visualization view
│   └── /settings/
│       └── +page.svelte      # Export/import + about
├── app.html                  # HTML shell
├── app.css                   # Global styles (CSS custom properties, mobile-first)
└── vite.config.ts            # Vite + SvelteKit + PWA config

tests/
├── unit/
│   ├── db/
│   │   ├── months.test.ts
│   │   ├── habits.test.ts
│   │   └── entries.test.ts
│   ├── utils/
│   │   ├── dates.test.ts
│   │   ├── streaks.test.ts
│   │   └── stats.test.ts
│   └── components/
│       ├── HabitCheckbox.test.ts
│       └── JournalEditor.test.ts
├── integration/
│   ├── month-setup-flow.test.ts
│   ├── daily-tracking-flow.test.ts
│   └── export-import.test.ts
└── e2e/
    ├── happy-path.test.ts     # Full user journey
    └── offline.test.ts        # Offline resilience
```

**Structure Decision**: Single SvelteKit project. No backend. All data in IndexedDB. Static adapter for GitHub Pages deployment. Routes organized by feature (today, month, charts, settings).

## Complexity Tracking

No constitution violations requiring justification.

## Phase 0: Research

### Research Topics

1. **SvelteKit static adapter for GitHub Pages** — How to configure, base path, trailing slash behavior
2. **idb library patterns** — Best practices for schema versioning, migrations, TypeScript types
3. **Chart.js in Svelte** — Lightweight integration, accessibility, offline behavior
4. **PWA configuration with vite-plugin-p/service worker** — Offline caching strategies
5. **IndexedDB schema versioning** — Migration patterns per Constitution Principle X

See [research.md](./research.md) for full findings.

## Phase 1: Design

### Data Model

See [data-model.md](./data-model.md) for full entity definitions, relationships, validation rules, and IndexedDB schema.

### Interface Contracts

See [contracts/db-contracts.md](./contracts/db-contracts.md) for IndexedDB API contracts.

### Quickstart Validation

See [quickstart.md](./quickstart.md) for runnable validation scenarios.
