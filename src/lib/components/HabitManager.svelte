<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllHabits, getHabitReferenceCount, renameHabit, deleteHabit } from '$lib/db/habits';
	import type { Habit } from '$lib/db/types';

	type HabitRow = {
		habit: Habit;
		references: number;
		draft: string;
		editing: boolean;
		confirmingDelete: boolean;
	};

	let rows = $state<HabitRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let message = $state('');

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		message = '';
		const habits = await getAllHabits();
		const loaded: HabitRow[] = [];
		for (const habit of habits) {
			const references = await getHabitReferenceCount(habit.id);
			loaded.push({
				habit,
				references,
				draft: habit.name,
				editing: false,
				confirmingDelete: false
			});
		}
		rows = loaded;
		loading = false;
	}

	function startRename(row: HabitRow) {
		if (row.references > 0) return;
		row.draft = row.habit.name;
		row.editing = true;
		error = '';
	}

	function cancelRename(row: HabitRow) {
		row.editing = false;
		row.draft = row.habit.name;
	}

	async function saveRename(row: HabitRow) {
		if (row.references > 0) return;
		const newName = row.draft.trim();
		if (!newName || newName === row.habit.name) {
			cancelRename(row);
			return;
		}
		error = '';
		message = '';
		try {
			await renameHabit(row.habit.id, newName);
			message = `Hábito renombrado a «${newName}».`;
			await load();
		} catch (e) {
			row.editing = false;
			error = e instanceof Error ? e.message : 'Error al renombrar';
		}
	}

	function askDelete(row: HabitRow) {
		if (row.references > 0) return;
		row.confirmingDelete = true;
		error = '';
	}

	function cancelDelete(row: HabitRow) {
		row.confirmingDelete = false;
	}

	async function confirmDelete(row: HabitRow) {
		if (row.references > 0) return;
		const name = row.habit.name;
		error = '';
		message = '';
		try {
			await deleteHabit(row.habit.id);
			message = `Hábito «${name}» eliminado.`;
			await load();
		} catch (e) {
			row.confirmingDelete = false;
			error = e instanceof Error ? e.message : 'Error al eliminar';
		}
	}
</script>

<div class="habit-manager">
	<div class="manager-header">
		<h1 class="page-title">Gestionar hábitos</h1>
		<p class="page-desc">
			Ajusta tu colección de hábitos. Solo puedes renombrar o eliminar hábitos que no estén en uso.
		</p>
	</div>

	{#if message}
		<p class="feedback success" role="status">{message}</p>
	{/if}
	{#if error}
		<p class="feedback error" role="alert">{error}</p>
	{/if}

	{#if loading}
		<p class="empty-state">Cargando...</p>
	{:else if rows.length === 0}
		<div class="empty-state">
			<p>No hay hábitos en la colección todavía.</p>
			<p class="muted">Crea tu primer mes para empezar a construirla.</p>
		</div>
	{:else}
		<ul class="habit-list">
			{#each rows as row (row.habit.id)}
				<li class="habit-card card">
					<div class="habit-main">
						<div class="habit-info">
							{#if row.editing}
								<label class="sr-only" for="rename-{row.habit.id}">Nuevo nombre para {row.habit.name}</label>
								<input
									id="rename-{row.habit.id}"
									class="rename-input"
									type="text"
									value={row.draft}
									oninput={(e) => (row.draft = (e.target as HTMLInputElement).value)}
									maxlength={100}
									onkeydown={(e) => {
										if (e.key === 'Enter') saveRename(row);
										if (e.key === 'Escape') cancelRename(row);
									}}
								/>
							{:else}
								<span class="habit-name">{row.habit.name}</span>
							{/if}
							<span class="reference-count">
								{row.references} referencia{row.references !== 1 ? 's' : ''}
							</span>
						</div>

						{#if row.references > 0}
							<span class="lock-badge" aria-label="Hábito en uso, bloqueado">
								En uso — no se puede modificar
							</span>
						{/if}
					</div>

					{#if row.editing}
						<div class="rename-actions">
							<button class="btn btn-primary btn-sm" onclick={() => saveRename(row)}>
								Guardar
							</button>
							<button class="btn btn-outline btn-sm" onclick={() => cancelRename(row)}>
								Cancelar
							</button>
						</div>
					{:else if row.confirmingDelete}
						<div class="delete-actions">
							<span class="confirm-text">¿Eliminar este hábito?</span>
							<button class="btn btn-danger btn-sm" onclick={() => confirmDelete(row)}>
								Eliminar
							</button>
							<button class="btn btn-outline btn-sm" onclick={() => cancelDelete(row)}>
								Cancelar
							</button>
						</div>
					{:else}
						<div class="row-actions">
							<button
								type="button"
								class="btn btn-outline btn-sm"
								onclick={() => startRename(row)}
								disabled={row.references > 0}
								aria-disabled={row.references > 0}
							>
								Renombrar
							</button>
							<button
								type="button"
								class="btn btn-outline btn-sm danger-text"
								onclick={() => askDelete(row)}
								disabled={row.references > 0}
								aria-disabled={row.references > 0}
							>
								Eliminar
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.habit-manager {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
	}

	.manager-header {
		text-align: center;
	}

	.page-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.page-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.feedback {
		font-size: 0.875rem;
		text-align: center;
		padding: 0.5rem;
		border-radius: var(--radius);
	}

	.feedback.success {
		color: var(--color-text);
		background: var(--color-primary-light);
	}

	.feedback.error {
		color: var(--color-danger);
		background: #fef2f2;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: 2rem 1rem;
	}

	.muted {
		font-size: 0.875rem;
	}

	.habit-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.habit-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem 1rem;
	}

	.habit-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.habit-info {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.habit-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.reference-count {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.lock-badge {
		font-size: 0.75rem;
		color: var(--color-danger);
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 999px;
		padding: 0.125rem 0.5rem;
		align-self: flex-start;
	}

	.row-actions,
	.rename-actions,
	.delete-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.delete-actions {
		flex-direction: column;
		align-items: flex-end;
	}

	.confirm-text {
		font-size: 0.75rem;
		color: var(--color-danger);
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}

	.danger-text {
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.rename-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		font-size: 0.9375rem;
	}

	.rename-input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
		border-color: var(--color-primary);
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