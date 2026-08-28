# Research: Habit Identity Refactor

**Date**: 2026-08-27

## Introduction

Esta investigación resuelve los puntos técnicos abiertos del modelo de datos y del formato de export/import, basándose en el análisis del código existente de la aplicación (SvelteKit + IndexedDB vía `idb`).

## R0. Modelo de identidad del hábito (colección global por nombre)

**Contexto**: Actualmente `HabitDefinition` (en `src/lib/db/types.ts`) tiene `id` (UUID v4), `monthId`, `name`, `order`. Cada mes genera **nuevos UUIDs** aunque el nombre sea el mismo — el CSV lo confirma: "Habito 1" tiene ids distintos en 2026-08 y 2026-09. Las completions (`DailyEntry.completions: Record<habitId, boolean>`) se guardan por ese UUID por-mes.

**Pregunta evaluada**: ¿Cómo modelar la colección global única por nombre?

**Decision**: 
- Crear una entidad **`Habit`** (colección global) con:
  - `id`: **slug estable y determinista derivado del nombre** (p. ej. `slugify(nombre)`). Esto garantiza que el mismo nombre normalizado siempre produce el mismo id, sin necesidad de generar ni almacenar un UUID separado. Al ser derivable, simplifica la migración y evita colisiones.
  - `name`: el nombre del hábito (canónico, ya normalizado: trim y almacenado tal cual).
- El antiguo `HabitDefinition` **deja de existir como entidad independiente por mes**. En su lugar, la `Month` mantiene una lista de **memberships**: `{ habitId: string; order: number }` (o un array `habitIds` ordenado). La referencia usa el slug global.
- `DailyEntry.completions` pasa a ser `Record<habitId, boolean>` donde `habitId` es el **slug global**, de modo que el mismo hábito es consistente entre meses.

**Rationale**: 
- El nombre ES la identidad (decisión del usuario): derivar el id del nombre mantiene coherencia total (mismo nombre → mismo id) sin estado adicional.
- Cumple el principio I (simplicidad): no hace falta un contador/UUID para la colección, solo un `slugify`.
- Cambio controlado: `completions` y memberships siguen usando una clave string, lo que minimiza el impacto en streaks/stats/charts (que ya indexan por `habit.id`).

**Alternatives considered**:
- **A. UUID estable por hábito** (generado solo una vez): id desacoplado del nombre (permite renombrar sin cambiar referencias). Se descartó porque el usuario confirmó que renombrar un hábito usado **no está permitido** (solo se puede renombrar si no está referenciado), por lo que desacoplar el id del nombre no aporta valor; un slug es más simple y determinista.
- **B. Solo `name` sin `id`**: la clave natural sería el nombre string directo. Se descartó porque un slug normalizado es más robusto como key de IndexedDB (evita problemas con espacios/acentos al ser key) y deja margen para mostrar el nombre canónico.

## R1. Normalización de nombres (comparación exacta tras trim)

**Contexto**: El usuario eligió que dos hábitos son iguales solo si sus nombres coinciden exactamente después de recortar (case-sensitive), y que la prevención de duplicados recae en la UX del selector autocompletado.

**Decision**: 
- `slugify(nombre)` para la clave: lower-case, eliminar acentos, reemplazar espacios múltiples por uno, eliminar caracteres no alfanuméricos. Se usa solo para generar el `id`.
- La **comparación de igualdad** (para el selector y para decidir "crear nuevo") usa el **nombre canónico exacto tras trim** (case-sensitive), tal y como pidió el usuario.
- La unicidad en la colección se garantiza por el `id` (slug), que es insensible a mayúsculas/acentos.

**Rationale**: 
- Cumple la decisión explícita del usuario (Q1: C).
- El selector con autocomplete ya evita duplicados en la práctica; el slug como key añade una red de seguridad determinista.

**Alternatives considered**:
- Comparación case-insensitive (opción A/B): descartada por decisión del usuario.
- Similitud difusa: descartada (muy compleja, no añade valor con el selector).

**Nota sobre normalización en el selector**: El autocomplete debe resaltar/especializarse: si el texto escrito tras trim coincide exactamente (case-sensitive) con un hábito existente → selecciona ese; si no coincide exactamente → ofrece opción "Crear nuevo hábito «X» a la colección". Aunque el `id` sea case-insensitive, la **selección y creación** se basan en la coincidencia exacta tras trim para reflejar la decisión del usuario.

## R2. Migración de datos existentes (IndexedDB v1 → v2)

