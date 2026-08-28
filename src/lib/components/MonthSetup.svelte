<script lang="ts">
	import { createMonth } from '$lib/db/months';
	import { getAllHabits } from '$lib/db/habits';
	import type { Habit } from '$lib/db/types';

	let {
		year,
		month,
		previousMonthMantra = '',
		previousMonthHabits = [],
		onSetup
	}: {
		year: number;
		month: number;
		previousMonthMantra?: string;
		previousMonthHabits?: Array<{ name: string }>;
		onSetup: () => void;
	} = $props();

	type HabitRow = {
		name: string;
		open: boolean;
	};

	let mantra = $state('');
	let habits = $state<HabitRow[]>([{ name: '', open: false }]);
	let copyFromPrevious = $state(false);
	let error = $state('');
	let submitting = $state(false);
	let allHabits = $state<Habit[]>([]);

	$effect(() => {
		void getAllHabits().then((h) => {
			allHabits = h;
		});
	});

	$effect(() => {
		if (copyFromPrevious) {
			mantra = previousMonthMantra;
			habits =
				previousMonthHabits.length > 0
					? previousMonthHabits.map((h) => ({ name: h.name, open: false }))
					: [{ name: '', open: false }];
		} else {
			mantra = '';
			habits = [{ name: '', open: false }];
		}
	});

	function addHabit() {
		habits = [...habits, { name: '', open: false }];
	}

	function removeHabit(index: number) {
		if (habits.length > 1) {
			habits = habits.filter((_, i) => i !== index);
		}
	}

	function moveHabit(index: number, direction: -1 | 1) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= habits.length) return;
		const newHabits = [...habits];
		[newHabits[index], newHabits[newIndex]] = [newHabits[newIndex], newHabits[index]];
		habits = newHabits;
	}

	function updateHabitName(index: number, name: string) {
		const newHabits = [...habits];
		newHabits[index] = { ...newHabits[index], name };
		habits = newHabits;
	}

	function openDropdown(index: number) {
		const newHabits = [...habits];
		newHabits[index] = { ...newHabits[index], open: true };
		habits = newHabits;
	}

	function closeDropdown(index: number) {
		const newHabits = [...habits];
		newHabits[index] = { ...newHabits[index], open: false };
		habits = newHabits;
	}

	function selectHabit(index: number, name: string) {
		updateHabitName(index, name);
		closeDropdown(index);
	}

	function getFilteredHabits(name: string): Habit[] {
		const trimmed = name.trim().toLowerCase();
		if (!trimmed) {
			return allHabits;
		}
		return allHabits.filter((h) => h.name.toLowerCase().includes(trimmed));
	}

	function getHabitHint(name: string): string {
		const trimmed = name.trim();
		if (!trimmed) return '';
		const match = allHabits.find((h) => h.name.trim() === trimmed);
		if (match) return `Se reutilizará el hábito «${match.name}» de la colección`;
		return `Se creará «${trimmed}» como hábito nuevo en la colección`;
	}

	const monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];

	const validHabitsCount = $derived(habits.filter((h) => h.name.trim() !== '').length);

	async function handleSubmit() {
		const validHabits = habits.filter((h) => h.name.trim() !== '');
		if (validHabits.length === 0) {
			error = 'Añade al menos un hábito';
			return;
		}
		error = '';
		submitting = true;

		try {
			const id = `${year}-${String(month).padStart(2, '0')}`;
			const members = validHabits.map((h, i) => ({ name: h.name.trim(), order: i }));
			await createMonth({
				id,
				year,
				month,
				mantra: mantra.trim(),
				members
			});
			onSetup();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al guardar';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="month-setup">
	<header class="setup-header">
		<h1 class="setup-title">Configurar {monthNames[month - 1]} {year}</h1>
		<p class="setup-subtitle">Define tu mantra y los hábitos para este mes</p>
	</header>

	{#if previousMonthHabits.length > 0}
		<label class="copy-toggle">
			<input type="checkbox" bind:checked={copyFromPrevious} />
			<span class="copy-label">Copiar del mes anterior</span>
		</label>
	{/if}

	<form class="setup-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<section class="form-section card">
			<label class="field-label" for="mantra">Mantra del mes</label>
			<p class="field-hint">Una frase que te inspire este mes (opcional)</p>
			<textarea
				id="mantra"
				class="mantra-input"
				bind:value={mantra}
				maxlength={280}
				rows={3}
				placeholder="Ej: Ser constante y paciente conmigo mismo"
			></textarea>
			<span class="char-count">{mantra.length}/280</span>
		</section>

		<section class="form-section card">
			<div class="habits-header">
				<span class="field-label">Hábitos</span>
				<span class="habit-count badge">{validHabitsCount}</span>
			</div>

			<div class="habits-list">
				{#each habits as habit, i (i)}
					{@const hint = getHabitHint(habit.name)}
					{@const filtered = getFilteredHabits(habit.name)}
					<div class="habit-field">
						<div class="habit-row">
							<span class="habit-number">{i + 1}</span>
							<div class="input-wrap">
								<input
									type="text"
									class="habit-input"
									value={habit.name}
									oninput={(e) => updateHabitName(i, (e.target as HTMLInputElement).value)}
									onfocus={() => openDropdown(i)}
									onblur={() => { setTimeout(() => closeDropdown(i), 120); }}
									placeholder="Nombre del hábito"
									maxlength={100}
									autocomplete="off"
									aria-expanded={habit.open}
									aria-haspopup="listbox"
									role="combobox"
									aria-describedby={hint ? `habit-hint-${i}` : undefined}
								/>
								{#if habit.open && filtered.length > 0}
									<ul class="dropdown" role="listbox" aria-label="Hábitos existentes">
										{#each filtered as item (item.id)}
											<li>
												<button
													type="button"
													class="dropdown-option"
													role="option"
													aria-selected={item.name.trim() === habit.name.trim()}
													onmousedown={(e) => { e.preventDefault(); selectHabit(i, item.name); }}
												>
													{item.name}
												</button>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
							<div class="habit-actions">
								<button
									type="button"
									class="icon-btn"
									onclick={() => moveHabit(i, -1)}
									disabled={i === 0}
									aria-label="Subir"
								>
									↑
								</button>
								<button
									type="button"
									class="icon-btn"
									onclick={() => moveHabit(i, 1)}
									disabled={i === habits.length - 1}
									aria-label="Bajar"
								>
									↓
								</button>
								<button
									type="button"
									class="icon-btn danger"
									onclick={() => removeHabit(i)}
									disabled={habits.length === 1}
									aria-label="Eliminar"
								>
									×
								</button>
							</div>
						</div>
						{#if hint}
							<p class="habit-hint" id="habit-hint-{i}" aria-live="polite">{hint}</p>
						{/if}
					</div>
				{/each}
			</div>

			<button type="button" class="btn btn-outline add-btn" onclick={addHabit}>
				+ Añadir hábito
			</button>
		</section>

		{#if error}
			<p class="error-message">{error}</p>
		{/if}

		<button
			type="submit"
			class="btn btn-primary submit-btn"
			disabled={submitting || validHabitsCount === 0}
		>
			{submitting ? 'Guardando...' : 'Comenzar mes'}
		</button>
	</form>
</div>

<style>
	.month-setup {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding-top: 1rem;
	}

	.setup-header {
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.setup-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.setup-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.copy-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.copy-toggle input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary);
	}

	.copy-label {
		user-select: none;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.field-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.mantra-input {
		resize: vertical;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		font-size: 0.9375rem;
		line-height: 1.5;
		min-height: 4.5rem;
	}

	.mantra-input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
		border-color: var(--color-primary);
	}

	.char-count {
		align-self: flex-end;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.habits-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.habits-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.habit-field {
		position: relative;
	}

	.habit-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.habit-number {
		width: 1.5rem;
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.input-wrap {
		position: relative;
		flex: 1;
	}

	.habit-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		font-size: 0.9375rem;
	}

	.habit-input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
		border-color: var(--color-primary);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		z-index: 10;
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		max-height: 12rem;
		overflow-y: auto;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.dropdown-option {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.625rem;
		border: none;
		border-radius: calc(var(--radius) - 2px);
		background: transparent;
		color: var(--color-text);
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.dropdown-option:hover,
	.dropdown-option:focus {
		background-color: var(--color-primary-light);
		color: var(--color-primary);
	}

	.dropdown-option:focus {
		outline: none;
	}

	.habit-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0.25rem 0 0;
		padding-left: 2rem;
	}

	.habit-actions {
		display: flex;
		gap: 0.125rem;
		flex-shrink: 0;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-text-muted);
		font-size: 1rem;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.icon-btn:hover:not(:disabled) {
		background-color: var(--color-primary-light);
		color: var(--color-primary);
	}

	.icon-btn.danger:hover:not(:disabled) {
		background-color: #fee2e2;
		color: var(--color-danger);
	}

	.icon-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.add-btn {
		align-self: flex-start;
		margin-top: 0.25rem;
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--color-danger);
		text-align: center;
		padding: 0.5rem;
		background: #fef2f2;
		border-radius: var(--radius);
	}

	.submit-btn {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
