<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import MonthSetup from '$lib/components/MonthSetup.svelte';
	import MonthCalendar from '$lib/components/MonthCalendar.svelte';
	import { getMonth, getAllMonths } from '$lib/db/months';
	import { getHabitsForMonth } from '$lib/db/habits';
	import { getEntriesForMonth } from '$lib/db/entries';
	import type { Month, HabitDefinition, DailyEntry } from '$lib/db/types';

	let monthData = $state<Month | undefined>(undefined);
	let habits = $state<HabitDefinition[]>([]);
	let entries = $state<DailyEntry[]>([]);
	let previousMonth = $state<Month | undefined>(undefined);
	let previousHabits = $state<Array<{ name: string }>>([]);
	let loaded = $state(false);

	const year = $derived(parseInt($page.params.year ?? '0'));
	const month = $derived(parseInt($page.params.month ?? '0'));
	const monthId = $derived(`${year}-${String(month).padStart(2, '0')}`);

	async function loadMonth() {
		loaded = false;
		monthData = await getMonth(monthId);

		if (monthData) {
			habits = await getHabitsForMonth(monthId);
			entries = await getEntriesForMonth(monthId);
		}

		const allMonths = await getAllMonths();
		previousMonth = allMonths.find((m) => {
			if (m.year < year) return true;
			if (m.year === year && m.month < month) return true;
			return false;
		});

		if (previousMonth) {
			const prevHabits = await getHabitsForMonth(previousMonth.id);
			previousHabits = prevHabits.map((h) => ({ name: h.name }));
		}

		loaded = true;
	}

	$effect(() => {
		loadMonth();
	});

	function handleDayClick(date: string) {
		const [, m, d] = date.split('-');
		goto(`/month/${year}/${parseInt(m)}/${parseInt(d)}`);
	}

	function handleSetupComplete() {
		loadMonth();
	}

	const monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];
</script>

<svelte:head>
	<title>{monthNames[month - 1]} {year} - Habit Journal</title>
</svelte:head>

{#if !loaded}
	<div class="loading">
		<p>Cargando...</p>
	</div>
{:else if !monthData}
	<MonthSetup
		{year}
		{month}
		previousMonthMantra={previousMonth?.mantra ?? ''}
		previousMonthHabits={previousHabits}
		onSetup={handleSetupComplete}
	/>
{:else}
	<MonthCalendar
		{year}
		{month}
		{entries}
		onDayClick={handleDayClick}
	/>
{/if}

<style>
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		color: var(--color-text-muted);
	}
</style>
