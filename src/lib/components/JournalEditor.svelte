<script lang="ts">
	import { setJournalText } from '$lib/db/entries';

	let {
		date,
		initialText = ''
	}: { date: string; initialText?: string } = $props();
	let text = $state(initialText);
	let charCount = $derived(text.length);
	let saveTimeout: ReturnType<typeof setTimeout>;

	function handleInput() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (text.length <= 2000) {
				setJournalText(date, text);
			}
		}, 500);
	}
</script>

<div class="journal-editor">
	<label for="journal-{date}">Escribe sobre tu día</label>
	<textarea
		id="journal-{date}"
		bind:value={text}
		oninput={handleInput}
		maxlength="2000"
		placeholder="¿Qué hiciste hoy? ¿Qué te hizo feliz?"
		aria-label="Journal entry for {date}"
	></textarea>
	<span class="char-count" class:limit={charCount >= 1900}>{charCount}/2000</span>
</div>

<style>
	.journal-editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	textarea {
		width: 100%;
		min-height: 8rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-background);
		color: var(--color-text);
		resize: vertical;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-light);
	}

	textarea::placeholder {
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	.char-count {
		align-self: flex-end;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		transition: color 0.15s ease;
	}

	.char-count.limit {
		color: var(--color-danger);
		font-weight: 500;
	}
</style>
