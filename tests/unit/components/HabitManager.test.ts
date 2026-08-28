import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

vi.mock('../../../src/lib/db/habits', () => ({
	getAllHabits: vi.fn(),
	getHabitReferenceCount: vi.fn(),
	renameHabit: vi.fn(),
	deleteHabit: vi.fn()
}));

import {
	getAllHabits,
	getHabitReferenceCount,
	renameHabit,
	deleteHabit
} from '../../../src/lib/db/habits';
import HabitManager from '../../../src/lib/components/HabitManager.svelte';

const mockGetAllHabits = vi.mocked(getAllHabits);
const mockGetReferenceCount = vi.mocked(getHabitReferenceCount);
const mockRenameHabit = vi.mocked(renameHabit);
const mockDeleteHabit = vi.mocked(deleteHabit);

const leer = { id: 'leer', name: 'Leer' };
const meditar = { id: 'meditar', name: 'Meditar' };

beforeEach(() => {
	vi.clearAllMocks();
	mockGetAllHabits.mockResolvedValue([leer, meditar]);
	mockGetReferenceCount.mockImplementation(async (id: string) => (id === 'leer' ? 3 : 0));
	mockRenameHabit.mockResolvedValue({ id: 'meditacion', name: 'Meditación' } as never);
	mockDeleteHabit.mockResolvedValue(undefined as never);
});

describe('HabitManager listing', () => {
	it('lists all habits in the collection with their reference counts', async () => {
		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('Leer')).toBeTruthy();
			expect(screen.getByText('Meditar')).toBeTruthy();
		});
		expect(screen.getByText('3 referencias')).toBeTruthy();
		expect(screen.getByText('0 referencias')).toBeTruthy();
	});

	it('locks rename/delete for a habit that is referenced', async () => {
		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('Leer')).toBeTruthy();
		});

		const renameButtons = screen.getAllByRole('button', { name: 'Renombrar' });
		const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar' });

		expect((renameButtons[0] as HTMLButtonElement).disabled).toBe(true);
		expect((deleteButtons[0] as HTMLButtonElement).disabled).toBe(true);
		expect(screen.getByText('En uso — no se puede modificar')).toBeTruthy();
	});

	it('shows an empty message when the collection is empty', async () => {
		mockGetAllHabits.mockResolvedValue([]);

		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('No hay hábitos en la colección todavía.')).toBeTruthy();
		});
	});
});

describe('HabitManager rename', () => {
	it('renames an unreferenced habit successfully', async () => {
		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('Meditar')).toBeTruthy();
		});

		const renameButtons = screen.getAllByRole('button', { name: 'Renombrar' });
		await fireEvent.click(renameButtons[1]);

		const input = await screen.findByLabelText('Nuevo nombre para Meditar');
		await fireEvent.input(input, { target: { value: 'Meditación' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() => {
			expect(mockRenameHabit).toHaveBeenCalledWith('meditar', 'Meditación');
		});
	});

	it('does not rename when the habit is referenced', async () => {
		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('Leer')).toBeTruthy();
		});

		const renameButtons = screen.getAllByRole('button', { name: 'Renombrar' });
		await fireEvent.click(renameButtons[0]);

		expect(mockRenameHabit).not.toHaveBeenCalled();
		expect(screen.queryByLabelText('Nuevo nombre para Leer')).toBeNull();
	});
});

describe('HabitManager delete', () => {
	it('deletes an unreferenced habit after confirmation', async () => {
		render(HabitManager);

		await waitFor(() => {
			expect(screen.getByText('Meditar')).toBeTruthy();
		});

		const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar' });
		await fireEvent.click(deleteButtons[1]);

		const confirmButton = screen
			.getAllByRole('button', { name: 'Eliminar' })
			.find((b) => !(b as HTMLButtonElement).disabled);
		await fireEvent.click(confirmButton!);
		await waitFor(() => {
			expect(mockDeleteHabit).toHaveBeenCalledWith('meditar');
		});
	});
});