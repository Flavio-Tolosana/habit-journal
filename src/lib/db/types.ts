export interface Month {
	id: string; // 'YYYY-MM'
	year: number;
	month: number; // 1-12
	mantra: string;
	habits: HabitDefinition[];
	setupComplete: boolean;
}

export interface HabitDefinition {
	id: string; // UUID v4
	monthId: string; // Month.id
	name: string;
	order: number;
}

export interface DailyEntry {
	date: string; // 'YYYY-MM-DD'
	monthId: string; // Month.id
	journalText: string;
	completions: Record<string, boolean>; // habitId → completed
}

export interface Meta {
	key: string;
	value: unknown;
}

export interface HabitJournalDB {
	months: {
		key: string;
		value: Month;
	};
	habits: {
		key: string;
		value: HabitDefinition;
		indexes: { 'by-month': string };
	};
	entries: {
		key: string;
		value: DailyEntry;
		indexes: { 'by-month': string };
	};
	meta: {
		key: string;
		value: Meta;
	};
}
