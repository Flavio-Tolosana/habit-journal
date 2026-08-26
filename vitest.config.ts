import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['tests/setup.ts'],
		coverage: {
			include: ['src/lib/**/*.{ts,js}'],
			exclude: ['src/lib/db/index.ts']
		}
	}
});
