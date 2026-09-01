<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { formatDisplayDate } from '$lib/utils/dates';
	import type { DiarySlide } from '$lib/utils/diary';
	import HabitCheckbox from './HabitCheckbox.svelte';

	let {
		slides,
		habits = [],
		initialIndex = 0
	}: {
		slides: DiarySlide[];
		habits?: Array<{ id: string; name: string }>;
		initialIndex?: number;
	} = $props();

	let container = $state<HTMLElement>();
	let currentIndex = $state(0);
	let expanded = new SvelteSet<string>();

	function clamp(idx: number): number {
		return Math.min(Math.max(0, idx), Math.max(0, slides.length - 1));
	}

	function scrollToIndex(idx: number) {
		const el = container;
		if (!el) return;
		if (typeof el.scrollTo === 'function') {
			el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
		} else {
			el.scrollLeft = idx * el.clientWidth;
		}
	}

	function focusSlide(idx: number) {
		const el = container;
		if (!el) return;
		const target = el.children[idx] as HTMLElement | undefined;
		target?.focus({ preventScroll: true });
	}

	function handleFocus() {
		focusSlide(currentIndex);
	}

	function handleScroll() {
		const el = container;
		if (!el || el.clientWidth === 0) return;
		currentIndex = clamp(Math.round(el.scrollLeft / el.clientWidth));
	}

	function handleKeydown(e: KeyboardEvent) {
		const el = container;
		if (!el) return;
		const active = document.activeElement;
		if (!active || !el.contains(active)) return;
		const idx = Array.prototype.indexOf.call(el.children, active);
		if (idx === -1) return;

		let next = idx;
		if (e.key === 'ArrowLeft') {
			next = Math.min(idx + 1, el.children.length - 1);
		} else if (e.key === 'ArrowRight') {
			next = Math.max(idx - 1, 0);
		} else {
			return;
		}
		e.preventDefault();
		currentIndex = clamp(next);
		scrollToIndex(clamp(next));
		focusSlide(clamp(next));
	}

	function toggleHabits(date: string) {
		if (expanded.has(date)) {
			expanded.delete(date);
		} else {
			expanded.add(date);
		}
	}

	function handleResize() {
		const el = container;
		if (!el || el.clientWidth === 0) return;
		requestAnimationFrame(() => {
			el.scrollLeft = currentIndex * el.clientWidth;
		});
	}

	$effect(() => {
		const idx = clamp(initialIndex);
		currentIndex = idx;
		const el = container;
		if (el) {
			requestAnimationFrame(() => {
				el.scrollLeft = idx * el.clientWidth;
			});
		}
	});

	onMount(() => {
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<section class="diary" aria-label="Diario">
	<div
		class="diary-rail"
		role="listbox"
		aria-label="Días con diario"
		tabindex="0"
		bind:this={container}
		onfocus={handleFocus}
		onscroll={handleScroll}
		onkeydown={handleKeydown}
	>
		{#each slides as slide, i (slide.date)}
			<div
				class="diary-slide"
				role="option"
				tabindex="-1"
				aria-selected={currentIndex === i}
				aria-label={formatDisplayDate(slide.date)}
			>
				<header class="slide-header">
					<h2 class="slide-date">{formatDisplayDate(slide.date)}</h2>
					{#if slide.mantra}
						<p class="slide-mantra">{slide.mantra}</p>
					{/if}
				</header>

				<div class="journal-text">{slide.journalText}</div>

				{#if habits.length > 0}
					{@const open = expanded.has(slide.date)}
					<button
						type="button"
						class="habits-toggle"
						aria-expanded={open}
						onclick={() => toggleHabits(slide.date)}
					>
						{open ? 'Ocultar hábitos' : 'Mostrar hábitos'}
					</button>
					{#if open}
						<div class="habits-grid">
							{#each habits as habit (habit.id)}
								<HabitCheckbox
									checked={slide.completions[habit.id] ?? false}
									label={habit.name}
									disabled
								/>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>

	{#if slides.length > 1}
		{#if currentIndex === 0}
			<span class="edge edge-left" data-edge="left" aria-hidden="true"></span>
		{:else if currentIndex === slides.length - 1}
			<span class="edge edge-right" data-edge="right" aria-hidden="true"></span>
		{/if}
	{/if}
</section>

<style>
	.diary {
		position: relative;
	}

	.diary-rail {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		outline: none;
	}

	.diary-rail::-webkit-scrollbar {
		display: none;
	}

	.diary-slide {
		flex: 0 0 100%;
		scroll-snap-align: start;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
		min-height: 40dvh;
		outline: none;
	}

	.diary-slide:focus-visible {
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.slide-header {
		margin-bottom: 0.75rem;
	}

	.slide-date {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.slide-mantra {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.journal-text {
		white-space: pre-wrap;
		line-height: 1.5;
		color: var(--color-text);
		max-height: 45dvh;
		overflow-y: auto;
	}

	.habits-toggle {
		margin-top: 1rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.habits-grid {
		margin-top: 0.5rem;
	}

	.edge {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2.25rem;
		pointer-events: none;
	}

	.edge-left {
		left: 0;
		background: linear-gradient(to right, var(--color-border), transparent);
	}

	.edge-right {
		right: 0;
		background: linear-gradient(to left, var(--color-border), transparent);
	}
</style>