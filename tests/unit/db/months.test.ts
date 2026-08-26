import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Month } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import { getMonth, getLatestMonth, getAllMonths, createMonth, updateMantra } from '../../../src/lib/db/months';

const mockGetDB = vi.mocked(getDB);

function makeMonth(overrides: Partial<Month> = {}): Month {
	return {
		id: '2026-08',
		year: 2026,
		month: 8,
		mantra: 'Stay consistent',
		habits: [],
		setupComplete: true,
		...overrides
	};
}

function mockDB(storeData: Record<string, Record<string, unknown>> = {}) {
	const stores: Record<string, Record<string, unknown>> = {
		months: storeData.months ?? {},
		habits: storeData.habits ?? {},
		entries: storeData.entries ?? {}
	};

	return {
		get: vi.fn(async (store: string, key: string) => stores[store]?.[key]),
		getAll: vi.fn(async (store: string) => Object.values(stores[store] ?? {})),
		add: vi.fn(async (store: string, value: unknown) => {
			const key = (value as { id: string }).id;
			if (stores[store][key]) throw new Error('ConstraintError');
			stores[store][key] = value;
		}),
		put: vi.fn(async (store: string, value: unknown) => {
			const key = (value as { id: string }).id;
			stores[store][key] = value;
		})
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getMonth', () => {
	it('returns the month when it exists', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockDB;
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
	it('adds a new month to the store', async () => {
		const month = makeMonth();
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		await createMonth(month);

		expect(db.add).toHaveBeenCalledWith('months', month);
	});

	it('throws when the month already exists', async () => {
		const month = makeMonth();
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(createMonth(month)).rejects.toThrow('Month 2026-08 already exists');
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
