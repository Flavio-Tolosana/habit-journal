import { getDB } from './index';
import type { Month, MonthMembership } from './types';
import { getOrCreateHabit } from './habits';

export async function getMonth(id: string): Promise<Month | undefined> {
	const db = await getDB();
	return db.get('months', id);
}

export async function getLatestMonth(): Promise<Month | undefined> {
	const db = await getDB();
	const all = await db.getAll('months');
	if (all.length === 0) return undefined;
	return all.sort((a, b) => b.id.localeCompare(a.id))[0];
}

export async function getAllMonths(): Promise<Month[]> {
	const db = await getDB();
	const all = await db.getAll('months');
	return all.sort((a, b) => b.id.localeCompare(a.id));
}

export async function createMonth(input: {
	id: string;
	year: number;
	month: number;
	mantra?: string;
	members: Array<{ name: string; order: number }>;
}): Promise<Month> {
	const db = await getDB();
	const existing = await db.get('months', input.id);
	if (existing) {
		throw new Error(`Month ${input.id} already exists`);
	}
	const memberships: MonthMembership[] = [];
	for (const member of input.members) {
		const habit = await getOrCreateHabit(member.name);
		if (!memberships.some((m) => m.habitId === habit.id)) {
			memberships.push({ habitId: habit.id, order: member.order });
		}
	}
	const month: Month = {
		id: input.id,
		year: input.year,
		month: input.month,
		mantra: input.mantra ?? '',
		memberships,
		setupComplete: true
	};
	await db.add('months', month);
	return month;
}

export async function updateMantra(id: string, mantra: string): Promise<void> {
	const db = await getDB();
	const existing = await db.get('months', id);
	if (!existing) {
		throw new Error(`Month ${id} not found`);
	}
	await db.put('months', { ...existing, mantra });
}
