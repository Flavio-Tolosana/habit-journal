<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	let {
		data,
		ariaLabel = 'Habit completion chart',
		type = 'bar'
	}: {
		data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> };
		ariaLabel?: string;
		type?: 'bar' | 'line';
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	function cloneData(
		d: { labels: string[]; datasets: Array<{ label: string; data: number[] }> }
	): { labels: string[]; datasets: Array<{ label: string; data: number[] }> } {
		return {
			labels: [...d.labels],
			datasets: d.datasets.map((set) => ({ label: set.label, data: [...set.data] }))
		};
	}

	onMount(() => {
		chart = new Chart(canvas, {
			type,
			data: cloneData(data),
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
			}
		});
	});

	onDestroy(() => chart?.destroy());

	$effect(() => {
		if (chart) {
			chart.data = cloneData(data);
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