**Contexto**: La app está desplegada y tiene datos reales (2 meses en el CSV de ejemplo). El almacén `habits` contiene `HabitDefinition` por mes con UUIDs; las entradas referencian esos UUIDs.

**Decision**: Subir `DB_VERSION` a `2` y en el callback `upgrade` del `openDB` (en `src/lib/db/index.ts`) migrar en un solo paso:
1. Leer todos los registros de `habits` (v1).
2. Para cada nombre, calcular `slug`; crear la entidad global `Habit` (si no existe) en el nuevo almacén `habitCollection` (o el mismo `habits` rediseñado).
   - Consolidación de duplicados: nombres que difieren solo en mayúsculas/acentos/espacios producen el **mismo slug** → una sola entrada en la colección.
   - Como la comparación del usuario es case-sensitive *para la UX*, la **migración** consolida por slug (pragmático): si existieran "Meditar" y "meditar" de forma separada, migran al mismo hábito global. Esto es aceptable porque es el comportamiento esperable de la colección única.
3. Reescribir cada `HabitDefinition` v1 → membership en su mes: eliminar el registro antiguo y actualizar la `Month` para que su lista de memberships referencie el slug.
4. Reescribir `entries` para que `completions` use el slug en lugar del UUID v1.
5. Eliminar el almacén `habits` v1 y crear el nuevo esquema.

**Detalle de implementación de la migración**: `idb` expone `oldVersion` en el `upgrade` callback; se ramifica `if (oldVersion < 2)`. Los stores de v2 deben existir; como `upgrade` no permite borrar después de crear índices usados, el enfoque más seguro es:
- Crear los nuevos stores con nombres nuevos (p. ej. `habits` rediseñado a colección y/o `months` reescrito), copiar/migrar los datos de los stores v1 a los nuevos, y **borrar los stores v1 obsoletos** desde el propio `upgrade` (idb permite `deleteObjectStore` si el store existe y no se ha abierto un cursor sobre él).

**Rationale**: 
- Principio X (Versioned Data Contracts): migración obligatoria, sin pérdida de datos.
- De un solo paso reduce el riesgo frente a migraciones escalonadas.

**Alternatives considered**:
- Reset de datos: descartado (viola Data Integrity First y la confianza del usuario).
- Migración en dos fases (v1→v1.1→v2): más compleja, innecesaria.

## R3. Formato de export/import CSV

**Contexto**: El formato actual (en `src/lib/db/export.ts`) tiene cabecera fija y filas planas por tipo. El `journalText` se repite una vez por hábito completado en el mismo día (duplicación). El usuario decidió **mantener la granularidad fila-por-hábito** para las completions pero **sin duplicar el journalText**, y **solo soportar el formato nuevo** (romper compatibilidad antigua).

**Decision**: Nuevo formato CSV con **granularidad fila-por-hábito** para las completions (confirmada por el usuario) y **journalText sin duplicar** (granularidad diaria). La forma de cumplir ambas es:
- **Fila de colección**: `habit,<id>,<name>` — cada hábito único de la colección una sola vez.
- **Fila de mes**: `month,<id>,<mantra>,<habitCount>` (opcional el conteo).
- **Fila de membership**: `member,<monthId>,<habitId>,<order>` — qué hábitos incluye cada mes y en qué orden (granularidad mensual del membership).
- **Fila de entrada**: `entry,<date>,<monthId>,<journalText>,<habitId>,<completed>` — una fila por hábito del día (**fila-por-hábito**). El `journalText`, de granularidad diaria, se escribe **solo en la primera fila de cada día**; las filas de los demás hábitos del mismo día dejan esa columna vacía. Así el texto aparece exactamente una vez por día (cumple FR-010) sin abandonar la fila-por-hábito.
- **Fila de meta**: `meta,<clave>,<valor>` para la versión del formato.

**Pregunta de diseño resuelta**: ¿Cómo no duplicar journalText manteniendo fila-por-hábito? → **Respuesta**: mantener una fila por hábito; el journalText se coloca únicamente en la primera fila de cada día y queda vacío en las siguientes. El lector/importador usa la primera fila de cada `date` para el texto del día.

**Rationale**: 
- Solo nuevo formato (decisión Q2): import simple, sin traducción de formatos.
- Fila-por-hábito respeta la decisión del usuario y conserva el patrón del export actual.
- El journalText (diario, no por-hábito) se emite una sola vez por día, eliminando la redundancia detectada.

