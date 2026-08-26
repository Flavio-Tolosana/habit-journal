import { getDB } from './index';
import type { DailyEntry } from './types';

export async function getEntry(date: string): Promise<DailyEntry | undefined> {
	const db = await getDB();
	return db.get('entries', date);
}

export async function getEntriesForMonth(monthId: string): Promise<DailyEntry[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('entries', 'by-month', monthId);
	return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function setHabitCompletion(
	date: string,
	habitId: string,
	completed: boolean
): Promise<void> {
	const db = await getDB();
	let entry = await db.get('entries', date);
	if (!entry) {
		const monthId = date.substring(0, 7);
		entry = { date, monthId, journalText: '', completions: {} };
	}
	entry.completions[habitId] = completed;
	await db.put('entries', entry);
}

export async function setJournalText(date: string, text: string): Promise<void> {
	const db = await getDB();
	let entry = await db.get('entries', date);
	if (!entry) {
		const monthId = date.substring(0, 7);
		entry = { date, monthId, journalText: '', completions: {} };
	}
	entry.journalText = text;
	await db.put('entries', entry);
}

export async function deleteEntry(date: string): Promise<void> {
	const db = await getDB();
	await db.delete('entries', date);
}

export async function deleteMonth(monthId: string): Promise<void> {
	const db = await getDB();
	await db.delete('months', monthId);

	const habits = await db.getAllFromIndex('habits', 'by-month', monthId);
	const habitTx = db.transaction('habits', 'readwrite');
	for (const habit of habits) {
		await habitTx.store.delete(habit.id);
	}
	await habitTx.done;

	const entries = await db.getAllFromIndex('entries', 'by-month', monthId);
	const entryTx = db.transaction('entries', 'readwrite');
	for (const entry of entries) {
		await entryTx.store.delete(entry.date);
	}
	await entryTx.done;
}
