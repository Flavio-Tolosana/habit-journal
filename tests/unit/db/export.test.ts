import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Month, Habit, DailyEntry } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import { exportToCSV, importFromCSV } from '../../../src/lib/db/export';

const mockGetDB = vi.mocked(getDB);

const CSV_VERSION = 2;

function makeHabit(overrides: Partial<Habit> = {}): Habit {
	return {
		id: 'leer',
		name: 'Leer',
		...overrides
	};
}

function makeMonth(overrides: Partial<Month> = {}): Month {
	return {
		id: '2026-08',
		year: 2026,
		month: 8,
		mantra: 'Mes de lectura',
		memberships: [{ habitId: 'leer', order: 0 }],
		setupComplete: true,
		...overrides
	};
}

function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
	return {
		date: '2026-08-27',
		monthId: '2026-08',
		journalText: '',
		completions: { leer: true },
		...overrides
	};
}

function makeDB(initial?: {
	months?: Record<string, Month>;
	habits?: Record<string, Habit>;
	entries?: Record<string, DailyEntry>;
}) {
	const stores: Record<string, Map<string, unknown>> = {
		months: new Map(Object.entries(initial?.months ?? {})),
		habits: new Map(Object.entries(initial?.habits ?? {})),
		entries: new Map(Object.entries(initial?.entries ?? {}))
	};

	const tx = {
		objectStore: vi.fn((name: string) => ({
			put: async (value: unknown) => {
				const record = value as { id?: string; date?: string };
				const key = record.id ?? record.date;
				stores[name].set(key as string, value);
			},
			get: async (key: string) => stores[name].get(key)
		})),
		done: Promise.resolve()
	};

	return {
		getAll: vi.fn(async (store: string) => Array.from(stores[store].values())),
		transaction: vi.fn(() => tx),
		stores
	};
}

function parseCSV(csv: string): string[][] {
	const lines = csv.split('\n').filter((l) => l.trim() !== '');
	return lines.map((line) => {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (ch === ',' && !inQuotes) {
				result.push(current);
				current = '';
			} else {
				current += ch;
			}
		}
		result.push(current);
		return result;
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('exportToCSV', () => {
	it('exports the collection, months, memberships, and per-habit entries', async () => {
		const leer = makeHabit();
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const correr = makeHabit({ id: 'correr', name: 'Correr' });
		const month = makeMonth({
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'meditar', order: 1 },
				{ habitId: 'correr', order: 2 }
			]
		});
		const entry = makeEntry({
			completions: { leer: true, meditar: true, correr: false },
			journalText: 'Día tranquilo'
		});
		const db = makeDB({
			months: { '2026-08': month },
			habits: { leer, meditar, correr },
			entries: { '2026-08-27': entry }
		});
		mockGetDB.mockResolvedValue(db as never);

		const csv = await exportToCSV();
		const rows = parseCSV(csv);

		expect(rows[0]).toEqual([
			'type', 'id', 'name', 'monthId', 'mantra', 'date',
			'journalText', 'order', 'completed', 'value', 'key'
		]);

		const types = rows.slice(1).map((r) => r[0]);
		expect(types.filter((t) => t === 'habit').length).toBe(3);
		expect(types.filter((t) => t === 'month').length).toBe(1);
		expect(types.filter((t) => t === 'member').length).toBe(3);
		expect(types.filter((t) => t === 'entry').length).toBe(3);
		expect(types.filter((t) => t === 'meta').length).toBe(1);

		const habitRows = rows.filter((r) => r[0] === 'habit');
		expect(habitRows.map((r) => r[1])).toEqual(expect.arrayContaining(['leer', 'meditar', 'correr']));

		const memberRows = rows.filter((r) => r[0] === 'member' && r[3] === '2026-08');
		expect(memberRows.map((r) => r[7])).toEqual(['0', '1', '2']);
	});

	it('writes journalText only on the first row of each day (FR-010)', async () => {
		const leer = makeHabit();
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const correr = makeHabit({ id: 'correr', name: 'Correr' });
		const month = makeMonth({
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'meditar', order: 1 },
				{ habitId: 'correr', order: 2 }
			]
		});
		const entry = makeEntry({
			completions: { leer: true, meditar: true, correr: true },
			journalText: 'Texto del día'
		});
		const db = makeDB({
			months: { '2026-08': month },
			habits: { leer, meditar, correr },
			entries: { '2026-08-27': entry }
		});
		mockGetDB.mockResolvedValue(db as never);

		const csv = await exportToCSV();
		const rows = parseCSV(csv);

		const entryRows = rows.filter((r) => r[0] === 'entry' && r[5] === '2026-08-27');
		expect(entryRows).toHaveLength(3);
		expect(entryRows[0][6]).toBe('Texto del día');
		expect(entryRows[1][6]).toBe('');
		expect(entryRows[2][6]).toBe('');

		const countJournal = rows.reduce((n, r) => n + (r[6] === 'Texto del día' ? 1 : 0), 0);
		expect(countJournal).toBe(1);
	});

	it('marks completion with 1/0 and escapes quotes and commas in text', async () => {
		const leer = makeHabit();
		const entry = makeEntry({
			completions: { leer: false },
			journalText: 'Hoy "terminé", todo'
		});
		const db = makeDB({
			months: { '2026-08': makeMonth() },
			habits: { leer },
			entries: { '2026-08-27': entry }
		});
		mockGetDB.mockResolvedValue(db as never);

		const csv = await exportToCSV();
		const rows = parseCSV(csv);

		const entryRow = rows.find((r) => r[0] === 'entry');
		expect(entryRow?.[8]).toBe('0');
		expect(entryRow?.[6]).toBe('Hoy "terminé", todo');
		expect(csv).toContain('"Hoy ""terminé"", todo"');
	});

	it('writes the meta row with the format version', async () => {
		const db = makeDB({});
		mockGetDB.mockResolvedValue(db as never);

		const csv = await exportToCSV();
		const rows = parseCSV(csv);

		expect(rows[rows.length - 1]).toEqual([
			'meta', '', '', '', '', '', '', '', '', String(CSV_VERSION), 'format'
		]);
	});
});

