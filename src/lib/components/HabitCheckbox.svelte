<script lang="ts">
	let {
		checked = $bindable(false),
		label,
		onchange
	}: { checked?: boolean; label: string; onchange?: (checked: boolean) => void } = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		checked = target.checked;
		onchange?.(checked);
	}
</script>

<label class="habit-checkbox">
	<input type="checkbox" {checked} onchange={handleChange} aria-label={label} />
	<span class="checkmark" aria-hidden="true"></span>
	<span class="habit-label">{label}</span>
</label>

<style>
	.habit-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius);
		cursor: pointer;
		transition: background-color 0.15s ease;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.habit-checkbox:hover {
		background-color: var(--color-primary-light);
	}

	.habit-checkbox input {
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

	.checkmark {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-background);
		flex-shrink: 0;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.checkmark::after {
		content: '';
		display: block;
		width: 0.5rem;
		height: 0.25rem;
		border-left: 2px solid white;
		border-bottom: 2px solid white;
		transform: rotate(-45deg) translateY(-1px);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	input:checked ~ .checkmark {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	input:checked ~ .checkmark::after {
		opacity: 1;
	}

	.habit-label {
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text);
	}

	input:checked ~ .habit-label {
		color: var(--color-text-muted);
	}
</style>
