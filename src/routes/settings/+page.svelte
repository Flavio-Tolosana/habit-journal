<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import { getAllMonths } from '$lib/db/months';
	import { getDB } from '$lib/db/index';

	let monthCount = $state(0);
	let habitCount = $state(0);
	let entryCount = $state(0);
	let loading = $state(true);

	onMount(async () => {
		const months = await getAllMonths();
		monthCount = months.length;
		const db = await getDB();
		habitCount = (await db.getAll('habits')).length;
		entryCount = (await db.getAll('entries')).length;
		loading = false;
	});
</script>

<svelte:head>
	<title>Ajustes - Habit Journal</title>
</svelte:head>

<div class="settings-page">
	<h1 class="page-title">Ajustes</h1>

	<section class="card" aria-label="Habit management">
		<h2 class="section-title">Guarda de hábitos</h2>
		<p class="section-desc">
			Revisa tu colección de hábitos: renombra o elimina los que no estén en uso.
		</p>
		<a class="btn btn-outline" href="{base}/habits">Gestionar hábitos</a>
	</section>

	<section class="card" aria-label="Export and import">
		<h2 class="section-title">Exportar / Importar datos</h2>
		<p class="section-desc">
			Exporta tus datos como CSV para hacer copia de seguridad, o importa un archivo CSV para
		.restaurarlos.
		</p>
		<ExportImport />
	</section>

	<section class="card" aria-label="App info">
		<h2 class="section-title">Información</h2>
		<dl class="info-list">
			<div class="info-row">
				<dt>Versión</dt>
				<dd>1.0.0</dd>
			</div>
			{#if !loading}
				<div class="info-row">
					<dt>Meses registrados</dt>
					<dd>{monthCount}</dd>
				</div>
				<div class="info-row">
					<dt>Hábitos totales</dt>
					<dd>{habitCount}</dd>
				</div>
				<div class="info-row">
					<dt>Registros diarios</dt>
					<dd>{entryCount}</dd>
				</div>
			{/if}
		</dl>
	</section>
</div>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-top: 1rem;
	}

	.page-title {
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-row dt {
		color: var(--color-text-muted);
	}

	.info-row dd {
		font-weight: 500;
	}
</style>
