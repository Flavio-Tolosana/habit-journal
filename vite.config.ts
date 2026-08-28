import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html'
			}),
			paths: {
				base: (base || undefined) as `/${string}` | undefined
			}
		}),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Habit Journal',
				short_name: 'Habits',
				description: 'Libreta de seguimiento de hábitos mensual',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				icons: [
					{ src: `${base}/icon.svg`, sizes: 'any', type: 'image/svg+xml' },
					{ src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
					{ src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg}'],
				navigateFallback: 'index.html'
			}
		})
	]
});
