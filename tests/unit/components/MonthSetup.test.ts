import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

vi.mock('../../../src/lib/db/habits', () => ({
	getAllHabits: vi.fn()
}));

vi.mock('../../../src/lib/db/months', () => ({
	createMonth: vi.fn()
}));

import { getAllHabits } from '../../../src/lib/db/habits';
import { createMonth } from '../../../src/lib/db/months';
import MonthSetup from '../../../src/lib/components/MonthSetup.svelte';

const mockGetAllHabits = vi.mocked(getAllHabits);
const mockCreateMonth = vi.mocked(createMonth);

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		year: 2026,
		month: 8,
		onSetup: vi.fn(),
		...overrides
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mockGetAllHabits.mockResolvedValue([]);
	mockCreateMonth.mockResolvedValue(undefined as never);
});

describe('MonthSetup autocomplete', () => {
	it('suggests existing habits from the collection when the field is focused', async () => {
		mockGetAllHabits.mockResolvedValue([
			{ id: 'meditar', name: 'Meditar' },
			{ id: 'leer', name: 'Leer' }
		]);

		render(MonthSetup, baseProps());

		const input = await screen.findByPlaceholderText('Nombre del hábito');
		await fireEvent.focus(input);

		await waitFor(() => {
			const options = document.querySelectorAll('.dropdown-option');
			expect(Array.from(options).map((o) => o.textContent)).toEqual(
				expect.arrayContaining(['Meditar', 'Leer'])
			);
		});
	});

	it('selects a habit from the dropdown when an option is chosen', async () => {
		mockGetAllHabits.mockResolvedValue([
			{ id: 'meditar', name: 'Meditar' },
			{ id: 'leer', name: 'Leer' }
		]);

		render(MonthSetup, baseProps());

		const input = (await screen.findByPlaceholderText(
			'Nombre del hábito'
		)) as HTMLInputElement;

		await fireEvent.focus(input);
		await fireEvent.mouseDown(document.querySelectorAll('.dropdown-option')[1]);

		await waitFor(() => {
			expect(input.value).toBe('Leer');
			expect(screen.getByText('Se reutilizará el hábito «Leer» de la colección')).toBeTruthy();
		});
	});

	it('shows a reuse hint when the typed name matches an existing habit exactly', async () => {
		mockGetAllHabits.mockResolvedValue([{ id: 'meditar', name: 'Meditar' }]);

		render(MonthSetup, baseProps());

		const input = await screen.findByPlaceholderText('Nombre del hábito');
		await fireEvent.input(input, { target: { value: 'Meditar' } });

		await waitFor(() => {
			expect(screen.getByText('Se reutilizará el hábito «Meditar» de la colección')).toBeTruthy();
		});
	});

	it('offers to create a new habit when the name does not match', async () => {
		mockGetAllHabits.mockResolvedValue([{ id: 'meditar', name: 'Meditar' }]);

		render(MonthSetup, baseProps());

		const input = await screen.findByPlaceholderText('Nombre del hábito');
		await fireEvent.input(input, { target: { value: 'Correr' } });

		await waitFor(() => {
			expect(screen.getByText('Se creará «Correr» como hábito nuevo en la colección')).toBeTruthy();
		});
	});
});

describe('MonthSetup submit', () => {
	it('creates the month passing members as name/order pairs', async () => {
		const onSetup = vi.fn();
		render(MonthSetup, baseProps({ onSetup }));

		const input = await screen.findByPlaceholderText('Nombre del hábito');
		await fireEvent.input(input, { target: { value: '  Leer  ' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Comenzar mes' }));

		await waitFor(() => {
			expect(mockCreateMonth).toHaveBeenCalledWith({
				id: '2026-08',
				year: 2026,
				month: 8,
				mantra: '',
				members: [{ name: 'Leer', order: 0 }]
			});
		});
		expect(onSetup).toHaveBeenCalled();
	});

	it('reuses previous month habit names when copying from the previous month', async () => {
		const onSetup = vi.fn();
		render(
			MonthSetup,
			baseProps({
				year: 2026,
				month: 9,
				previousMonthMantra: 'Mantra previo',
				previousMonthHabits: [{ name: 'Leer' }, { name: 'Meditar' }],
				onSetup
			})
		);

		await fireEvent.click(screen.getByLabelText('Copiar del mes anterior'));

		const inputs = await screen.findAllByPlaceholderText('Nombre del hábito');
		await waitFor(() => {
			expect((inputs[0] as HTMLInputElement).value).toBe('Leer');
			expect((inputs[1] as HTMLInputElement).value).toBe('Meditar');
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Comenzar mes' }));

		await waitFor(() => {
			expect(mockCreateMonth).toHaveBeenCalledWith({
				id: '2026-09',
				year: 2026,
				month: 9,
				mantra: 'Mantra previo',
				members: [
					{ name: 'Leer', order: 0 },
					{ name: 'Meditar', order: 1 }
				]
			});
		});
	});
});