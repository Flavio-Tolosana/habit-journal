# Implementation Plan: Diary Slide View

**Branch**: `003-diary-slide-view` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-diary-slide-view/spec.md`

## Summary

La función añade una página de **lectura** del diario en formato de slides deslizables (una entrada por día), con un selector de mes arriba. Empieza en el día actual; deslizar el dedo a la **izquierda** navega hacia días más antiguos y a la **derecha** hacia los más recientes, saltando los días sin texto de diario. Es una función solo-lectura sobre los datos existentes de IndexedDB (`entries.journalText`, `Month.mantra`, completions) — **no requiere cambio de esquema ni migración**.

Enfoque técnico (ver `research.md`):
- **Carrusel nativo**: contenedor de scroll horizontal con `scroll-snap-type: x mandatory`, ordenado de más reciente a más antiguo (hoy a la izquierda, posición inicial de scroll 0). Sin dependencia nueva (principios I y V).
- **Nueva ruta** `/diary` con tab "Diario" 📖 en la barra de navegación inferior.
- **Lógica pura** en `src/lib/utils/diary.ts` (meses con diario, secuencia de slides, selección del slide inicial) — testeable y separada de la UI (principio II).
- Datos vía funciones existentes de `lib/db/`: `getAllEntries`, `getEntriesForMonth`, `getMonth`, `getHabitsForMonth`.

## Technical Context

**Language/Version**: TypeScript ~6, Svelte 5 (runes), SvelteKit 2 (adapter-static, SPA)

**Primary Dependencies**: `idb` (existente, solo-lectura); sin dependencias nuevas (principio V — `scroll-snap` es nativo del navegador)

**Storage**: IndexedDB (`lib/db`), read-only sobre las entidades existentes `months`, `habits`, `entries`

**Testing**: Vitest 3 + @testing-library/svelte (jsdom); ESLint + Prettier (existentes)

**Target Platform**: Navegador (PWA mobile-first, ≥320px ancho), offline-capaz

**Project Type**: Web app (frontend estático SvelteKit)

**Performance Goals**: Deslizamiento a 60fps (scroll nativo del navegador); cambio de mes < 500ms

**Constraints**: Offline-first; WCAG 2.1 AA; UI en español; sin dependencias nuevas; principio VI (TDD) — tests primero para la lógica de diary.ts

**Scale/Scope**: Usuario único; ~31 entradas/mes; la consulta de "meses con diario" se deriva de `getAllEntries()` (volumen pequeño, sin índice adicional necesario)

## Constitution Check

*GATE: Debe pasar antes de la investigación Phase 0. Se re-verifica después del diseño Phase 1.*

| Principio | Verificación |
|-----------|--------------|
| I. Simplicity | Carrusel con `scroll-snap` CSS nativo en vez de librería o gestos custom con matemática de punteros. |
| II. Single Responsibility | Lógica de consulta en `utils/diary.ts`; presentación en `DiarySlides.svelte`; carga de datos en la página `/diary`. |
| III. Data Integrity First | Función solo-lectura: no se muta ningún dato. Reutiliza `dates.ts` (sin aritmética de fechas ad-hoc). |
| IV. Offline-First | Solo lecturas de IndexedDB; sin red. |
| V. Minimal Dependency Footprint | 0 dependencias nuevas: `scroll-snap`, `IntersectionObserver`/`scroll` events son APIs nativas. |
| VI. Test-Driven Development | Tests unitarios de `diary.ts` escritos antes de la implementación; tests de componente para el carrusel y el toggle de hábitos. |
| VII. Accessible by Default | Navegación por flechas del teclado, slides enfocables, `aria-label` en español, botón "Mostrar hábitos" accesible. |
| VIII. Explicit Error Handling | Lecturas de BD envueltas en try/catch → error inline con botón "Reintentar" (FR-017). |
| IX. Progressive Disclosure | Checkmarks de hábitos ocultos por defecto tras un botón (FR-019); el deslizamiento es la interacción simple por defecto. |
| X. Versioned Data Contracts | Sin cambio de esquema persistente; los helpers derivados se documentan como contratos en `contracts/diary-contracts.md`. |

**Resultado GATE**: PASADO — sin violaciones. `Complexity Tracking` no requiere entradas.

**Re-verificación post-diseño (Phase 1)**: Confirmado tras `research.md`, `data-model.md` y `contracts/` — el diseño mantiene cero dependencias nuevas (V), no toca el esquema persistente (X), separa lógica pura de presentación (II) y la carga de datos en la página (II), todos los caminos de error están cubiertos inline (VIII), y la secuencia de slides es una proyección validada (III). Sin cambios respecto al GATE inicial.

## Project Structure

### Documentation (this feature)

```text
specs/003-diary-slide-view/
├── plan.md              # Este fichero (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── diary-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── diary/
│   │   └── +page.svelte              # Página del Diario (carrusel + selector de mes)
│   └── +layout.svelte                # (modificado) sin cambios de layout
├── lib/
│   ├── components/
│   │   ├── Nav.svelte                # (modificado) añade tab "Diario" 📖 → /diary
│   │   ├── DiarySlides.svelte        # NUEVO: carrusel scroll-snap de slides (una entrada/día)
│   │   └── MonthSelector.svelte      # NUEVO: selector de mes (dropdown) arriba del carrusel
│   └── utils/
│       └── diary.ts                  # NUEVO: lógica pura (meses con diario, secuencia, slide inicial)

tests/
└── unit/
    ├── utils/
    │   └── diary.test.ts             # NUEVO: tests de lógica pura (TDD)
    └── components/
        └── DiarySlides.test.ts       # NUEVO: tests del carrusel y toggle de hábitos
```

**Structure Decision**: Proyecto único SvelteKit (la app ya es un único frontend SvelteKit — no se introduce monorepo ni backend). El componente ~30 líneas de `MonthSelector` podría colapsarse dentro de `+page.svelte`; se separa solo si supera esa complejidad (principio I). La presentación del carrusel vive en `DiarySlides.svelte` porque encapsula scroll-snap, teclado y el toggle "Mostrar hábitos" (prueba de nivel de abstracción justificada).

## Complexity Tracking

No hay violaciones del constitution que justificar — tabla vacía.