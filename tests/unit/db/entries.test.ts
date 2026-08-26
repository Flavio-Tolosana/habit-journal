import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DailyEntry, HabitDefinition, Month } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import {
	getEntry,
	getEntriesForMonth,
	setHabitCompletion,
	setJournalText,
	deleteEntry,
	deleteMonth
} from '../../../src/lib/db/entries';

const mockGetDB = vi.mocked(getDB);

function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
	return {
		date: '2026-08-15',
		monthId: '2026-08',
		journalText: '',
		completions: {},
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

function makeHabit(overrides: Partial<HabitDefinition> = {}): HabitDefinition {
	return {
		id: 'habit-1',
		monthId: '2026-08',
		name: 'Exercise',
		order: 0,
		...overrides
	};
}

function mockDB(storeData: Record<string, Record<string, unknown>> = {}) {
	const stores: Record<string, Record<string, unknown>> = {
		months: storeData.months ?? {},
		habits: storeData.habits ?? {},
		entries: storeData.entries ?? {}
	};

	function rebuildEntryIndex() {
		const index: Record<string, Record<string, unknown>> = {};
		for (const entry of Object.values(stores.entries) as DailyEntry[]) {
			const monthId = entry.monthId;
			if (!index[monthId]) index[monthId] = {};
			index[monthId][entry.date] = entry;
		}
		return index;
	}

	function rebuildHabitIndex() {
		const index: Record<string, Record<string, unknown>> = {};
		for (const habit of Object.values(stores.habits) as HabitDefinition[]) {
			const monthId = habit.monthId;
			if (!index[monthId]) index[monthId] = {};
			index[monthId][habit.id] = habit;
		}
		return index;
	}

	return {
		get: vi.fn(async (store: string, key: string) => stores[store]?.[key]),
		put: vi.fn(async (store: string, value: unknown) => {
			const key = (value as { date: string }).date ?? (value as { id: string }).id;
			stores[store][key] = value;
		}),
		delete: vi.fn(async (store: string, key: string) => {
			delete stores[store][key];
		}),
		getAllFromIndex: vi.fn(
			async (store: string, indexName: string, key: string) => {
				if (store === 'entries' && indexName === 'by-month') {
					return Object.values(rebuildEntryIndex()[key] ?? {});
				}
				if (store === 'habits' && indexName === 'by-month') {
					return Object.values(rebuildHabitIndex()[key] ?? {});
				}
				return [];
			}
		),
		transaction: vi.fn((storeName: string, _mode: string) => {
			return {
				store: {
					delete: vi.fn(async (key: string) => {
						delete stores[storeName][key];
					})
				},
				done: Promise.resolve()
			};
		}),
		stores
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getEntry', () => {
	it('returns the entry when it exists', async () => {
		const entry = makeEntry();
		const db = mockDB({ entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getEntry('2026-08-15');

		expect(result).toEqual(entry);
		expect(db.get).toHaveBeenCalledWith('entries', '2026-08-15');
	});

	it('returns undefined when entry does not exist', async () => {
		const db = mockDB({ entries: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getEntry('2026-88-88');

		expect(result).toBeUndefined();
	});
});

describe('getEntriesForMonth', () => {
	it('returns entries sorted by date ascending', async () => {
		const e20 = makeEntry({ date: '2026-08-20' });
		const e05 = makeEntry({ date: '2026-08-05' });
		const e15 = makeEntry({ date: '2026-08-15' });
		const db = mockDB({
			entries: { '2026-08-20': e20, '2026-08-05': e05, '2026-08-15': e15 }
		});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getEntriesForMonth('2026-08');

		expect(result.map((e) => e.date)).toEqual(['2026-08-05', '2026-08-15', '2026-08-20']);
		expect(db.getAllFromIndex).toHaveBeenCalledWith('entries', 'by-month', '2026-08');
	});

	it('returns an empty array when no entries exist', async () => {
		const db = mockDB({ entries: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getEntriesForMonth('2026-99');

		expect(result).toEqual([]);
	});
});

describe('setHabitCompletion', () => {
	it('creates a new entry if one does not exist for the date', async () => {
		const db = mockDB({ entries: {} });
		mockGetDB.mockResolvedValue(db as never);

		await setHabitCompletion('2026-08-15', 'habit-1', true);

		expect(db.put).toHaveBeenCalledWith('entries', {
			date: '2026-08-15',
			monthId: '2026-08',
			journalText: '',
			completions: { 'habit-1': true }
		});
	});

	it('updates an existing entry with the completion', async () => {
		const entry = makeEntry({ completions: { 'habit-1': false } });
		const db = mockDB({ entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		await setHabitCompletion('2026-08-15', 'habit-1', true);

		expect(db.put).toHaveBeenCalledWith('entries', {
			...entry,
			completions: { 'habit-1': true }
		});
	});

	it('adds a new habit completion to an entry that has others', async () => {
		const entry = makeEntry({ completions: { 'habit-1': true } });
		const db = mockDB({ entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		await setHabitCompletion('2026-08-15', 'habit-2', false);

		expect(db.put).toHaveBeenCalledWith('entries', {
			...entry,
			completions: { 'habit-1': true, 'habit-2': false }
		});
	});
});

describe('setJournalText', () => {
	it('creates a new entry if one does not exist', async () => {
		const db = mockDB({ entries: {} });
		mockGetDB.mockResolvedValue(db as never);

		await setJournalText('2026-08-15', 'Today was great');

		expect(db.put).toHaveBeenCalledWith('entries', {
			date: '2026-08-15',
			monthId: '2026-08',
			journalText: 'Today was great',
			completions: {}
		});
	});

	it('updates journal text on an existing entry', async () => {
		const entry = makeEntry({ journalText: 'Old text' });
		const db = mockDB({ entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		await setJournalText('2026-08-15', 'New text');

		expect(db.put).toHaveBeenCalledWith('entries', {
			...entry,
			journalText: 'New text'
		});
	});

	it('sets empty text', async () => {
		const entry = makeEntry({ journalText: 'Something' });
		const db = mockDB({ entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		await setJournalText('2026-08-15', '');

		expect(db.put).toHaveBeenCalledWith('entries', {
			...entry,
			journalText: ''
		});
	});
});

describe('deleteEntry', () => {
	it('deletes the entry from the store', async () => {
		const db = mockDB({ entries: { '2026-08-15': makeEntry() } });
		mockGetDB.mockResolvedValue(db as never);

		await deleteEntry('2026-08-15');

		expect(db.delete).toHaveBeenCalledWith('entries', '2026-08-15');
	});

	it('does not throw when deleting a non-existent entry', async () => {
		const db = mockDB({ entries: {} });
		mockGetDB.mockResolvedValue(db as never);

		await expect(deleteEntry('2026-99-99')).resolves.toBeUndefined();
	});
});

describe('deleteMonth', () => {
	it('deletes the month, all its habits, and all its entries', async () => {
		const month = makeMonth();
		const habit1 = makeHabit({ id: 'h1' });
		const habit2 = makeHabit({ id: 'h2', name: 'Read', order: 1 });
		const entry1 = makeEntry({ date: '2026-08-01' });
		const entry2 = makeEntry({ date: '2026-08-15' });

		const db = mockDB({
			months: { '2026-08': month },
			habits: { h1: habit1, h2: habit2 },
			entries: { '2026-08-01': entry1, '2026-08-15': entry2 }
		});
		mockGetDB.mockResolvedValue(db as never);

		await deleteMonth('2026-08');

		expect(db.delete).toHaveBeenCalledWith('months', '2026-08');
		expect(db.transaction).toHaveBeenCalledWith('habits', 'readwrite');
		expect(db.transaction).toHaveBeenCalledWith('entries', 'readwrite');
	});

	it('deletes the month even when it has no habits or entries', async () => {
		const month = makeMonth();
		const db = mockDB({
			months: { '2026-08': month },
			habits: {},
			entries: {}
		});
		mockGetDB.mockResolvedValue(db as never);

		await deleteMonth('2026-08');

		expect(db.delete).toHaveBeenCalledWith('months', '2026-08');
	});
});