describe('importFromCSV', () => {
	it('restores months, collection, memberships, completions and journalText (SC-005)', async () => {
		const leer = makeHabit();
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const month = makeMonth({
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'meditar', order: 1 }
			]
		});
		const entry = makeEntry({
			date: '2026-08-27',
			completions: { leer: true, meditar: false },
			journalText: 'Día redondo'
		});
		const sourceDb = makeDB({
			months: { '2026-08': month },
			habits: { leer, meditar },
			entries: { '2026-08-27': entry }
		});
		mockGetDB.mockResolvedValueOnce(sourceDb as never);

		const csv = await exportToCSV();

		const targetDb = makeDB({});
		mockGetDB.mockResolvedValueOnce(targetDb as never);

		const result = await importFromCSV(csv);

		expect(result).toEqual({ months: 1, habits: 2, entries: 2 });
		expect(targetDb.stores.habits.get('leer')).toEqual(leer);
		expect(targetDb.stores.habits.get('meditar')).toEqual(meditar);
		expect(targetDb.stores.months.get('2026-08')).toEqual(month);
		expect(targetDb.stores.entries.get('2026-08-27')).toEqual(entry);
	});

	it('restores an entry row whose journalText comes on the first row only', async () => {
		const leer = makeHabit();
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const month = makeMonth({
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'meditar', order: 1 }
			]
		});
		const entry = makeEntry({
			completions: { leer: true, meditar: true },
			journalText: 'Solo una vez'
		});
		const sourceDb = makeDB({
			months: { '2026-08': month },
			habits: { leer, meditar },
			entries: { '2026-08-27': entry }
		});
		mockGetDB.mockResolvedValueOnce(sourceDb as never);
		const csv = await exportToCSV();

		const targetDb = makeDB({});
		mockGetDB.mockResolvedValueOnce(targetDb as never);
		await importFromCSV(csv);

		const restored = targetDb.stores.entries.get('2026-08-27') as DailyEntry;
		expect(restored.journalText).toBe('Solo una vez');
		expect(restored.completions).toEqual({ leer: true, meditar: true });
	});

	it('throws "formato no soportado" when the meta row with key=format is missing', async () => {
		const db = makeDB({});
		mockGetDB.mockResolvedValue(db as never);

		const oldFormatCsv = [
			'type,id,name,monthId,order,completed,date,journalText',
			'habit,hab-1,Leer,2026-08,0,,,',
			'entry,hab-1,Leer,2026-08,,1,2026-08-27,"Texto"'
		].join('\n');

		await expect(importFromCSV(oldFormatCsv)).rejects.toThrow('Formato no soportado');
	});

	it('throws when the file has no data rows', async () => {
		const db = makeDB({});
		mockGetDB.mockResolvedValue(db as never);

		const csv = `type,id,name,monthId,mantra,date,journalText,order,completed,value,key`;

		await expect(importFromCSV(csv)).rejects.toThrow('CSV file is empty or invalid');
	});
});