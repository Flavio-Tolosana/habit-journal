import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

vi.mock('../../../src/lib/db/entries', () => ({
	getAllEntries: vi.fn(),
	getEntriesForMonth: vi.fn()
}));
vi.mock('../../../src/lib/db/months', () => ({
	getMonth: vi.fn()
}));
vi.mock('../../../src/lib/db/habits', () => ({
	getHabitsForMonth: vi.fn()
}));

import { getAllEntries, getEntriesForMonth } from '../../../src/lib/db/entries';
import { getMonth } from '../../../src/lib/db/months';
import { getHabitsForMonth } from '../../../src/lib/db/habits';
import { getToday, getMonthId } from '../../../src/lib/utils/dates';
import type { DailyEntry } from '../../../src/lib/db/types';
import DiaryPage from '../../../src/routes/diary/+page.svelte';

const mockGetAllEntries = vi.mocked(getAllEntries);
const mockGetEntriesForMonth = vi.mocked(getEntriesForMonth);
const mockGetMonth = vi.mocked(getMonth);
const mockGetHabitsForMonth = vi.mocked(getHabitsForMonth);

const today = getToday();
const monthId = getMonthId(today);
const [year, monthNum] = monthId.split('-').map(Number);
const prevMonth =
	monthNum === 1 ? `${year - 1}-12` : `${year}-${String(monthNum - 1).padStart(2, '0')}`;

function entry(date: string, journalText = '', completions: Record<string, boolean> = {}): DailyEntry {
	return { date, monthId: date.substring(0, 7), journalText, completions };
}

beforeEach(() => {
	vi.clearAllMocks();
	mockGetAllEntries.mockResolvedValue([]);
	mockGetEntriesForMonth.mockResolvedValue([]);
	mockGetMonth.mockResolvedValue(undefined as never);
	mockGetHabitsForMonth.mockResolvedValue([]);
});

describe('DiaryPage empty states (FR-011/012)', () => {
	it('shows a welcome message when there is no diary at all', async () => {
		render(DiaryPage);

		await waitFor(() => {
			expect(
				screen.getByText('Aún no has escrito ninguna entrada de diario')
			).toBeTruthy();
		});
	});

	it('shows a per-month message when the selected month has no diary', async () => {
		mockGetAllEntries.mockResolvedValue([entry(`${prevMonth}-05`, 'texto del mes pasada')]);
		mockGetEntriesForMonth.mockResolvedValue([]);

		render(DiaryPage);

		await waitFor(() => {
			expect(screen.getByText('No hay entradas de diario para este mes')).toBeTruthy();
		});
	});
});

describe('DiaryPage slides rendering', () => {
	it('renders the diary entries of the current month as slides', async () => {
		const e = entry(today, 'Texto del día de hoy');
		mockGetAllEntries.mockResolvedValue([e]);
		mockGetEntriesForMonth.mockResolvedValue([e]);
		mockGetMonth.mockResolvedValue({ id: monthId, mantra: 'Mi mantra' } as never);

		render(DiaryPage);

		await waitFor(() => {
			expect(screen.getByText('Texto del día de hoy')).toBeTruthy();
		});
		expect(screen.getByText('Mi mantra')).toBeTruthy();
	});
});

describe('DiaryPage error handling (FR-017)', () => {
	it('shows an inline error with retry that recovers when reads succeed again', async () => {
		const e = entry(today, 'Texto del día de hoy');
		mockGetAllEntries.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([e]);
		mockGetEntriesForMonth.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([e]);
		mockGetMonth.mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ id: monthId } as never);

		render(DiaryPage);

		await waitFor(() => {
			expect(screen.getByText('No se pudo leer el diario. Inténtalo de nuevo.')).toBeTruthy();
		});

		const retry = screen.getByRole('button', { name: 'Reintentar' });
		await fireEvent.click(retry);

		await waitFor(() => {
			expect(screen.getByText('Texto del día de hoy')).toBeTruthy();
		});
	});
});