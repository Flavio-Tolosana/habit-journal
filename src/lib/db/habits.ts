import { getDB } from './index';
import type { HabitDefinition } from './types';

export async function getHabitsForMonth(monthId: string): Promise<HabitDefinition[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('habits', 'by-month', monthId);
	return all.sort((a, b) => a.order - b.order);
}

export async function createHabitsForMonth(
	monthId: string,
	habits: HabitDefinition[]
): Promise<void> {
	const db = await getDB();
	const month = await db.get('months', monthId);
	if (!month) {
		throw new Error(`Month ${monthId} not found`);
	}
	const tx = db.transaction('habits', 'readwrite');
	for (const habit of habits) {
		await tx.store.add(habit);
	}
	await tx.done;
}
