import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), svelteTesting()],
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