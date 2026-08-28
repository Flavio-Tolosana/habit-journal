import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Habit, Month, DailyEntry } from '../../../src/lib/db/types';

vi.mock('../../../src/lib/db/index', () => ({
	getDB: vi.fn()
}));

import { getDB } from '../../../src/lib/db/index';
import {
	getAllHabits,
	getHabitById,
	findHabitByName,
	createHabit,
	getOrCreateHabit,
	getHabitReferenceCount,
	renameHabit,
	deleteHabit,
	getHabitsForMonth
} from '../../../src/lib/db/habits';

const mockGetDB = vi.mocked(getDB);

function makeHabit(overrides: Partial<Habit> = {}): Habit {
	return {
		id: 'meditar',
		name: 'Meditar',
		...overrides
	};
}

function makeMonth(overrides: Partial<Month> = {}): Month {
	return {
		id: '2026-08',
		year: 2026,
		month: 8,
		mantra: 'En la cresta de la ola',
		memberships: [],
		setupComplete: true,
		...overrides
	};
}

function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
	return {
		date: '2026-08-15',
		monthId: '2026-08',
		journalText: '',
		completions: {},
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
		put: vi.fn(async (store: string, value: { id: string }) => {
			stores[store].set(value.id, value);
		}),
		add: vi.fn(async (store: string, value: { id: string }) => {
			if (stores[store].has(value.id)) throw new Error('ConstraintError');
			stores[store].set(value.id, value);
		}),
		delete: vi.fn(async (store: string, key: string) => {
			stores[store].delete(key);
		}),
		stores
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getAllHabits', () => {
	it('returns habits sorted by name', async () => {
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const leer = makeHabit({ id: 'leer', name: 'Leer' });
		const correr = makeHabit({ id: 'correr', name: 'Correr' });
		const db = mockDB({ habits: { meditar, leer, correr } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getAllHabits();

		expect(result.map((h) => h.name)).toEqual(['Correr', 'Leer', 'Meditar']);
	});

	it('returns an empty array when the collection is empty', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getAllHabits();

		expect(result).toEqual([]);
	});
});

