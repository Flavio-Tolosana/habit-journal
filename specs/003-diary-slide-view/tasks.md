# Tasks: Diary Slide View

**Input**: Design documents from `/specs/003-diary-slide-view/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/diary-contracts.md, quickstart.md

**Tests**: La constitución del proyecto (principio VI, NON-NEGOTIABLE) exige TDD para toda lógica de negocio; por eso los tests de `diary.ts` y de los componentes se escriben **antes** de la implementación y deben fallar primero. Los tests de regresión existentes no deben romperse.

**Organization**: Tasks agrupadas por user story (US1, US2, US3) para permitir implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (distintos archivos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (SvelteKit 5 + TypeScript)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verificar que el entorno existente está en verde antes de tocar nada (el proyecto ya está inicializado; no hay dependencias nuevas que instalar).

- [x] T001 Run baseline quality gates: `npm test`, `npm run check`, `npm run lint` and confirm all pass before any change (constitution gates)

**Checkpoint**: Entorno verificado y en verde.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lógica pura del dominio de diario (`src/lib/utils/diary.ts`) que TODAS las user stories consumen (US1 → `buildSlideSequence`/`initialSlideIndex`; US2 → `monthsWithDiary`; US3 → señales de vacío). Sin este módulo ninguna story es implementable.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Write unit tests for `hasDiaryText`, `monthsWithDiary`, `buildSlideSequence`, `initialSlideDate`, `initialSlideIndex` in `tests/unit/utils/diary.test.ts` per `contracts/diary-contracts.md` — write FIRST, expect them to fail/compile-error (TDD, principio VI)
- [x] T003 Implement `src/lib/utils/diary.ts`: types (`DiarySlide`), `hasDiaryText` (FR-005), `monthsWithDiary` (FR-006), `buildSlideSequence` (filtra texto no vacío, orden descendente por fecha, no cruza meses — FR-005/007), `initialSlideDate` (FR-004), `initialSlideIndex`, siguiendo `contracts/diary-contracts.md` y `data-model.md`; run tests until green

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse Daily Diary Entries as Slides (Priority: P1) 🎯 MVP

**Goal**: Página `/diary` que muestra una entrada de diario por slide (fecha + texto + mantra), deslizable hacia la izquierda (atrás en el tiempo) y derecha (adelante), empezando por el día actual, saltando días sin texto, con navegación por teclado y checkmarks de hábitos ocultos tras un botón.

**Independent Test**: Poderse probar teniendo ≥2 días con entradas de diario: abrir `/diary`, ver hoy como primer slide, deslizar izquierda → entrada anterior (saltando días vacíos), deslizar derecha → volver a hoy (US1, escenarios A1–A7 de spec.md).

### Tests for User Story 1 (obligatorios por TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

^- [x] T004 [US1] Write component tests for `DiarySlides.svelte` in `tests/unit/components/DiarySlides.test.ts`: renderiza solo días con diario (FR-005), muestra fecha + texto + mantra (FR-002), flechas de teclado `←`/`→` mueven slides (FR-015), texto largo con scroll vertical (FR-010), toggle "Mostrar hábitos" con `aria-expanded` oculto por defecto (FR-019)

### Implementation for User Story 1

^- [x] T005 [US1] Implement `src/lib/components/DiarySlides.svelte`: carrusel con `scroll-snap-type: x mandatory` (R0), slides `<article>` con `tabindex="0"`, navegación por teclado `scrollIntoView`/`scrollBy`, indicador de borde en extremos (FR-009), debounce natural de deslizamientos rápidos (FR-014), botón por slide "Mostrar hábitos" que alterna `aria-expanded` y lista `HabitCheckbox` read-only (`checked = completions[habit.id] ?? false`) (FR-019)
^- [x] T006 [US1] Create route page `src/routes/diary/+page.svelte`: carga `getAllEntries()` + `getMonthId(getToday())` para el mes por defecto, `getEntriesForMonth` + `getMonth` + `getHabitsForMonth`, construye slides con `buildSlideSequence`, posiciona `scrollLeft = initialSlideIndex * slideWidth` en `requestAnimationFrame` (FR-004), pasa `habits`/`mantra`/`completions` a `DiarySlides` (depende de T003, T005)
^- [x] T007 [P] [US1] Add "Diario" 📖 tab (href `/diary`) to navigation in `src/lib/components/Nav.svelte` using existing `base` from `$app/paths` (FR-001)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Month Selector for Filtering (Priority: P1)

**Goal**: Selector de mes en la parte superior de `/diary` que lista solo meses con ≥1 día de diario (más reciente primero), limita la secuencia de slides al mes elegido y refleja el mes del slide actual.

**Independent Test**: Poderse probar teniendo entradas de diario en ≥2 meses: elegir un mes pasado en el selector y verificar que el carrusel muestra solo entradas de ese mes, empezando por la más reciente de ese mes (US2, escenarios B1–B5 de spec.md).

### Tests for User Story 2 (obligatorios por TDD) ⚠️

^- [x] T008 [P] [US2] Write component tests for `MonthSelector.svelte` in `tests/unit/components/MonthSelector.test.ts`: lista solo meses con diario más el mes actual aunque no tenga (FR-006), orden descendente, muestra mes/año de la selección (FR-008), `aria-label` en español (FR-018)

### Implementation for User Story 2

^- [x] T009 [US2] Implement `src/lib/components/MonthSelector.svelte`: dropdown/lista de opciones con meses con diario (orden descendente) + mes actual, etiqueta del mes actualmente mostrado (FR-008), textos en español (FR-018) (depende de T003)
^- [x] T010 [US2] Integrate `MonthSelector` en `src/routes/diary/+page.svelte`: al cambiar el mes → recargar `getEntriesForMonth`/`getMonth`/`getHabitsForMonth`, reconstruir slides limitados al mes (FR-007) y reposicionar `scrollLeft` en la entrada más reciente del mes (FR-006); al seleccionar el mes actual volver a empezar en hoy (escenario B5) (depende de T006, T009)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Empty State and No-Entry Feedback (Priority: P2)

**Goal**: Mensajes claros cuando no hay entradas (mes sin diario o app sin ningún diario) y manejo explícito de errores de lectura de IndexedDB con reintento inline.

**Independent Test**: Poderse probar seleccionando un mes sin diario (mensaje FR-011), con la app vacía (FR-012) y simulando un fallo de lectura (error inline + "Reintentar" recupera, FR-017) — US3, escenarios C1–C3 de spec.md.

### Tests for User Story 3 (obligatorios por TDD) ⚠️

^- [x] T011 [US3] Write component tests for the `/diary` page states in `tests/unit/components/DiaryPage.test.ts` (mocking `$lib/db/*` como en `MonthSetup.test.ts`): mes sin diario → mensaje "No hay entradas de diario para este mes." (FR-011); app sin diario → mensaje invitando a escribir la primera entrada (FR-012); lectura lanza → error inline con botón "Reintentar" que al pulsarlo (con el mock resuelto) carga el contenido (FR-017)

### Implementation for User Story 3

^- [x] T012 [US3] Implement global empty state (`months.length === 0`) and per-month empty state (`slides.length === 0`) in `src/routes/diary/+page.svelte` with Spanish messages (FR-011/012, FR-018) (depende de T006)
^- [x] T013 [US3] Wrap all DB reads in `src/routes/diary/+page.svelte` in try/catch → inline error UI with "Reintentar" button that re-runs the load flow, `console.error` logging (FR-017, principio VIII) (depende de T012)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias user stories y cierre de calidad (FR-018, accesibilidad, gates).

^- [x] T014 [P] Audit all new user-facing strings across `src/routes/diary/+page.svelte`, `src/lib/components/DiarySlides.svelte`, `src/lib/components/MonthSelector.svelte` and Nav — all Spanish (FR-018)
^- [x] T015 [P] Accessibility pass (WCAG 2.1 AA): focus visible en slides/tabs/botones, `aria-expanded` correcto en "Mostrar hábitos", navegación completa solo con teclado (FR-015, principio VII), contraste de color, etiquetas en español
^- [x] T016 Run quickstart.md validation scenarios E1–E7 (`npm run dev`) and confirm all expected results
^- [x] T017 Run final quality gates: `npm test`, `npm run check`, `npm run lint`, `npm run build` (con `BASE_PATH=/habit-journal`) — 0 errores y ningún test existente roto (constitution gates)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US3 (Phase 5): US3 depende de la página `+page.svelte` creada en US1 (T006)
  - US2 (Phase 4) puede empezar tras Foundational; su integración total (T010) depende de la página (T006)
  - US3 no bloquea nada posterior; es la última story en orden de prioridad (P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates con la página de US1 (T006) pero el componente `MonthSelector` es independientemente testeable
- **User Story 3 (P2)**: Depends on US1 page (T006) - se implementa después de US1/US2 por orden de prioridad

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD, principio VI)
- Lógica pura (diary.ts) antes que componentes
- Componentes antes que integración en la página
- Story complete before moving to next priority

### Parallel Opportunities

- T007 (Nav tab) corre en paralelo con T006 (página /diary) — distintos archivos
- T004 (test DiarySlides) y T007 (Nav) son paralelizables entre sí
- T008 (test MonthSelector, US2) puede lanzarse junto al trabajo de US1
- T011 (test estados de página, US3) puede escribirse tras existir la página (T006)
- T014 y T015 (polish) corren en paralelo

---

## Parallel Example: Post-Foundational Sprint

```bash
# Tras completar T002–T003 (Foundational), lanzar en paralelo:
Task: "Implement DiarySlides.svelte (T005)"            # US1
Task: "Add Diario tab to Nav.svelte (T007)"            # US1 [P]
Task: "Write MonthSelector.test.ts (T008)"             # US2 [P]

# En paralelo tras T006:
Task: "Integrate MonthSelector into /diary (T010)"     # US2
Task: "Write DiaryPage.test.ts empty/error (T011)"     # US3
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 verificación en verde)
2. Complete Phase 2: Foundational (T002 tests rojos → T003 diary.ts verde) — CRITICAL
3. Complete Phase 3: User Story 1 (T004 tests → T005/T006/T007)
4. **STOP and VALIDATE**: Test US1 independientemente (`npm test`, manual E1/E2/E6/E7)
5. Deploy/demo si se desea (MVP = slides navegables)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Test independiente → Deploy/Demo (MVP)
3. User Story 2 → Test independiente → Deploy/Demo (selector de mes)
4. User Story 3 → Test independiente → Deploy/Demo (estados vacíos y errores)
5. Polish → gates finales

### Parallel Team Strategy

Con varios desarrolladores:

1. T001 → T002/T003 (foundation) juntos
2. Una vez la foundation está lista:
   - Developer A: US1 (T004–T007)
   - Developer B: US2 (T008, T009, y T010 al disponer de T006)
3. US3 (T011–T013) tras US1/US2
4. Polish: T014/T015 en paralelo, T016/T017 en serie al final

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Cada user story es completable y testeable de forma independiente
- TDD obligatorio (constitución VI): los tests se escriben y fallan antes de implementar
- Sin dependencias nuevas (constitución V): carrusel con `scroll-snap` CSS nativo
- Commit after each task or logical group
- Quickstart.md (E1–E7) es la guía de validación manual