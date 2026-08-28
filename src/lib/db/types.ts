export interface Habit {
	id: string; // slug determinista derivado del nombre
	name: string; // nombre canónico (único tras trim, case-sensitive para UX)
}

export interface MonthMembership {
	habitId: string; // Habit.id
	order: number;
}

export interface Month {
	id: string; // 'YYYY-MM'
	year: number;
	month: number; // 1-12
	mantra: string;
	memberships: MonthMembership[];
	setupComplete: boolean;
}

export interface DailyEntry {
	date: string; // 'YYYY-MM-DD'
	monthId: string; // Month.id
	journalText: string;
	completions: Record<string, boolean>; // Habit.id → completed
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
		value: Habit;
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
