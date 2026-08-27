<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{base}/favicon.svg" />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<div class="app">
	<main class="container">
		{@render children()}
	</main>
	<Nav />
</div>

<style>
	.app {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		padding-bottom: 1.5rem;
	}
</style>