**Alternatives considered**:
- Fila-por-día con completions compactas en una columna: descartado (el usuario pidió explícitamente fila-por-hábito).
- Fila-por-hábito repitiendo journalText en cada fila: descartado (viola FR-010 y era el defecto del export actual).
- JSON por fila: descartado (menos legible/difícil de abrir en Excel).

## R4. Rachas y estadísticas multi-mes

**Contexto**: `streaks.ts` y `stats.ts` iteran sobre `entries` filtrando por `habit.id` y calculando sobre el conjunto de entradas del mes actual (`getEntriesForMonth`). Ahora el hábito es global.

**Decision**: 
- `calculateStreaks` y `stats` deben recibir **todas las entradas relevantes** (no solo las de un mes) o bien un rango configurable, para poder cruzar fronteras de mes. La función ya toma `entries: EntryLike[]` completo y filtra; solo falta que el llamador le pase las entradas de **todos los meses** que contienen ese hábito (o un rango).
- Se añade la capacidad de que una racha continúe cuando el día anterior (fin de mes) y el siguiente (inicio de mes siguiente) son consecutivos. Como `completions` por hábito ya es global y las fechas son `YYYY-MM-DD`, el cálculo basado en fechas consecutivas ya funciona tal cual una vez se pasan todas las entradas; solo hay que **eliminar el truncado por mes** en el punto de llamada.
- `charts/+page.svelte` debe poder agregar los datos de un hábito a lo largo de todos los meses que lo incluyen (selector de rango o comportamiento por defecto "toda la historia").

**Rationale**: 
- Decisión Q3: extender a multi-mes.
- El algoritmo de streaks actual es correcto para fechas consecutivas; el único cambio es pasar el set completo de entradas.

**Alternatives considered**:
- Mantener por-mes: descartado (Q3=B).
- Nuevo campo de "racha global" agregado: innecesario; el cálculo sobre fechas ya cubre el cruce de meses.

## R5. Selector de hábitos en MonthSetup

**Contexto**: `MonthSetup.svelte` permite escribir nombres y copiar del mes anterior.

**Decision**: El input de nombre se convierte en un **campo de autocompletado** que consulta la colección global (`getAllHabits`) a medida que se escribe, sugiriendo los hábitos existentes. Si la coincidencia exacta tras trim existe → se selecciona ese (reutiliza su `id`). Si no existe → se ofrece la opción "Crear nuevo hábito «X»". El flujo de "copiar del mes anterior" con `MonthSetup` reutiliza los `id` estables (ya que el mes anterior ahora referencia slugs globales).

**Rationale**: 
- Implementa FR-002, FR-004, FR-013 y la UX de Q1 (desplegable autocompletado).
- Sin dependencias nuevas: `<datalist>` nativo o un simple listbox filtrado en Svelte.

## R6. Gestión de hábitos (habit management view)

**Contexto**: El usuario pidió un apartado para ver hábitos y poder renombrar/eliminar, siempre que no estén referenciados en ninguna entrada.

**Decision**: Nueva página `src/routes/habits/+page.svelte` + componente `HabitManager.svelte`:
- Lista todos los hábitos de la colección (nombre, nº de meses donde se usa, nº de entradas que lo referencian).
- Por cada hábito: habilitar acciones **Renombrar** y **Eliminar** solo si `referenciaCount === 0`; en caso contrario mostrarlos deshabilitados/locked con mensaje.
- Enlace a esta página desde `settings/+page.svelte` y/o Nav (dependerá del diseño de navegación existente; se ubicará en Ajustes si la barra de nav está saturada).

**Rationale**: 
- Implementa FR-015/016/017 y User Story 4.
- La comprobación "no referenciado" se hace contando entradas que contienen ese `habitId` en `completions`.

## Dependencias tecnológicas

- `idb` (existente): migración y acceso IndexedDB.
- `vitest` + `jsdom` (existente): tests de migración, normalización, streaks y export/import.
- `chart.js` (existente): agregación multi-mes en charts.
- No se añaden dependencias nuevas (principio V).

## Riesgos y mitigaciones

- **Riesgo**: Migración compleja puede perder datos. → Tests de migración (test primero) con dataset real de ejemplo.
- **Riesgo**: La consolidación por slug en migración une hábitos que el usuario percibía distintos (ej. mayúsculas distintas). → Aceptado y documentado; la UX del selector previene duplicados futuros.
- **Riesgo**: Cambio de CSV rompe backups antiguos. → Decisión aceptada (Q2); se informa en el log de cambios.
