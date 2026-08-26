<script lang="ts">
	import { onMount } from 'svelte';
	import DayView from '$lib/components/DayView.svelte';
	import { getToday, getMonthId } from '$lib/utils/dates';
	import { getMonth } from '$lib/db/months';
	import { getHabitsForMonth } from '$lib/db/habits';
	import { getEntry } from '$lib/db/entries';
	import type { HabitDefinition, DailyEntry } from '$lib/db/types';

	const today = getToday();
	const monthId = getMonthId(today);

	let habits = $state<HabitDefinition[]>([]);
	let entry = $state<DailyEntry | undefined>();
	let monthExists = $state<boolean | null>(null);
	let loading = $state(true);

	onMount(async () => {
		const month = await getMonth(monthId);
		monthExists = !!month;
		if (month) {
			habits = await getHabitsForMonth(monthId);
			entry = await getEntry(today);
		}
		loading = false;
	});
</script>

{#if loading}
	<div class="loading-state">
		<p>Cargando...</p>
	</div>
{:else if monthExists}
	<DayView date={today} {habits} {entry} />
{:else}
	<div class="empty-state">
		<h2>Bienvenido</h2>
		<p>Primero necesitas configurar el mes actual.</p>
		<a class="btn btn-primary mt-4" href="/month/{today.split('-')[0]}/{today.split('-')[1]}">
			Configurar mes
		</a>
	</div>
{/if}

<style>
	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
		color: var(--color-text-muted);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		min-height: 50vh;
		padding-top: 4rem;
		gap: 0.75rem;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.empty-state p {
		color: var(--color-text-muted);
	}
</style>
