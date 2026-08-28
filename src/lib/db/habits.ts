import { getDB } from './index';
import type { Habit, Month, DailyEntry } from './types';
import { slugify } from '$lib/utils/slugify';

export interface MonthHabit extends Habit {
	order: number;
}

export async function getAllHabits(): Promise<Habit[]> {
	const db = await getDB();
	const all = await db.getAll('habits');
	return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getHabitById(id: string): Promise<Habit | undefined> {
	const db = await getDB();
	return db.get('habits', id);
}

export async function findHabitByName(name: string): Promise<Habit | undefined> {
	const trimmed = name.trim();
	if (!trimmed) return undefined;
	const all = await getAllHabits();
	return all.find((h) => h.name.trim() === trimmed);
}

export async function createHabit(name: string): Promise<Habit> {
	const db = await getDB();
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > 100) {
		throw new Error('El nombre del hábito debe tener entre 1 y 100 caracteres');
	}
	const id = slugify(trimmed);
	if (!id) {
		throw new Error('Nombre de hábito no válido');
	}
	const existing = await db.get('habits', id);
	if (existing) {
		throw new Error(`Ya existe un hábito llamado "${existing.name}"`);
	}
	const habit: Habit = { id, name: trimmed };
	await db.put('habits', habit);
	return habit;
}

export async function getOrCreateHabit(name: string): Promise<Habit> {
	const found = await findHabitByName(name);
	if (found) return found;
	return createHabit(name);
}

export async function getHabitReferenceCount(habitId: string): Promise<number> {
	const db = await getDB();
	const months = (await db.getAll('months')) as Month[];
	const monthCount = months.filter((m) => m.memberships.some((mem) => mem.habitId === habitId))
		.length;
	const entries = (await db.getAll('entries')) as DailyEntry[];
	const entryCount = entries.filter((e) => habitId in e.completions).length;
	return monthCount + entryCount;
}

export async function renameHabit(habitId: string, newName: string): Promise<Habit> {
	const refs = await getHabitReferenceCount(habitId);
	if (refs > 0) {
		throw new Error('No se puede renombrar un hábito que ya está en uso');
	}
	const db = await getDB();
	const existing = await db.get('habits', habitId);
	if (!existing) throw new Error('Hábito no encontrado');
	const trimmed = newName.trim();
	if (!trimmed || trimmed.length > 100) {
		throw new Error('El nombre del hábito debe tener entre 1 y 100 caracteres');
	}
	const newId = slugify(trimmed);
	if (!newId) throw new Error('Nombre de hábito no válido');
	const clash = await db.get('habits', newId);
	if (clash && clash.id !== habitId) {
		throw new Error(`Ya existe un hábito llamado "${clash.name}"`);
	}
	const renamed: Habit = { id: newId, name: trimmed };
	await db.delete('habits', habitId);
	await db.put('habits', renamed);
	return renamed;
}

export async function deleteHabit(habitId: string): Promise<void> {
	const refs = await getHabitReferenceCount(habitId);
	if (refs > 0) {
		throw new Error('No se puede eliminar un hábito que está en uso');
	}
	const db = await getDB();
	await db.delete('habits', habitId);
}

export async function getHabitsForMonth(monthId: string): Promise<MonthHabit[]> {
	const db = await getDB();
	const month = await db.get('months', monthId);
	if (!month) return [];
	const memberships = [...month.memberships].sort((a, b) => a.order - b.order);
	const habits: MonthHabit[] = [];
	for (const mem of memberships) {
		const habit = await db.get('habits', mem.habitId);
		if (habit) {
			habits.push({ id: habit.id, name: habit.name, order: mem.order });
		}
	}
	return habits;
}
