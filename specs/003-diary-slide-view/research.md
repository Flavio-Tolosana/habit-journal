# Research: Diary Slide View

**Date**: 2026-09-01

## Introduction

Investiga las decisiones técnicas para la página de slides del diario, basada en el código existente (SvelteKit 5 + IndexedDB `idb`, app offline-first móvil, UI 100% en español). La función es **solo-lectura**: no hay cambios de esquema ni migración. Resuelve los puntos abiertos del plan sin dejar `NEEDS CLARIFICATION`.

## R0. Mecanismo del carrusel de slides (sin dependencia nueva)

**Contexto**: Se requiere "slides para pasar los días" con deslizamiento suave a 60fps (SC-001), inicio en el día actual (FR-004), saltar días sin diario (FR-005), indicador de borde (FR-009), debounce de deslizamientos rápidos (FR-014) y navegación por teclado (FR-015). Principio V prohíbe añadir dependencias si la funcionalidad es alcanzable con poco código.

**Decision**: **Scroll horizontal nativo con CSS `scroll-snap`** + ocultar la barra de scroll. Se usa un contenedor `/diary` con:
- `display: flex; overflow-x: auto; scroll-snap-type: x mandatory;` y cada slide `scroll-snap-align: start`.
- El DOM se ordena **de más reciente a más antiguo** con el día actual a la **izquierda** (posición `scrollLeft = 0` de inicio). Así el gesto físico queda como pide el usuario: dedo hacia la **izquierda** → `scrollLeft` aumenta → se revelan días **más antiguos** (situados a la derecha); dedo hacia la **derecha** → vuelve hacia los más recientes.
- El navegador proporciona de forma nativa: inercia, snap, clamp en los extremos (borde), y composición GPU → 60fps (SC-001) y debounce natural de movimientos rápidos (FR-014). La barra de scroll se oculta (el touch seguirá funcionando; en desktop se añade indicador visual).

**Rationale**:
- Cero dependencias (principio V): toda la física del deslizamiento (inercia, snap, extremos) la da el navegador. No se reinventa matemática de punteros ni se añade Embla/Swiper.
- 60fps garantizado: el scroll nativo se compone en la GPU sin trabajo de JS por frame (SC-001 realista).
- Accesibilidad simple (FR-015): cada slide es un `<article>` con `tabindex="0"`; las flechas de teclado con `scrollIntoView({behavior:'smooth', inline:'start'})` o `scrollBy` mueven entre slides (teclado también funciona en desktop).

**Alternatives considered**:
- **Librería carrusel (Embla/Swiper)**: física idéntica pero añade una dependencia. Se descarta: `scroll-snap` cubre el 100% de la funcionalidad requerida sin coste de mantenimiento (principio I y V).
- **Gestos custom con `pointerdown/pointermove` y transform CSS**: reinventa el scroll (rebasamiento, inercia, interrupt de gestos) en mucho más de 30 líneas y con peor rendimiento. Se descarta (principio I).

**Riesgo** (mitigado): el scroll-snap nativo no da notificaciones "snap finish" portables en todos los navegadores. La función de selección del mes en el selector se actualiza cuando `scrollLeft` cruza el punto medio de cada slide (evento `scroll`, throttled con `requestAnimationFrame` / `IntersectionObserver` con `rootMargin`). Es suficiente para actualizar el mes mostrado (FR-008).

## R1. Ubicación en la navegación

**Contexto**: FR-001 exige "página dedicada accesible desde la navegación de la app". La barra inferior (`Nav.svelte`) tiene 4 tabs: Hoy, Calendario, Gráficas, Ajustes.

**Decision**: Añadir una **nueva pestaña "Diario" 📖** (ruta `/diary`) en `Nav.svelte`, quedando 5 tabs. Es una función P1 de lectura diaria — el usuario la consultará a diario, igual que "Hoy".

**Rationale**: La función es primaria (P1), no una utilidad de ajustes; merece acceso directo desde la navegación principal (SC: navegación en ≤3 toques).

**Alternatives considered**:
- Enlace desde Ajustes: escondería una función de uso diario (principio IX — mala progresión para una feature primaria). Descartado.
- Reutilizar el tab "Hoy": mezcla conceptos (edición vs. lectura) y duplica responsabilidad de la página raíz (principio II). Descartado.

## R2. "Meses con diario" y volumen de datos

**Contexto**: FR-006 exige que el selector liste solo meses con ≥1 entrada de diario (texto no vacío). No existe un índice para "entradas con journalText no vacío". El volumen es de usuario único (~31 entradas/mes, unos cientos de meses como máximo histórico plausible).

**Decision**: Derivar el conjunto de meses con diario **en el cliente** a partir de `getAllEntries()`: `entries.filter(e => e.journalText.trim().length > 0)` → `Set(e.monthId)`. Se listan las fechas de mes en orden descendente (más reciente primero, coherente con la dirección de la navegación hacia atrás). El `MonthSelector` solo muestra esos meses más el mes actual aunque no tenga diario (para permitir el estado vacío FR-011).

**Rationale**: `getAllEntries()` ya existe, devuelve todas las entradas ordenadas y el volumen es pequeño; añadir un índice/consulta especializada supondría cambio de esquema y migración (principio X) sin necesidad (principio I). Se cumple el supuesto de `spec.md` ("eficiente sin cargar todo el texto"): el texto ya está en `entries`; el coste es lineal y mínimo.

