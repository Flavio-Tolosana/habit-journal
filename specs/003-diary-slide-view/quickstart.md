# Quickstart: Diary Slide View

**Date**: 2026-09-01

Guía de validación para comprobar que la función funciona de extremo a extremo. Referencias a [data-model.md](./data-model.md) y [contracts/](./contracts/). Implementa los escenarios de [spec.md](./spec.md) (US1–US3, FR-001…FR-019).

## Prerrequisitos

- Node 20+ y `npm install` ya ejecutados.
- `npm run build` funciona (con `BASE_PATH=/habit-journal` para Pages).
- `npm test`, `npm run lint`, `npm run check` pasan antes de tocar nada.

## Entorno de validación

App offline-first (IndexedDB, store `habit-journal`). Para pruebas manuales: `npm run dev`. Los datos de prueba se crean escribiendo entradas de diario y marcando hábitos desde la app (Hoy o Calendario).

## Escenarios de validación

### E1. La página se abre en el día actual (FR-004)

**Setup**: Hoy tiene una entrada de diario; hay varios días antiguos con diario.

**Pasos**:
1. Abrir `/diary` (tab "Diario" 📖 en la barra inferior).
2. Observar el primer slide visible.

**Resultado esperado**: El primer slide visible es el de **hoy** (título = fecha de hoy; texto del diario de hoy). El selector de mes muestra el mes actual.

### E2. Deslizar hacia atrás/adelante saltando días vacíos (FR-003, FR-005)

**Setup**: Mes con diario en los días 1, 5 y 22 (días intermedios **sin** texto, quizá sin entrada o con solo hábitos).

**Pasos**:
1. Estando en el slide de hoy, deslizar el dedo hacia la **izquierda** (o flecha `←`).
2. Deslizar hacia la **derecha** (o flecha `→`) para volver.

**Resultado esperado**:
- Un deslizamiento a la izquierda avanza **un día con diario** (de hoy a 22, 22 a 5, 5 a 1), sin mostrar nunca un día sin texto (FR-005).
- Deslizar a la derecha retrocede en el orden inverso hasta volver a hoy.
- SC-002: se llega a cualquier día del mes en ≤N deslizamientos (N = días con diario del mes).

### E3. Selector de mes (FR-006, FR-008, FR-007)

**Setup**: Tres meses con diario (p. ej. 2026-09, 2026-08, 2026-07).

**Pasos**:
1. Abrir el selector de mes (arriba).
2. Elegir 2026-08. 3. Deslizar hasta el primer/last día con diario de agosto y seguir intentando pasar al mes anterior/próximo.

**Resultado esperado**:
- El selector lista solo los meses con ≥1 día de diario, más reciente primero (FR-006).
- Al elegir un mes, el carrusel muestra la entrada **más reciente de ese mes** (o la lectura inicial correcta).
- La etiqueta del selector muestra el mes del slide actual (FR-008).
- En los extremos del mes, el deslizamiento **no cruza** al mes vecino; se muestra el indicador de borde (FR-007, FR-009).

### E4. Estados vacíos (FR-011, FR-012)

**Setup A**: Sin ninguna entrada de diario en toda la app.
- Abrir `/diary` → mensaje invitando a escribir la primera entrada, con enlace a `/` (FR-012). SC-005: aparece en <1s.

**Setup B**: El mes actual sin diario, pero meses pasados con diario.
- Abrir `/diary` y seleccionar el mes actual → "No hay entradas de diario para este mes." (FR-011).

### E5. Error de lectura con reintento (FR-017)

**Setup**: Simular fallo (p. ej. devtools bloqueando IndexedDB, o un stub en test que lance).

**Pasos**:
1. Abrir `/diary` con el fallo activo.

**Resultado esperado**: Mensaje de error inline dentro de la vista (sin salir de la página) con botón **"Reintentar"** que, al pulsarlo (con el fallo resuelto), carga el contenido correctamente.

### E6. Navegación por teclado y accesibilidad (FR-015, FR-010, VII)

**Setup**: Mes con diario en varios días.

**Pasos**:
1. Hacer focus en un slide y pulsar `←` / `→`.
2. Usar lector de pantalla (o inspeccionar aria-labels).

**Resultado esperado**:
- Las flechas mueven entre slides (SC-004: navegable solo con teclado).
- Texto largo del diario: la página hace scroll vertical; el header (fecha) queda visible (FR-010).
- Todos los textos y aria-labels están en español (FR-018).

### E7. Reveal de hábitos por defecto oculto (FR-019, R5)

**Setup**: Un día con diario y 2 hábitos del mes completados.

**Pasos**:
1. Ver el slide de ese día: los hábitos **no** se ven.
2. Pulsar el botón "Mostrar hábitos".

**Resultado esperado**: Se revelan los checkmarks de ese día con los estados correctos (completados según `completions`). El botón tiene `aria-expanded` correcto y alterna Mostrar/Ocultar. Al cambiar de slide vuelven a estar ocultos (estado por slide).

## Comandos de verificación

```bash
npm test          # unit: utils/diary.test.ts + componentes (DiarySlides.test.ts) + regresión existente
npm run check     # typecheck (svelte-check)
npm run lint      # eslint
npm run build     # build producción (BASE_PATH=/habit-journal para Pages)
```

## Validación de calidad

- Cobertura: `tests/unit/utils/diary.test.ts` cubre `hasDiaryText`, `monthsWithDiary`, `buildSlideSequence`, `initialSlideIndex` (objetivo ≥90% líneas, constitution). `tests/unit/components/DiarySlides.test.ts` cubre render, toggle de hábitos y navegación por teclado.
- Lint y typecheck con 0 errores.
- Ningún test previamente existente roto (gates de la constitución).
- Sin dependencias nuevas (principio V).