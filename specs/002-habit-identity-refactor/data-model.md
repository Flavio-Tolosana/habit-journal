# Data Model: Habit Identity Refactor

**Date**: 2026-08-27

## Overview

Se introduce una **colección global de hábitos** identificados por su nombre (vía un slug determinista). Los meses referencian esos hábitos mediante memberships, y las entradas diarias registran completions usando el mismo id de hábito global. Esto reemplaza el diseño anterior en el que cada mes creaba instancias independientes (UUID) de los mismos hábitos.

## Entities

### Habit (Colección global)

La entidad única y persistente que representa un hábito a lo largo de toda la historia. Es la fuente única de identidad.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Primary key; slug determinista derivado del nombre | e.g. `"meditar"`, `"leer"` |
| `name` | `string` | Required, 1–100 chars, unique tras trim (case-sensitive para UX) | Nombre canónico mostrado al usuario |

**Generación del id (slug)**: `slugify(name)` = lowercase → eliminar acentos → reemplazar espacios múltiples por uno → eliminar caracteres no alfanuméricos. Es determinista: el mismo nombre siempre produce el mismo id.

**Reglas de unicidad**:
- Dos hábitos son el "mismo" si sus nombres coinciden **exactamente tras trim** (case-sensitive) — decisión Q1.
- A nivel de almacén, la unicidad se garantiza por el `id` (slug, case-insensitive) para evitar colisiones técnicas.

### Month

Contiene los datos de un mes calendario (mantra + memberships de hábitos).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Primary key, `YYYY-MM` | e.g. `"2026-08"` |
| `year` | `number` | Required, >= 2020 | Año |
| `month` | `number` | Required, 1–12 | Mes (1=enero) |
| `mantra` | `string` | Optional, max 280 | Intención/mantra mensual |
| `setupComplete` | `boolean` | Required, default `false` | Completado el setup del mes |
| `memberships` | `Array<{ habitId: string; order: number }>` | Required | Qué hábitos (de la colección) incluye este mes y su orden |

**Nota**: El campo `habits: HabitDefinition[]` anterior desaparece; se sustituye por `memberships`. Los hábitos en sí viven en la colección global.

### Membership (HabitDefinition v2)

Representa la inclusión de un hábito de la colección en un mes concreto, con su posición de orden. **No es una entidad propia en IndexedDB** — se almacena inline en `Month.memberships`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `habitId` | `string` | Foreign key → Habit.id | Identidad global del hábito |
| `order` | `number` | Required, >= 0, único dentro del mes | Posición de orden |

### DailyEntry

Registro diario.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date` | `string` | Primary key, `YYYY-MM-DD` | Fecha |
| `monthId` | `string` | Foreign key → Month.id | Mes al que pertenece |
| `journalText` | `string` | Optional | Texto del diario (una vez por día) |
| `completions` | `Record<string, boolean>` | Required | habitId (global) → completado. `habitId` es clave de la colección |

## Identity & Relationships

- **Habit.id** es global y estable → el mismo hábito en varios meses comparte id.
- **Month.memberships[].habitId** refiere a **Habit.id**.
- **DailyEntry.completions** usa **Habit.id** (no el UUID por mes).
- Un **Habit** puede estar en **0..N meses** (vía memberships).
- Un **Month** tiene **1..N memberships**.

```
Habit (colección global)  1 ──── *  Month.memberships  ──── 1  Month
   ▲                                            ▲
   └────────── * DailyEntry.completions ────────┘
```

## State Transitions

### Habit (colección)
```
[creado] → (renombrado si NO referenciado) → [renombrado]   // cambia id+name
         → (renombrado si SÍ referenciado)  → [bloqueado]   // no permitido
         → (eliminado si NO referenciado)   → [eliminado]
         → (eliminado si SÍ referenciado)   → [bloqueado]
```

- Renombrar crea un hábito nuevo (nuevo slug) y elimina/vacía el antiguo, **solo si** `referenciaCount === 0`.
- Eliminar solo posible si `referenciaCount === 0`.

`referenciaCount(habitId)` = número de `DailyEntry` cuyo `completions[habitId]` existe + número de `Month.memberships` que lo incluyen.

### Month
```
[no creado] → setup (setupComplete:false) → ready (setupComplete:true)
```
Sin cambios respecto al modelo previo.

## Validation Rules

- `Month.id` debe coincidir con `/^\d{4}-\d{2}$/`.
- `DailyEntry.date` debe coincidir con `/^\d{4}-\d{2}-\d{2}$/`.
- `Habit.name` no vacío tras trim, 1–100 caracteres.
- `slugify(name)` no debe dar lugar a id vacío; si ocurriera, se rechaza el nombre.
- Los `habitId` en `memberships` y en `completions` deben referirse a hábitos existentes en la colección (integridad referencial verificada al escribir).

## Migration (IndexedDB v1 → v2)

- `DB_VERSION` pasa de `1` a `2`.
- En `upgrade` (cuando `oldVersion < 2`):
  1. Leer `habits` (v1) → agrupar por slug(nombre): consolidar duplicados que difieran solo en mayúsculas/acentos/espacios.
  2. Crear la colección `Habit` con todos los slugs únicos.
  3. Reescribir cada `Month`: `habits → memberships` usando los slugs.
  4. Reescribir cada `DailyEntry.completions`: mapear UUID v1 → slug.
  5. Eliminar el store `habits` v1 (el nuevo esquema usa `months` con memberships inline + store `habits`/`habitCollection` para la colección).
- Resultado: 100% de meses, hábitos, completions y journalText preservados (ver `quickstart.md`).
