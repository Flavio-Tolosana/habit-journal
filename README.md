# Habit Journal

Aplicación web progresiva (PWA) para el seguimiento mensual de hábitos y la escritura de un diario personal. Diseñada para ser instalada en el móvil y funciona 100% offline.

## Características

- **Planificación mensual**: Define un mantra motivacional y una lista de hábitos cada mes
- **Seguimiento diario**: Marca hábitos completados y escribe entradas de diario (auto-guardado)
- **Calendario interactivo**: Navega por días con un grid tipo calendario (navegación por teclado incluida)
- **Diario con diapositivas**: Explora entradas del diario con un visor horizontal deslizable
- **Gráficos y rachas**: Visualiza tu progreso con gráficas de Chart.js y calcula rachas por hábito
- **Exportar/importar**: Respalda tus datos en CSV y restaúralos cuando quieras
- **Accesibilidad**: ARIA, navegación por teclado y soporte para lectores de pantalla

## Tech Stack

| Tecnología | Propósito |
|---|---|
| [SvelteKit](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) | Framework UI (runes: `$state`, `$derived`, `$effect`) |
| [TypeScript](https://www.typescriptlang.org) | Tipado estático |
| [Vite](https://vite.dev) | Dev server y bundler |
| [idb](https://github.com/jakearchibald/idb) | Wrapper tipado de IndexedDB |
| [Chart.js](https://www.chartjs.org) | Gráficos de barras y líneas |
| [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | Service worker, manifest y cache offline |

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run dev -- --open # Abrir en el navegador automáticamente
```

## Build y Producción

```bash
npm run build    # Genera archivos estáticos en build/
npm run preview  # Previsualiza el build de producción
```

## Testing

```bash
npm run test          # Ejecutar tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Tests con cobertura
```

## Linting y Formato

```bash
npm run lint    # Verificar con ESLint
npm run format  # Formatear con Prettier
npm run check   # Verificación de tipos con svelte-check
```

## Estructura del Proyecto

```
src/
├── lib/
│   ├── components/     # 11 componentes Svelte (Nav, DayView, Calendar, Charts, etc.)
│   ├── db/             # Capa de base de datos (IndexedDB: months, habits, entries, meta)
│   ├── stores/         # Stores de estado de la aplicación
│   └── utils/          # Helpers de fechas, estadísticas, rachas, slug, diario
├── routes/             # Enrutamiento de SvelteKit (file-based)
│   ├── +page.svelte        # Página principal (hoy o setup)
│   ├── month/[year]/[month]/[day]/  # Vista de día
│   ├── diary/              # Diario con diapositivas
│   ├── charts/             # Gráficos y estadísticas
│   ├── habits/             # Gestión de hábitos
│   └── settings/           # Configuración y export/import
└── app.css             # Tokens de diseño y estilos globales
```

## Despliegue

Se despliega automáticamente en **GitHub Pages** al hacer push a `main` vía GitHub Actions (`.github/workflows/deploy.yml`).

## Datos

Toda la información se almacena localmente en **IndexedDB** del navegador. No hay backend ni servidor. La app funciona completamente offline después de la carga inicial.
