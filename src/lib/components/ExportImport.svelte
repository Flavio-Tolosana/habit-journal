<script lang="ts">
	import { exportToCSV, importFromCSV } from '$lib/db/export';

	let importing = $state(false);
	let message = $state('');

	function handleExport() {
		exportToCSV().then((csv) => {
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `habit-journal-${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		});
	}

	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			importing = true;
			message = '';
			try {
				const text = await file.text();
				const result = await importFromCSV(text);
				message = `Importados: ${result.months} meses, ${result.habits} hábitos, ${result.entries} registros.`;
			} catch (e) {
				message = `Error al importar: ${e instanceof Error ? e.message : 'error desconocido'}`;
			} finally {
				importing = false;
			}
		};
		input.click();
	}
</script>

<div class="export-import">
	<button class="btn btn-primary" onclick={handleExport}>Exportar CSV</button>
	<button class="btn btn-outline" onclick={handleImport} disabled={importing}>
		{importing ? 'Importando...' : 'Importar CSV'}
	</button>
	{#if message}
		<p class="message" role="status">{message}</p>
	{/if}
</div>

<style>
	.export-import {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.message {
		width: 100%;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}
</style>
