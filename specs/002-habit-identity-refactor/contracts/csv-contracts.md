# CSV Contracts: Habit Identity Refactor

**Date**: 2026-08-27

Formato de export/import CSV. **Solo soporta el formato nuevo** (decisión Q2); un CSV antiguo no importa correctamente. La granularidad es **una fila por hábito** para las completions (se mantiene por decisión del usuario), pero el `journalText` (granularidad diaria) se escribe **solo en la primera fila de cada día** para no duplicarse (FR-010).

## Cabecera

```csv
type,id,name,monthId,mantra,date,journalText,order,completed,value,key
```

Columnas y su uso según fila; las no usadas van vacías.

| # | Columna | Uso |
|---|---------|-----|
| 1 | `type` | `habit` \| `month` \| `member` \| `entry` \| `meta` |
| 2 | `id` | `habitId` (habit/member/entry) o vacío |
| 3 | `name` | Nombre del hábito (habit/member/entry) |
| 4 | `monthId` | `YYYY-MM` (month/member/entry) |
| 5 | `mantra` | Texto del mes (month) |
| 6 | `date` | `YYYY-MM-DD` (entry) |
| 7 | `journalText` | Texto del día; solo primera fila de cada día (entry) |
| 8 | `order` | Posición dentro del mes (member) |
| 9 | `completed` | `1` completado / `0` no (entry, fila-por-hábito) |
| 10 | `value` | Número de versión (meta) |
| 11 | `key` | `format` (meta) |

## Filas

### Colección de hábitos (una por hábito único)

```csv
habit,<habitId>,<name>,,,,,,,
```

- `id=<slug global>`, `name=<nombre canónico>`.
- Cada hábito aparece **una sola vez** en todo el archivo.

### Mes (una por mes)

```csv
month,,,<monthId>,<mantra>,,,,,
```

- `monthId=<YYYY-MM>`, `mantra=<texto>`.

### Membership (una por hábito en un mes)

```csv
member,<habitId>,<name>,<monthId>,,,<order>,,,
```

- `habitId=<slug>`, `monthId=<mes>`, `order=<posición dentro del mes>`.
- Indica qué hábitos de la colección incluye cada mes y su orden.

### Entrada diaria (una fila por hábito completado ese día)

```csv
entry,<habitId>,<name>,<monthId>,,<date>,<journalText>,<order>,<completed>,,
```

- `type=entry`
- `habitId=<slug>`, `name=<nombre>`
- **Granularidad fila-por-hábito**: una fila por cada hábito presente en `completions` de ese día.
- **`journalText` solo se escribe en la PRIMERA fila de cada día**; las filas de los demás hábitos del mismo día dejan esa columna vacía. Así el texto aparece exactamente una vez por día (FR-010) aunque haya varias filas.

### Meta (una fila)

```csv
meta,,,,,,,,,<version>,format
```

- `value=<version-entera>`, `key=format`.
- Número de versión del formato utilizado para validar la importación.

## Reglas de importación

- Si falta la fila `meta` con `key=format`, se lanza un error "formato no soportado".
- El import reconstruye la **colección** (filas `habit`), los **meses** con sus **memberships** (filas `month` + `member`) y las **entradas** (filas `entry`), respetando la integridad referencial.
- Un `habitId`/`monthId` debe aparecer en su fila declarativa (`habit`/`month`) antes de referenciarse en `member`/`entry`.
- El escape de comillas en texto (`name`, `mantra`, `journalText`) usa duplicación `""` (estándar CSV); comas y saltos de línea se escapan entre comillas dobles.

## Ejemplo

```csv
type,id,name,monthId,mantra,date,journalText,order,completed,value,key
habit,leer,Leer,,,,,,,,
habit,meditar,Meditar,,,,,,,,
month,,,2026-08,Mes de Agosto,,,,,
member,leer,Leer,2026-08,,,,0,,,
member,meditar,Meditar,2026-08,,,,1,,,
entry,leer,Leer,2026-08,,2026-08-27,"Dia 1",,1,,
entry,meditar,Meditar,2026-08,,2026-08-27,,,0,,
entry,leer,Leer,2026-08,,2026-08-28,"Dia 2",,1,,
entry,meditar,Meditar,2026-08,,2026-08-28,,,1,,
meta,,,,,,,,,2,format
```

Nota del ejemplo: la columna 8 (`order`) solo aplica a las filas `member` (queda vacía en `entry`). La columna 9 (`completed`) es `1` o `0`. El `journalText` aparece **solo en la primera fila de cada día** ("Dia 1" el 27, "Dia 2" el 28); las filas de los demás hábitos del mismo día quedan vacías en esa columna.
