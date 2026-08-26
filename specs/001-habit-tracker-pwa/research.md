# Research: Habit Journal PWA

**Date**: 2026-08-26

## 1. SvelteKit Static Adapter for GitHub Pages

**Decision**: Use `@sveltejs/adapter-static` with `paths.base` configured for GitHub Pages subpath.

**Rationale**:
- SvelteKit's static adapter prerenders all routes at build time → pure static files (HTML, CSS, JS, assets)
- GitHub Pages serves from `https://<user>.github.io/<repo>/` → need `paths.base` set to `/<repo>/`
- All routes are statically generated → no server-side rendering needed (data is in IndexedDB, not fetched from server)

**Alternatives considered**:
- `adapter-auto` — wouldn't work since GitHub Pages has no server runtime
- `adapter-node` — requires a server, not applicable for static hosting
- Manual SPA with hash routing — loses SvelteKit's file-based routing benefits

**Key configuration**:
```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'  // SPA fallback for client-side routing
    }),
    paths: {
      base: process.env.BASE_PATH || ''  // Set to '/<repo>' in CI
    }
  }
};
```

**Note**: `fallback: 'index.html'` enables SPA mode — all navigation is handled client-side after initial load. This is necessary because GitHub Pages doesn't support server-side routing.

---

## 2. idb Library Patterns

**Decision**: Use `idb` v8+ with typed schemas and versioned upgrades.

**Rationale**:
- `idb` provides a Promise-based wrapper around IndexedDB with TypeScript support (~1.2KB gzipped)
- Aligns with Principle V (Minimal Dependencies) — the simplest IndexedDB wrapper that provides type safety
- Schema versioning via `upgrade` callback aligns with Principle X (Versioned Data Contracts)

**Alternatives considered**:
- Raw IndexedDB API — too verbose, error-prone, no type safety
- `localForage` — larger bundle (~7KB), uses localStorage fallback (not needed for modern browsers)
- `Dexie.js` — powerful but ~20KB, overkill for this schema

**Schema versioning pattern**:
```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface HabitJournalDB extends DBSchema {
  months: {
    key: string;          // 'YYYY-MM'
    value: MonthRecord;
  };
  habits: {
    key: string;
    value: HabitRecord;
    indexes: { 'by-month': string };
  };
  entries: {
    key: string;          // 'YYYY-MM-DD'
    value: EntryRecord;
    indexes: { 'by-month': string };
  };
}

const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<HabitJournalDB>> {
  return openDB<HabitJournalDB>('habit-journal', DB_VERSION, {
    upgrade(db) {
      // v1: Initial schema
      const monthStore = db.createObjectStore('months', { keyPath: 'id' });
      const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
      habitStore.createIndex('by-month', 'monthId');
      const entryStore = db.createObjectStore('entries', { keyPath: 'date' });
      entryStore.createIndex('by-month', 'monthId');
    }
  });
}
```

---

## 3. Chart.js in Svelte

**Decision**: Use Chart.js 4.x with a thin Svelte wrapper component.

**Rationale**:
- Chart.js 4.x is tree-shakeable (~20KB gzipped for bar + line charts)
- Canvas-based rendering works offline with no CDN dependency
- Built-in accessibility: `aria-label` on canvas, fallback text via `plugins.annotation`
- Large community, well-documented, stable API

**Alternatives considered**:
- D3.js — too low-level for this use case, large bundle
- Recharts — React-only
- uPlot — excellent performance but harder to configure for this use case
- Pure SVG charts — more accessible but more code to write (~30 lines per chart type → justified per Principle V)
- ECharts — ~300KB, far too large

**Accessibility approach**:
- Each chart canvas gets `role="img"` and `aria-label` with text summary
- Provide a data table fallback below each chart for screen readers
- Keyboard navigation: charts are not focusable by default, but surrounding controls are

**Svelte integration**:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  export let data: ChartConfiguration['data'];

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data,
      options: { responsive: true, maintainAspectRatio: false }
    });
  });

  onDestroy(() => chart?.destroy());

  $: if (chart) {
    chart.data = data;
    chart.update();
  }
</script>

<div class="chart-container" role="img" aria-label={ariaLabel}>
  <canvas bind:this={canvas}></canvas>
</div>
```

---

## 4. PWA Configuration with vite-plugin-pwa

**Decision**: Use `vite-plugin-pwa` with `generateSW` mode for automatic service worker generation.

**Rationale**:
- `vite-plugin-pwa` integrates with Vite/SvelteKit build pipeline
- `generateSW` mode auto-generates service worker with precaching of static assets
- Configurable runtime caching for navigation requests (SPA fallback)
- Generates `manifest.json` for PWA installability

**Alternatives considered**:
- Custom service worker — more control but more maintenance (Principle I: simplicity)
- `workbox-webpack-plugin` — Webpack-specific, not applicable for Vite

**Configuration**:
```ts
// vite.config.ts
import { SvelteKitPWA } from '@vitejs/plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Habit Journal',
        short_name: 'Habits',
        theme_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['client/**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html'
      }
    })
  ]
});
```

**Offline strategy**:
- Precache all static assets (HTML, CSS, JS, icons) on first visit
- IndexedDB data is always available offline (browser manages this)
- No runtime caching needed — all data is local

---

## 5. IndexedDB Schema Versioning

**Decision**: Use `idb`'s `upgrade` callback with incrementing version numbers. Store schema version in a dedicated `meta` object store.

**Rationale**:
- Constitution Principle X requires versioned data contracts with migration paths
- `idb`'s `openDB` function accepts a version number and `upgrade` callback
- Storing version in a `meta` store allows runtime checks and future migration logic
- Each schema change increments `DB_VERSION` and adds a new case in the `upgrade` function

**Migration pattern**:
```ts
upgrade(db, oldVersion, newVersion, transaction) {
  switch (oldVersion) {
    case 0: // v0 → v1: Initial schema
      db.createObjectStore('months', { keyPath: 'id' });
      const habits = db.createObjectStore('habits', { keyPath: 'id' });
      habits.createIndex('by-month', 'monthId');
      const entries = db.createObjectStore('entries', { keyPath: 'date' });
      entries.createIndex('by-month', 'monthId');
      db.createObjectStore('meta', { keyPath: 'key' });
      transaction.objectStore('meta').put({ key: 'version', value: 1 });
      break;
    case 1: // v1 → v2: Future migration example
      // Add new field, transform existing data, etc.
      break;
  }
}
```

**Key rules**:
- Never delete an object store in a migration (only add/modify)
- Test all migration paths from every previous version
- Store `version` in `meta` for runtime validation