describe('getHabitById', () => {
	it('returns the habit when it exists', async () => {
		const habit = makeHabit();
		const db = mockDB({ habits: { meditar: habit } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitById('meditar');

		expect(result).toEqual(habit);
	});

	it('returns undefined when it does not exist', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitById('inexistente');

		expect(result).toBeUndefined();
	});
});

describe('findHabitByName', () => {
	it('finds a habit by exact name after trimming', async () => {
		const habit = makeHabit({ id: 'leer', name: 'Leer' });
		const db = mockDB({ habits: { leer: habit } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await findHabitByName('  Leer  ');

		expect(result).toEqual(habit);
	});

	it('is case-sensitive', async () => {
		const habit = makeHabit({ id: 'leer', name: 'Leer' });
		const db = mockDB({ habits: { leer: habit } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await findHabitByName('leer');

		expect(result).toBeUndefined();
	});

	it('returns undefined for an empty/whitespace name', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await findHabitByName('   ');

		expect(result).toBeUndefined();
	});
});

describe('createHabit', () => {
	it('creates a habit deriving the slug from the name', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await createHabit('  Meditar  ');

		expect(result).toEqual({ id: 'meditar', name: 'Meditar' });
		expect(db.put).toHaveBeenCalledWith('habits', { id: 'meditar', name: 'Meditar' });
	});

	it('throws when the name is empty after trimming', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		await expect(createHabit('   ')).rejects.toThrow(
			'El nombre del hábito debe tener entre 1 y 100 caracteres'
		);
	});

	it('throws when the name is longer than 100 characters', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		await expect(createHabit('a'.repeat(101))).rejects.toThrow(
			'El nombre del hábito debe tener entre 1 y 100 caracteres'
		);
	});

	it('throws when the slug is empty', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		await expect(createHabit('!!!')).rejects.toThrow('Nombre de hábito no válido');
	});

	it('throws when a habit with the same slug already exists', async () => {
		const existing = makeHabit({ id: 'meditar', name: 'Meditar' });
		const db = mockDB({ habits: { meditar: existing } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(createHabit('meditar')).rejects.toThrow(
			'Ya existe un hábito llamado "Meditar"'
		);
	});
});

describe('getOrCreateHabit', () => {
	it('returns the existing habit when the name matches exactly', async () => {
		const existing = makeHabit({ id: 'leer', name: 'Leer' });
		const db = mockDB({ habits: { leer: existing } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getOrCreateHabit('Leer');

		expect(result).toBe(existing);
		expect(db.put).not.toHaveBeenCalled();
	});

	it('creates the habit when it does not exist', async () => {
		const db = mockDB({ habits: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getOrCreateHabit('Correr');

		expect(result).toEqual({ id: 'correr', name: 'Correr' });
	});
});

describe('getHabitReferenceCount', () => {
	it('counts months that include the habit in memberships plus entries that reference it', async () => {
		const month1 = makeMonth({
			id: '2026-07',
			year: 2026,
			month: 7,
			memberships: [{ habitId: 'leer', order: 0 }]
		});
		const month2 = makeMonth({
			id: '2026-08',
			year: 2026,
			month: 8,
			memberships: [{ habitId: 'leer', order: 0 }, { habitId: 'meditar', order: 1 }]
		});
		const entry1 = makeEntry({ date: '2026-08-01', completions: { leer: true } });
		const entry2 = makeEntry({
			date: '2026-08-02',
			completions: { leer: true, meditar: false }
		});
		const db = mockDB({
			months: { '2026-07': month1, '2026-08': month2 },
			entries: { '2026-08-01': entry1, '2026-08-02': entry2 }
		});
		mockGetDB.mockResolvedValue(db as never);

		const leerRefs = await getHabitReferenceCount('leer');
		const meditarRefs = await getHabitReferenceCount('meditar');

		expect(leerRefs).toBe(4);
		expect(meditarRefs).toBe(2);
	});

	it('returns 0 when the habit is not referenced', async () => {
		const db = mockDB({});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitReferenceCount('solitario');

		expect(result).toBe(0);
	});
});

describe('renameHabit', () => {
	it('renames an unreferenced habit creating a new identity', async () => {
		const habit = makeHabit({ id: 'tipo', name: 'Tipo' });
		const db = mockDB({ habits: { tipo: habit } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await renameHabit('tipo', 'Corregido');

		expect(result).toEqual({ id: 'corregido', name: 'Corregido' });
		expect(db.delete).toHaveBeenCalledWith('habits', 'tipo');
		expect(db.put).toHaveBeenCalledWith('habits', { id: 'corregido', name: 'Corregido' });
	});

	it('throws when the habit is referenced', async () => {
		const habit = makeHabit({ id: 'leer', name: 'Leer' });
		const month = makeMonth({ memberships: [{ habitId: 'leer', order: 0 }] });
		const db = mockDB({ habits: { leer: habit }, months: { '2026-08': month } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(renameHabit('leer', 'Lectura')).rejects.toThrow(
			'No se puede renombrar un hábito que ya está en uso'
		);
	});

	it('throws when the new name collides with an existing slug', async () => {
		const original = makeHabit({ id: 'correr', name: 'Correr' });
		const clash = makeHabit({ id: 'leer', name: 'Leer' });
		const db = mockDB({ habits: { correr: original, leer: clash } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(renameHabit('correr', 'Leer')).rejects.toThrow(
			'Ya existe un hábito llamado "Leer"'
		);
	});
});

describe('deleteHabit', () => {
	it('deletes an unreferenced habit', async () => {
		const habit = makeHabit({ id: 'solitario', name: 'Solitario' });
		const db = mockDB({ habits: { solitario: habit } });
		mockGetDB.mockResolvedValue(db as never);

		await deleteHabit('solitario');

		expect(db.delete).toHaveBeenCalledWith('habits', 'solitario');
	});

	it('throws when the habit is referenced', async () => {
		const habit = makeHabit({ id: 'leer', name: 'Leer' });
		const entry = makeEntry({ completions: { leer: true } });
		const db = mockDB({ habits: { leer: habit }, entries: { '2026-08-15': entry } });
		mockGetDB.mockResolvedValue(db as never);

		await expect(deleteHabit('leer')).rejects.toThrow(
			'No se puede eliminar un hábito que está en uso'
		);
	});
});

describe('getHabitsForMonth', () => {
	it('resolves memberships to habits ordered by order', async () => {
		const month = makeMonth({
			memberships: [
				{ habitId: 'meditar', order: 1 },
				{ habitId: 'leer', order: 0 }
			]
		});
		const leer = makeHabit({ id: 'leer', name: 'Leer' });
		const meditar = makeHabit({ id: 'meditar', name: 'Meditar' });
		const db = mockDB({
			months: { '2026-08': month },
			habits: { leer, meditar }
		});
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-08');

		expect(result).toEqual([
			{ id: 'leer', name: 'Leer', order: 0 },
			{ id: 'meditar', name: 'Meditar', order: 1 }
		]);
	});

	it('returns an empty array when the month does not exist', async () => {
		const db = mockDB({ months: {} });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-99');

		expect(result).toEqual([]);
	});

	it('skips memberships whose habit is no longer in the collection', async () => {
		const month = makeMonth({
			memberships: [
				{ habitId: 'leer', order: 0 },
				{ habitId: 'desaparecido', order: 1 }
			]
		});
		const leer = makeHabit({ id: 'leer', name: 'Leer' });
		const db = mockDB({ months: { '2026-08': month }, habits: { leer } });
		mockGetDB.mockResolvedValue(db as never);

		const result = await getHabitsForMonth('2026-08');

		expect(result).toEqual([{ id: 'leer', name: 'Leer', order: 0 }]);
	});
});