import { openDB, type IDBPDatabase } from 'idb';
import type { HabitJournalDB } from './types';

const DB_NAME = 'habit-journal';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HabitJournalDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HabitJournalDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<HabitJournalDB>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			const monthStore = db.createObjectStore('months', { keyPath: 'id' });

			const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
			habitStore.createIndex('by-month', 'monthId');

			const entryStore = db.createObjectStore('entries', { keyPath: 'date' });
			entryStore.createIndex('by-month', 'monthId');

			db.createObjectStore('meta', { keyPath: 'key' });
		}
	});

	return dbInstance;
}
