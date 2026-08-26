<script lang="ts">
	import HabitCheckbox from './HabitCheckbox.svelte';
	import JournalEditor from './JournalEditor.svelte';
	import { setHabitCompletion } from '$lib/db/entries';
	import { formatDisplayDate } from '$lib/utils/dates';
	import type { HabitDefinition, DailyEntry } from '$lib/db/types';

	let {
		date,
		habits,
		entry,
		readOnly = false
	}: { date: string; habits: HabitDefinition[]; entry?: DailyEntry; readOnly?: boolean } = $props();

	function handleHabitToggle(habitId: string, completed: boolean) {
		if (!readOnly) {
			setHabitCompletion(date, habitId, completed);
		}
	}
</script>

<div class="day-view">
	<h2 class="day-title">{formatDisplayDate(date)}</h2>

	{#if habits.length === 0}
		<p class="empty-state">No hay hábitos configurados para este mes.</p>
	{:else}
		<section class="habits-section card" aria-label="Habits">
			<h3 class="section-title">Hábitos</h3>
			{#each habits as habit (habit.id)}
				<HabitCheckbox
					label={habit.name}
					checked={entry?.completions[habit.id] ?? false}
					onchange={(checked) => handleHabitToggle(habit.id, checked)}
				/>
			{/each}
		</section>
	{/if}

	<section class="journal-section card">
		<h3 class="section-title">Diario</h3>
		<JournalEditor {date} initialText={entry?.journalText ?? ''} />
	</section>
</div>

<style>
	.day-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-top: 1rem;
	}

	.day-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
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

	.habits-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.journal-section {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: 2rem 1rem;
	}
</style>
