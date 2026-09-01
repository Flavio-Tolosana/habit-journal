<script lang="ts">
	let {
		months,
		selected,
		onchange
	}: {
		months: string[];
		selected: string;
		onchange: (monthId: string) => void;
	} = $props();

	function handleSelect(e: Event) {
		onchange((e.target as HTMLSelectElement).value);
	}
</script>

<div class="month-selector">
	<label class="sr-only" for="month-select">Seleccionar mes</label>
	<select id="month-select" class="month-select" value={selected} onchange={handleSelect}>
		{#each months as monthId (monthId)}
			<option value={monthId}>{monthId}</option>
		{/each}
	</select>
</div>

<style>
	.month-selector {
		display: flex;
		justify-content: center;
	}

	.month-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 1rem;
	}
</style>