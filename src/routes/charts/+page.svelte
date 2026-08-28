<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllMonths } from '$lib/db/months';
	import { getHabitsForMonth, type MonthHabit } from '$lib/db/habits';
	import { getEntriesForMonth } from '$lib/db/entries';
	import { monthCountsData, completionRate } from '$lib/utils/stats';
	import { calculateStreaks } from '$lib/utils/streaks';
	import { getDaysInMonth } from '$lib/utils/dates';
	import Charts from '$lib/components/Charts.svelte';
	import type { Month, DailyEntry } from '$lib/db/types';

	let months = $state<Month[]>([]);
	let selectedIndex = $state(0);
	let habits = $state<MonthHabit[]>([]);
	let entries = $state<DailyEntry[]>([]);
	let loading = $state(true);
	let chartData = $state<{ labels: string[]; datasets: Array<{ label: string; data: number[] }> }>({
		labels: [],
		datasets: []
	});
	let streaks = $state<Map<string, { current: number; longest: number }>>(new Map());
	let totalDays = $state(0);

	const monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];

	onMount(async () => {
		months = await getAllMonths();
		if (months.length > 0) {
			selectedIndex = 0;
			await loadMonth(0);
		}
		loading = false;
	});

	async function loadMonth(idx: number) {
		const month = months[idx];
		const monthHabits = await getHabitsForMonth(month.id);
		const monthEntries = await getEntriesForMonth(month.id);
		const entriesByDate = new Map(monthEntries.map((e) => [e.date, e]));
		habits = monthHabits;
		entries = monthEntries;
		chartData = monthCountsData(
			month.year,
			month.month,
			getDaysInMonth(month.year, month.month),
			monthHabits.map((h) => h.id),
			entriesByDate
		);
		streaks = calculateStreaks(monthHabits, monthEntries);
		totalDays = getDaysInMonth(month.year, month.month);
	}

	const selectedMonth = $derived(months[selectedIndex]);
	const monthLabel = $derived(
		selectedMonth ? `${monthNames[selectedMonth.month - 1]} ${selectedMonth.year}` : ''
	);
	const hasEntries = $derived(entries.some((e) => Object.keys(e.completions).length > 0));

	function goPrevious() {
		if (selectedIndex < months.length - 1) {
			selectedIndex += 1;
			void loadMonth(selectedIndex);
		}
	}

	function goNext() {
		if (selectedIndex > 0) {
			selectedIndex -= 1;
			void loadMonth(selectedIndex);
		}
	}

	function goToMonth(idx: number) {
		selectedIndex = idx;
		void loadMonth(idx);
	}
</script>

<svelte:head>
	<title>Gráficas - Habit Journal</title>
</svelte:head>

{#if loading}
	<div class="loading-state">
		<p>Cargando...</p>
	</div>
{:else if months.length === 0}
	<div class="empty-state">
		<h2>Sin datos</h2>
		<p>No hay meses configurados todavía.</p>
	</div>
{:else}
	<div class="charts-page">
		<h1 class="page-title">Gráficas</h1>

		<div class="month-nav" aria-label="Navegación entre meses">
			<button
				type="button"
				class="nav-btn"
				onclick={goPrevious}
				disabled={selectedIndex >= months.length - 1}
				aria-label="Mes anterior"
			>
				←
			</button>

			<select
				class="month-select"
				value={selectedIndex}
				onchange={(e) => goToMonth(Number((e.target as HTMLSelectElement).value))}
				aria-label="Seleccionar mes"
			>
				{#each months as month, i (month.id)}
					<option value={i}>{monthNames[month.month - 1]} {month.year}</option>
				{/each}
			</select>

			<button
				type="button"
				class="nav-btn"
				onclick={goNext}
				disabled={selectedIndex <= 0}
				aria-label="Mes siguiente"
			>
				→
			</button>
		</div>

		<section class="card chart-section" aria-label="Evolución de hábitos de {monthLabel}">
			<h2 class="section-title">Progreso diario — {monthLabel}</h2>
			{#if !hasEntries}
				<div class="chart-empty">
					<p>Aún no hay registros para este mes.</p>
					<p class="muted-chart">
						Marca el progreso de algún día en el calendario para que aparezca la gráfica.
					</p>
				</div>
			{:else}
				<Charts data={chartData} type="line" ariaLabel="Gráfica de hábitos completados por día de {monthLabel}" />
			{/if}
			<p class="chart-caption">Días del mes (eje X) frente al número de hábitos completados (eje Y)</p>
		</section>

		<section class="card" aria-label="Resumen de rachas">
			<h2 class="section-title">Rachas — {monthLabel}</h2>
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
				<caption>Tabla de datos de hábitos de {monthLabel}</caption>
				<thead>
					<tr>
						<th>Fecha</th>
						{#each habits as habit (habit.id)}
							<th>{habit.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each entries as entry (entry.date)}
						<tr>
							<td>{entry.date}</td>
							{#each habits as habit (habit.id)}
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

	.month-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.nav-btn:hover:not(:disabled) {
		background-color: var(--color-primary-light);
		color: var(--color-primary);
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.month-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.month-select:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
		border-color: var(--color-primary);
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

	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		height: 300px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.muted-chart {
		font-size: 0.8125rem;
	}

	.chart-caption {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-align: center;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
