import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MonthSelector from '../../../src/lib/components/MonthSelector.svelte';

describe('MonthSelector', () => {
	const months = ['2026-09', '2026-08', '2026-07'];

	it('renders an accessible label in Spanish and lists all months', () => {
		render(MonthSelector, { props: { months, selected: '2026-09', onchange: vi.fn() } });

		const select = screen.getByLabelText('Seleccionar mes') as HTMLSelectElement;
		expect(select).toBeTruthy();
		expect(select.options).toHaveLength(3);
		expect(Array.from(select.options).map((o) => o.value)).toEqual([
			'2026-09',
			'2026-08',
			'2026-07'
		]);
	});

	it('shows the currently selected month', () => {
		render(MonthSelector, {
			props: { months: ['2026-09', '2026-08'], selected: '2026-08', onchange: vi.fn() }
		});

		const select = screen.getByLabelText('Seleccionar mes') as HTMLSelectElement;
		expect(select.value).toBe('2026-08');
	});

	it('calls onchange with the chosen month', async () => {
		const onchange = vi.fn();
		render(MonthSelector, { props: { months, selected: '2026-09', onchange } });

		const select = screen.getByLabelText('Seleccionar mes') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: '2026-08' } });

		expect(onchange).toHaveBeenCalledWith('2026-08');
	});

	it('reflects an externally changed selection', async () => {
		const { rerender } = render(MonthSelector, {
			props: { months, selected: '2026-09', onchange: vi.fn() }
		});

		await rerender({ months, selected: '2026-07', onchange: vi.fn() });

		const select = screen.getByLabelText('Seleccionar mes') as HTMLSelectElement;
		expect(select.value).toBe('2026-07');
	});
});