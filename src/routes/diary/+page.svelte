<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import DiarySlides from '$lib/components/DiarySlides.svelte';
	import MonthSelector from '$lib/components/MonthSelector.svelte';
	import { getEntriesForMonth, getAllEntries } from '$lib/db/entries';
	import { getMonth } from '$lib/db/months';
	import { getHabitsForMonth, type MonthHabit } from '$lib/db/habits';
	import { getToday, getMonthId } from '$lib/utils/dates';
	import {
		buildSlideSequence,
		initialSlideIndex,
		monthsWithDiary,
		type DiarySlide
	} from '$lib/utils/diary';

	const today = getToday();
	const currentMonth = getMonthId(today);

	let months = $state<string[]>([]);
	let selectedMonth = $state(currentMonth);
	let slides = $state<DiarySlide[]>([]);
	let habits = $state<MonthHabit[]>([]);
	let initialIndex = $state(0);
	let loading = $state(true);
	let error = $state(false);
	let inflight = 0;

	const selectableMonths = $derived(
		[...new Set([...months, currentMonth])].sort((a, b) => b.localeCompare(a))
	);

	async function loadMonth(m: string) {
		const id = ++inflight;
		loading = true;
		error = false;
		try {
			const [entries, month] = await Promise.all([getEntriesForMonth(m), getMonth(m)]);
			if (id !== inflight) return;
			slides = buildSlideSequence(entries, m, month?.mantra);
			habits = month ? await getHabitsForMonth(m) : [];
			if (id !== inflight) return;
			initialIndex = initialSlideIndex(slides, today);
			loading = false;
		} catch (err) {
			if (id !== inflight) return;
			console.error(err);
			error = true;
			loading = false;
		}
	}

	async function loadAll() {
		try {
			const all = await getAllEntries();
			months = monthsWithDiary(all);
		} catch (err) {
			console.error(err);
			error = true;
		}
	}

	function refresh() {
		loadAll();
		loadMonth(selectedMonth);
	}

	$effect(() => {
		loadMonth(selectedMonth);
	});

	onMount(() => {
		loadAll();
	});
</script>

<svelte:head>
	<title>Diario - Habit Journal</title>
</svelte:head>

{#if error}
	<div class="error-state" role="alert">
		<p>No se pudo leer el diario. Inténtalo de nuevo.</p>
		<button type="button" class="btn btn-primary" onclick={refresh}>Reintentar</button>
	</div>
{:else if loading}
	<div class="loading-state">
		<p>Cargando...</p>
	</div>
{:else if months.length === 0 && slides.length === 0}
	<div class="empty-state">
		<h2>Aún no has escrito ninguna entrada de diario</h2>
		<p>Escribe tu primera entrada en el día de hoy para verla aquí.</p>
		<a class="btn btn-primary" href="{base}/">Ir al día de hoy</a>
	</div>
{:else if slides.length === 0}
	<div class="empty-state">
		<h2>No hay entradas de diario para este mes</h2>
		<p>Selecciona otro mes para ver sus entradas.</p>
	</div>
{:else}
	<div class="diary-view">
		<div class="month-controls">
			<MonthSelector
				months={selectableMonths}
				selected={selectedMonth}
				onchange={(m) => (selectedMonth = m)}
			/>
		</div>

		<DiarySlides {slides} {habits} {initialIndex} />
	</div>
{/if}

<style>
	.diary-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
	}

	.month-controls {
		display: flex;
		justify-content: center;
	}

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
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.empty-state p {
		color: var(--color-text-muted);
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		min-height: 50vh;
		justify-content: center;
		color: var(--color-text);
	}
</style>