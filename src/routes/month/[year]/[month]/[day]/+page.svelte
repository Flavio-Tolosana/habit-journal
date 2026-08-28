<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import DayView from '$lib/components/DayView.svelte';
	import { getMonth } from '$lib/db/months';
	import { getHabitsForMonth, type MonthHabit } from '$lib/db/habits';
	import { getEntry, deleteEntry } from '$lib/db/entries';
	import type { Month, DailyEntry } from '$lib/db/types';

	let { data } = $props();

	let monthData = $state<Month | undefined>(undefined);
	let habits = $state<MonthHabit[]>([]);
	let entry = $state<DailyEntry | undefined>(undefined);
	let loaded = $state(false);
	let showDeleteConfirm = $state(false);

	const dateStr = $derived(
		`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`
	);
	const monthId = $derived(`${data.year}-${String(data.month).padStart(2, '0')}`);

	const isPast = $derived(() => {
		const today = new Date();
		const entryDate = new Date(data.year, data.month - 1, data.day);
		return entryDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
	});

	async function loadDay() {
		loaded = false;
		monthData = await getMonth(monthId);

		if (monthData) {
			habits = await getHabitsForMonth(monthId);
			entry = await getEntry(dateStr);
		}

		loaded = true;
	}

	$effect(() => {
		loadDay();
	});

	function goBack() {
		goto(`${base}/month/${data.year}/${data.month}`);
	}

	async function handleDelete() {
		await deleteEntry(dateStr);
		showDeleteConfirm = false;
		await loadDay();
	}
</script>

<svelte:head>
	<title>{data.day}/{data.month}/{data.year} - Habit Journal</title>
</svelte:head>

{#if !loaded}
	<div class="loading">
		<p>Cargando...</p>
	</div>
{:else if !monthData}
	<div class="not-found">
		<p>Mes no configurado</p>
		<button class="btn btn-primary" onclick={goBack}>Volver al calendario</button>
	</div>
{:else}
	<div class="day-page">
		<button class="back-btn" onclick={goBack} aria-label="Volver al calendario">
			← Calendario
		</button>

		<DayView
			date={dateStr}
			{habits}
			{entry}
			readOnly={isPast()}
		/>

		{#if entry}
			{#if showDeleteConfirm}
				<div class="delete-confirm card">
					<p>¿Eliminar la entrada de este día? Esta acción no se puede deshacer.</p>
					<div class="confirm-actions">
						<button class="btn btn-outline" onclick={() => (showDeleteConfirm = false)}>
							Cancelar
						</button>
						<button class="btn btn-danger" onclick={handleDelete}>
							Eliminar
						</button>
					</div>
				</div>
			{:else}
				<button class="btn btn-outline delete-btn" onclick={() => (showDeleteConfirm = true)}>
					Eliminar entrada
				</button>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.loading,
	.not-found {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		gap: 1rem;
		color: var(--color-text-muted);
	}

	.day-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.back-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 500;
		align-self: flex-start;
		padding: 0.25rem 0;
	}

	.back-btn:hover {
		opacity: 0.8;
	}

	.delete-btn {
		align-self: center;
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.delete-btn:hover {
		background-color: #fef2f2;
	}

	.delete-confirm {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-color: var(--color-danger);
	}

	.delete-confirm p {
		font-size: 0.875rem;
		color: var(--color-text);
		text-align: center;
	}

	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.btn-danger {
		background-color: var(--color-danger);
		color: white;
	}

	.btn-danger:hover {
		opacity: 0.9;
	}
</style>
