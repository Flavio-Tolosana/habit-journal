import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Month, Habit, DailyEntry } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import {
	getMonth,
	getLatestMonth,
	getAllMonths,
	createMonth,
	updateMantra
} from '../../../src/lib/db/months';

const mockGetDB = vi.mocked(getDB);

function makeMonth(overrides: Partial<Month> = {}): Month {
	return {
		id: '2026-08',
		year: 2026,
		month: 8,
		mantra: 'Stay consistent',
		memberships: [],
		setupComplete: true,
		...overrides
	};
}

function mockDB(initial?: {
	months?: Record<string, Month>;
	habits?: Record<string, Habit>;
	entries?: Record<string, DailyEntry>;
}) {
	const stores: Record<string, Map<string, unknown>> = {
		months: new Map(Object.entries(initial?.months ?? {})),
		habits: new Map(Object.entries(initial?.habits ?? {})),
		entries: new Map(Object.entries(initial?.entries ?? {}))
	};

	return {
		get: vi.fn(async (store: string, key: string) => stores[store]?.get(key)),
		getAll: vi.fn(async (store: string) => Array.from(stores[store]?.values() ?? [])),
		add: vi.fn(async (store: string, value: { id: string }) => {
			if (stores[store].has(value.id)) throw new Error('ConstraintError');
			stores[store].set(value.id, value);
		}),
		put: vi.fn(async (store: string, value: { id: string }) => {
			stores[store].set(value.id, value);
		}),
		stores
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getMonth', () => {
	it('returns the month when it exists', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getMonth('2026-08');

		expect(result).toEqual(month);
		expect(db.get).toHaveBeenCalledWith('months', '2026-08');
	});

	it('returns undefined when month does not exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getMonth('2026-99');

		expect(result).toBeUndefined();
	});
});

describe('getLatestMonth', () => {
	it('returns the most recent month by id', async () => {
		const jan = makeMonth({ id: '2026-01', month: 1 });
		const aug = makeMonth({ id: '2026-08', month: 8 });
		const db = mockDB({ months: { '2026-01': jan, '2026-08': aug } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getLatestMonth();

		expect(result?.id).toBe('2026-08');
	});

	it('returns undefined when no months exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getLatestMonth();

		expect(result).toBeUndefined();
	});

	it('returns the single month when only one exists', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getLatestMonth();

		expect(result?.id).toBe('2026-08');
	});
});

describe('getAllMonths', () => {
	it('returns months sorted descending by id', async () => {
		const jan = makeMonth({ id: '2026-01', month: 1 });
		const aug = makeMonth({ id: '2026-08', month: 8 });
		const dec = makeMonth({ id: '2026-12', month: 12 });
		const db = mockDB({
			months: { '2026-01': jan, '2026-08': aug, '2026-12': dec }
		});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getAllMonths();

		expect(result.map((m) => m.id)).toEqual(['2026-12', '2026-08', '2026-01']);
	});

	it('returns an empty array when no months exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getAllMonths();

		expect(result).toEqual([]);
	});
});

describe('createMonth', () => {
	it('adds a month resolving member names to global habits via memberships', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		await createMonth({
			id: '2026-08',
			year: 2026,
			month: 8,
			mantra: 'Mes de leer',
			members: [
				{ name: 'Leer', order: 0 },
				{ name: 'Meditar', order: 1 }
			]
		});

		expect(db.add).toHaveBeenCalledWith('months', {
			id: '2026-08',
			year: 2026,
			month: 8,
			mantra: 'Mes de leer',
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'meditar', order: 1 }
			],
			setupComplete: true
		});
	});

	it('reuses the same collection identity across months', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		await createMonth({
			id: '2026-07',
			year: 2026,
			month: 7,
			members: [{ name: 'Leer', order: 0 }]
		});
		await createMonth({
			id: '2026-08',
			year: 2026,
			month: 8,
			members: [{ name: 'Leer', order: 0 }]
		});

		expect(db.stores.habits.size).toBe(1);
		expect(db.stores.habits.get('leer')).toEqual({ id: 'leer', name: 'Leer' });
	});

	it('deduplicates members that resolve to the same habit', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		await createMonth({
			id: '2026-08',
			year: 2026,
			month: 8,
			members: [
				{ name: 'Leer', order: 0 },
				{ name: ' Leer ', order: 1 }
			]
		});

		expect(db.stores.months.get('2026-08')).toEqual({
			id: '2026-08',
			year: 2026,
			month: 8,
			mantra: '',
			memberships: [{ habitId: 'leer', order: 0 }],
			setupComplete: true
		});
	});

	it('throws when the month already exists', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(
			createMonth({
				id: '2026-08',
				year: 2026,
				month: 8,
				members: [{ name: 'Leer', order: 0 }]
			})
		).rejects.toThrow('Month 2026-08 already exists');
	});
});

describe('updateMantra', () => {
	it('updates the mantra on an existing month', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		await updateMantra('2026-08', 'New mantra');

		expect(db.put).toHaveBeenCalledWith('months', {
			...month,
			mantra: 'New mantra'
		});
	});

	it('throws when the month does not exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		await expect(updateMantra('2026-99', 'test')).rejects.toThrow('Month 2026-99 not found');
	});
});