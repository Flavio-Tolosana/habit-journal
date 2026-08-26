<script lang="ts">
	import { getDaysInMonth } from '$lib/utils/dates';

	let {
		year,
		month,
		entries = [],
		onDayClick
	}: {
		year: number;
		month: number;
		entries: Array<{ date: string }>;
		onDayClick: (date: string) => void;
	} = $props();

	let focusedIndex = $state(0);

	const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

	const firstDayOfWeek = $derived(new Date(year, month - 1, 1).getDay());
	const totalDays = $derived(getDaysInMonth(year, month));

	const entryDates = $derived(new Set(entries.map((e) => e.date)));

	const calendarCells = $derived.by(() => {
		const cells: Array<{ day: number; date: string; hasEntry: boolean }> = [];
		for (let i = 0; i < firstDayOfWeek; i++) {
			cells.push({ day: 0, date: '', hasEntry: false });
		}
		for (let d = 1; d <= totalDays; d++) {
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({ day: d, date: dateStr, hasEntry: entryDates.has(dateStr) });
		}
		return cells;
	});

	const interactiveCells = $derived(calendarCells.map((c, i) => ({ ...c, globalIndex: i })).filter((c) => c.day > 0));

	const monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];

	function handleKeyDown(e: KeyboardEvent, cellIndex: number) {
		const cells = interactiveCells;
		let nextIndex = cellIndex;

		switch (e.key) {
			case 'ArrowRight':
				e.preventDefault();
				nextIndex = Math.min(cellIndex + 1, cells.length - 1);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				nextIndex = Math.max(cellIndex - 1, 0);
				break;
			case 'ArrowDown':
				e.preventDefault();
				nextIndex = Math.min(cellIndex + 7, cells.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				nextIndex = Math.max(cellIndex - 7, 0);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				onDayClick(cells[cellIndex].date);
				return;
			default:
				return;
		}

		if (nextIndex !== cellIndex) {
			focusedIndex = nextIndex;
			const target = (e.target as HTMLElement)
				.closest('.calendar-grid')
				?.querySelectorAll<HTMLElement>('.day-cell[tabindex="0"]');
			target?.[nextIndex]?.focus();
		}
	}
</script>

<div class="month-calendar">
	<h2 class="calendar-title">{monthNames[month - 1]} {year}</h2>

	<div class="calendar-grid" role="grid" aria-label="Calendario mensual">
		{#each dayHeaders as header}
			<div class="day-header" role="columnheader">{header}</div>
		{/each}

		{#each calendarCells as cell, i}
			{#if cell.day === 0}
				<div class="day-cell empty" aria-hidden="true"></div>
			{:else}
				{@const cellIdx = interactiveCells.findIndex((c) => c.globalIndex === i)}
				<button
					class="day-cell"
					class:has-entry={cell.hasEntry}
					tabindex={cellIdx === focusedIndex ? 0 : -1}
					role="gridcell"
					aria-label="{cell.day} de {monthNames[month - 1]}"
					onclick={() => onDayClick(cell.date)}
					onkeydown={(e) => handleKeyDown(e, cellIdx)}
				>
					<span class="day-number">{cell.day}</span>
					{#if cell.hasEntry}
						<span class="entry-dot" aria-label="Con entrada"></span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.month-calendar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
	}

	.calendar-title {
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
		color: var(--color-text);
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.day-header {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		padding: 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.day-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--radius);
		background: transparent;
		cursor: pointer;
		transition: background-color 0.15s ease;
		position: relative;
		font-size: 0.9375rem;
		color: var(--color-text);
	}

	.day-cell:not(.empty):hover {
		background-color: var(--color-primary-light);
	}

	.day-cell:not(.empty):focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.day-cell.empty {
		cursor: default;
	}

	.day-cell.has-entry {
		background-color: var(--color-accent-light);
		font-weight: 600;
	}

	.day-number {
		line-height: 1;
	}

	.entry-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--color-accent);
		margin-top: 2px;
	}
</style>
