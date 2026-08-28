# Quickstart: Habit Identity Refactor

**Date**: 2026-08-27

Guía de validación para comprobar que la función funciona de extremo a extremo. Referencias a [data-model.md](./data-model.md) y [contracts/](./contracts/).

## Prerrequisitos

- Node 20+ y `npm install` ya ejecutados.
- La app compila: `npm run build` (con `BASE_PATH=/habit-journal`).
- Tests: `npm test`, lint: `npm run lint`, typecheck: `npm run check`.

## Entorno de validación

La app es offline-first (IndexedDB). Para pruebas manuales se usa `npm run dev`. Los datos viven en el navegador en el store `habit-journal` (versión 2 tras migrar).

## Escenarios de validación

### E1. Migración de datos v1 → v2

**Setup**: Cargar la app con datos del modelo antiguo (dos meses con hábitos y entradas — p. ej. el dataset real del usuario).

**Pasos**:
1. `npm run dev` y abrir la app. La migración ocurre automáticamente al abrir la BD (versión 1 → 2).
2. Abrir `Ajustes` y verificar que los contadores de meses/hábitos/entradas son coherentes (nada se perdió).

**Resultado esperado**: 
- Todos los meses, hábitos y entradas siguen presentes (FR-008).
- Los hábitos de nombres repetidos entre meses se consolidaron en la colección (SC-002, SC-003).

### E2. Creación de mes con selección de hábitos pasados

**Setup**: Colección con al menos "Leer" y "Meditar" creados antes.

**Pasos**:
1. Ir a configurar un nuevo mes.
2. Escribir "Leer" en el campo de hábito → debe aparecer en el desplegable de autocompletado.
3. Seleccionarlo.
4. Escribir un nombre nuevo "Correr" → debe ofrecer "Crear nuevo hábito «Correr»".
5. Guardar el mes.

**Resultado esperado**: 
- "Leer" se reutiliza (misma identidad, sin duplicado) (FR-002, FR-004).
- "Correr" se añade a la colección y queda disponible para meses futuros (FR-003).

### E3. Rachas multi-mes

**Setup**: Un hábito completado cada día desde el último día del mes A hasta el primer día del mes B.

**Pasos**:
1. Abrir la vista de ese hábito (streak/gráfica).
2. Verificar la racha actual.

**Resultado esperado**: La racha es continua y cruza el límite de mes (FR-014, SC-006). Ej.: último día de agosto + primer día de septiembre = racha ≥ 2, contada como una sola.

### E4. Export / import CSV sin duplicar journalText

**Setup**: Día con 3 hábitos completados y texto de diario.

**Pasos**:
1. En `Ajustes` → Exportar. Guardar el CSV.
2. Inspeccionar el archivo.

**Resultado esperado**: 
- Cada día genera **una fila por hábito** (granularidad fila-por-hábito); el `journalText` aparece **solo en la primera fila de ese día**, exactamente una vez por día (FR-010, SC-004).
- La colección figura una vez por hábito (FR-009); los meses y memberships y entradas usan ids estables (FR-011).

### E5. Import en instalación limpia

**Setup**: CSV exportado en E4, y una instalación/DB vacía (borrar el store `habit-journal` o usar otro perfil).

**Pasos**:
1. Importar el CSV (Ajustes → Importar).
2. Recorrer meses, hábitos, entradas y diario.

**Resultado esperado**: 100% de meses, colección, hábitos, completions y journalText restaurados (FR-012, SC-005).

### E6. Gestión de hábitos (ver / renombrar / eliminar)

**Setup**: Un hábito sin usar ("Prueba") y otro usado ("Leer").

**Pasos**:
1. Abrir la página `Habits` (enlace desde Ajustes).
2. Verificar que ambos aparecen listados.
3. Intentar renombrar/eliminar "Prueba" → permitido.
4. Intentar renombrar/eliminar "Leer" → bloqueado (locked).

**Resultado esperado**: 
- La lista muestra todos los hábitos de la colección (FR-015).
- Renombrar/eliminar solo para no referenciados (FR-016, FR-017); los referenciados quedan bloqueados con mensaje.

## Comandos de verificación

```bash
npm test          # tests unitarios (migración, normalización, streaks, export/import)
npm run check     # typecheck (svelte-check)
npm run lint      # eslint
npm run build     # build producción (BASE_PATH=/habit-journal para Pages)
```

## Validación de calidad

- Cobertura: los tests cubren negocio (migración, normalización, rachas, export/import) — objetivo ≥90% líneas en `lib/db/` y `lib/utils/` (constitution).
- Lint y typecheck con 0 errores.
- Ningún test previamente existente roto.
