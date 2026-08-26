import { getDB } from './index';
import type { Month } from './types';

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

export async function createMonth(input: Month): Promise<void> {
	const db = await getDB();
	const existing = await db.get('months', input.id);
	if (existing) {
		throw new Error(`Month ${input.id} already exists`);
	}
	await db.add('months', input);
}

export async function updateMantra(id: string, mantra: string): Promise<void> {
	const db = await getDB();
	const existing = await db.get('months', id);
	if (!existing) {
		throw new Error(`Month ${id} not found`);
	}
	await db.put('months', { ...existing, mantra });
}