**Alternatives considered**:
- Nuevo store/gación `monthsDiary` o índice en `entries`: requiere `DB_VERSION++` y migración. Descartado: innecesario a esta escala.
- Preguntar a la BD por mes con `getEntriesForMonth` por cada mes de `getAllMonths()`: N+1 lecturas. Descartado frente a una única lectura `getAllEntries()`.

## R3. Definición de "día con diario"

**Contexto**: FR-005 "saltar días que no tienen texto de diario". `DailyEntry` se crea también cuando solo se marcan hábitos (sin texto). El "tener diario" no equivale a "existir entrada".

**Decision**: Una entrada cuenta como **slide** si y solo si `journalText` tras `trim()` no está vacío. Las entradas con `journalText` vacío (solo hábitos) se excluyen de la secuencia de slides. Esta regla es pura y se testea (`hasDiaryText`).

**Rationale**: Implementa exactamente FR-005/FR-006. Simple y determinista.

## R4. Orientación de la secuencia y posición inicial

**Contexto**: FR-004 (empezar en el día actual o el más reciente con diario si hoy no tiene) y la dirección del gesto pedida por el usuario (izquierda = atrás en el tiempo).

**Decision**: La secuencia de slides de un mes se ordena **descendente por fecha** (nuevo → antiguo): hoy queda a la izquierda en la posición inicial `scrollLeft = 0`. Seleccionar otro mes reemplaza la secuencia y arranca en su entrada más reciente (o la más antigua si el usuario navega "hacia delante" desde el inicio del mes — comportamiento natural del scroll). El selector de mes muestra el mes del slide actual (FR-008).

**Rationale**: Con orden descendente no hay que reposicionar sobre el montaje: hoy es `scrollLeft=0`. Con orden ascendente habría que scrollear hasta el final al cargar y reposicionarse tras cada cambio de orientación/resize — más complejo y frágil (principio I).

**Alternatives considered**:
- Orden ascendente con scroll inicial al final: descartado por la fragilidad del reposicionamiento.

## R5. Contenido del slide y "Mostrar hábitos" (progressive disclosure)

**Contexto**: FR-002 (fecha + texto + mantra del mes), FR-019 (checkmarks de hábitos ocultos por defecto, revelados con un botón). Se decide que cada slide muestre los hábitos del día solo tras pulsar.

**Decision**: Cada slide muestra: `formatDisplayDate(fecha)` como título, el texto del diario, y el mantra del mes (si existe). Debajo, un botón accesible "Mostrar hábitos" (aria-expanded) que revela la lista de `HabitCheckbox` (solo-lectura, `checked = entry.completions[habit.id] ?? false`) de ese día. Los datos de hábitos se cargan una vez por mes vía `getHabitsForMonth(monthId)`; las completions vienen de la propia `DailyEntry`.

**Rationale**: Implementa FR-019 y IX (progressive disclosure). Reutiliza `HabitCheckbox` existente (presentación read-only: `checked` sin `onchange` o con `onchange` no-op). `getHabitsForMonth` ya resuelve memberships → colección.

## R6. Estados vacíos y errores

**Contexto**: FR-011/12 (estados vacíos), FR-017 (error de lectura con reintento), todos en español (FR-018).

**Decision**:
- Sin ningún diario en la app → mensaje "Aún no has escrito ninguna entrada de diario. Escribe tu primera entrada en el día de hoy." con enlace a `/`.
- Mes seleccionado sin entradas con diario → "No hay entradas de diario para este mes."
- Fallo de lectura de BD (thrown) → error inline dentro de la página con botón "Reintentar" que relanza la carga (sin abandonar la vista). Se registra el error con `console.error` (observabilidad mínima, principio VIII).

**Rationale**: FR-012/011/017 con UI 100% en español (FR-018). El reintento es una recarga del propio flujo de datos, no navegación.

## Dependencias tecnológicas

- `idb` (existente): solo-lectura de IndexedDB.
- `vitest` + `@testing-library/svelte` (existentes): tests de `diary.ts` y del carrusel.
- `svelte `5 (runes): componente carrusel.
- **No se añaden dependencias nuevas** (principio V).

## Riesgos y mitigaciones

- **Riesgo**: Comportamiento scroll-snap ligeramente distinto entre navegadores. → Pruebas manuales en Centro/Chrome/Safari (iOS) en `quickstart.md`; la funcionalidad base (mostrar slide correcto) no depende del snap fino.
- **Riesgo**: La detección del "slide actual" por `IntersectionObserver` o `scroll` puede desfasar 1 frame. → Actualizar UI en `requestAnimationFrame`, sin bloquear el scroll; aceptable (solo afecta a la etiqueta del mes mostrado, FR-008).
- **Riesgo**: Nested scroll (horizontal del carrusel + vertical del texto largo, FR-010) bloquea el gesto vertical dentro de un slide. → El texto largo se deja fluir con el contenido del slide (el propio contenedor del carrusel hace scroll vertical de página); si se necesita scroll interno vertical se añade con `overflow-y:auto` **solo** en la zona de texto y se indica en las pruebas manuales.