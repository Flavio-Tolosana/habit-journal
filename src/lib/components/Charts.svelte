<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	let {
		data,
		ariaLabel = 'Habit completion chart'
	}: {
		data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> };
		ariaLabel?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		chart = new Chart(canvas, {
			type: 'bar',
			data,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { position: 'bottom' } },
				scales: { y: { beginAtZero: true, max: 1, ticks: { stepSize: 1 } } }
			}
		});
	});

	onDestroy(() => chart?.destroy());

	$effect(() => {
		if (chart) {
			chart.data = data;
			chart.update();
		}
	});
</script>

<div class="chart-container" role="img" aria-label={ariaLabel}>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 300px;
	}
</style>
