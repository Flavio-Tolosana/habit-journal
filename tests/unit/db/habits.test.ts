import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HabitDefinition, Month } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import { getHabitsForMonth, createHabitsForMonth } from '../../../src/lib/db/habits';

const mockGetDB = vi.mocked(getDB);

function makeHabit(overrides: Partial<HabitDefinition> = {}): HabitDefinition {
	return {
		id: 'habit-1',
		monthId: '2026-08',
		name: 'Exercise',
		order: 0,
		...overrides
	};
}

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

	const indexes: Record<string, Record<string, Record<string, unknown>>> = {
		'habits:by-month': {},
		'entries:by-month': {}
	};

	for (const habit of Object.values(stores.habits) as HabitDefinition[]) {
		const monthId = habit.monthId;
		if (!indexes['habits:by-month'][monthId]) {
			indexes['habits:by-month'][monthId] = {};
		}
		indexes['habits:by-month'][monthId][habit.id] = habit;
	}

	const addedHabits: HabitDefinition[] = [];

	return {
		get: vi.fn(async (store: string, key: string) => stores[store]?.[key]),
		getAllFromIndex: vi.fn(async (store: string, indexName: string, key: string) => {
			const indexKey = `${store}:${indexName}`;
			return Object.values(indexes[indexKey]?.[key] ?? {});
		}),
		transaction: vi.fn((storeName: string, _mode: string) => {
			return {
				store: {
					add: vi.fn(async (value: unknown) => {
						addedHabits.push(value as HabitDefinition);
					})
				},
				done: Promise.resolve()
			};
		}),
		addedHabits
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getHabitsForMonth', () => {
	it('returns habits sorted by order', async () => {
		const h2 = makeHabit({ id: 'habit-2', name: 'Meditate', order: 2 });
		const h0 = makeHabit({ id: 'habit-0', name: 'Exercise', order: 0 });
		const h1 = makeHabit({ id: 'habit-1', name: 'Read', order: 1 });
		const db = mockDB({
			habits: { 'habit-0': h0, 'habit-1': h1, 'habit-2': h2 }
		});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-08');

		expect(result.map((h) => h.id)).toEqual(['habit-0', 'habit-1', 'habit-2']);
		expect(db.getAllFromIndex).toHaveBeenCalledWith('habits', 'by-month', '2026-08');
	});

	it('returns an empty array when no habits exist for the month', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-99');

		expect(result).toEqual([]);
	});

	it('returns only habits for the specified month', async () => {
		const hAug = makeHabit({ id: 'habit-a', monthId: '2026-08', order: 0 });
		const hSep = makeHabit({ id: 'habit-b', monthId: '2026-09', order: 0 });
		const db = mockDB({
			habits: { 'habit-a': hAug, 'habit-b': hSep }
		});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-08');

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('habit-a');
	});
});

describe('createHabitsForMonth', () => {
	it('creates habits inside a transaction', async () => {
		const month = makeMonth();
		const habits = [
			makeHabit({ id: 'habit-1', order: 0 }),
			makeHabit({ id: 'habit-2', name: 'Read', order: 1 })
		];
		const db = mockDB({ months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		await createHabitsForMonth('2026-08', habits);

		expect(db.transaction).toHaveBeenCalledWith('habits', 'readwrite');
		expect(db.addedHabits).toHaveLength(2);
	});

	it('throws when the month does not exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		const habits = [makeHabit()];

		await expect(createHabitsForMonth('2026-99', habits)).rejects.toThrow(
			'Month 2026-99 not found'
		);
	});
});
