<script lang="ts">
	import { onMount } from 'svelte';
	import Charts from '$lib/components/Charts.svelte';
	import { getToday, getMonthId, getDaysInMonth } from '$lib/utils/dates';
	import { getMonth } from '$lib/db/months';
	import { getHabitsForMonth } from '$lib/db/habits';
	import { getEntriesForMonth } from '$lib/db/entries';
	import { chartDataForMonth, completionRate } from '$lib/utils/stats';
	import { calculateStreaks } from '$lib/utils/streaks';
	import type { HabitDefinition, DailyEntry } from '$lib/db/types';

	const today = getToday();
	const monthId = getMonthId(today);

	let habits = $state<HabitDefinition[]>([]);
	let entries = $state<DailyEntry[]>([]);
	let loading = $state(true);
	let chartData = $state<{ labels: string[]; datasets: Array<{ label: string; data: number[] }> }>({
		labels: [],
		datasets: []
	});
	let streaks = $state<Map<string, { current: number; longest: number }>>(new Map());
	let totalDays = $state(0);

	onMount(async () => {
		const month = await getMonth(monthId);
		if (month) {
			habits = await getHabitsForMonth(monthId);
			entries = await getEntriesForMonth(monthId);
			chartData = chartDataForMonth(habits, entries);
			streaks = calculateStreaks(habits, entries);
			totalDays = getDaysInMonth(month.year, month.month);
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Gráficas - Habit Journal</title>
</svelte:head>

{#if loading}
	<div class="loading-state">
		<p>Cargando...</p>
	</div>
{:else if habits.length === 0}
	<div class="empty-state">
		<h2>Sin datos</h2>
		<p>No hay hábitos configurados para el mes actual.</p>
	</div>
{:else}
	<div class="charts-page">
		<h1 class="page-title">Gráficas del mes</h1>

		<section class="card chart-section" aria-label="Completion chart">
			<h2 class="section-title">Progreso diario</h2>
			<Charts data={chartData} ariaLabel="Gráfica de progreso de hábitos del mes actual" />
		</section>

		<section class="card" aria-label="Streak summary">
			<h2 class="section-title">Rachas</h2>
			<table class="streak-table" aria-label="Resumen de rachas por hábito">
				<thead>
					<tr>
						<th scope="col">Hábito</th>
						<th scope="col">Racha actual</th>
						<th scope="col">Racha más larga</th>
						<th scope="col">Tasa completado</th>
					</tr>
				</thead>
				<tbody>
					{#each habits as habit (habit.id)}
						{@const s = streaks.get(habit.id) ?? { current: 0, longest: 0 }}
						{@const rate = completionRate(habit.id, entries, totalDays)}
						<tr>
							<td>{habit.name}</td>
							<td>{s.current} día{s.current !== 1 ? 's' : ''}</td>
							<td>{s.longest} día{s.longest !== 1 ? 's' : ''}</td>
							<td>{Math.round(rate.rate * 100)}%</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<div class="sr-only" role="status" aria-live="polite">
			<table>
				<caption>Tabla de datos de hábitos del mes</caption>
				<thead>
					<tr>
						<th>Fecha</th>
						{#each habits as habit}
							<th>{habit.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each entries as entry}
						<tr>
							<td>{entry.date}</td>
							{#each habits as habit}
								<td>{entry.completions[habit.id] ? 'Completado' : 'No completado'}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<style>
	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		gap: 0.5rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.empty-state h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.charts-page {
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
		margin-bottom: 0.75rem;
	}

	.chart-section {
		overflow: hidden;
	}

	.streak-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.streak-table th,
	.streak-table td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.streak-table th {
		font-weight: 500;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.streak-table tbody tr:last-child td {
		border-bottom: none;
	}
</style>
