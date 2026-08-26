import { getDB } from './index';
import type { Month, HabitDefinition, DailyEntry } from './types';

export async function exportToCSV(): Promise<string> {
	const db = await getDB();
	const months = await db.getAll('months');
	const habits = await db.getAll('habits');
	const entries = await db.getAll('entries');

	const lines: string[] = [];
	lines.push('type,id,monthId,name,order,date,journalText,habitId,completed,value,key');

	for (const m of months) {
		lines.push(`month,${m.id},,${m.mantra},,,,,`);
	}
	for (const h of habits) {
		lines.push(`habit,${h.id},${h.monthId},${h.name},${h.order},,,,,`);
	}
	for (const e of entries) {
		const completionKeys = Object.keys(e.completions);
		if (completionKeys.length === 0) {
			lines.push(`entry,,${e.monthId},,,"${e.date}","${e.journalText.replace(/"/g, '""')}",,,`);
		} else {
			for (const habitId of completionKeys) {
				lines.push(
					`entry,,${e.monthId},,,"${e.date}","${e.journalText.replace(/"/g, '""')}",${habitId},${e.completions[habitId]},,`
				);
			}
		}
	}
	lines.push(`meta,,,,,,,,"1",version`);

	return lines.join('\n');
}

export async function importFromCSV(
	csv: string
): Promise<{ months: number; habits: number; entries: number }> {
	const db = await getDB();
	const lines = csv.split('\n').filter((l) => l.trim() !== '');
	if (lines.length < 2) throw new Error('CSV file is empty or invalid');

	let monthsCount = 0,
		habitsCount = 0,
		entriesCount = 0;

	const tx = db.transaction(['months', 'habits', 'entries'], 'readwrite');

	for (let i = 1; i < lines.length; i++) {
		const row = parseCSVRow(lines[i]);
		const type = row[0];

		if (type === 'month') {
			const [id] = row;
			const [yearStr, monthStr] = id.split('-');
			await tx.objectStore('months').put({
				id,
				year: parseInt(yearStr),
				month: parseInt(monthStr),
				mantra: row[1] || '',
				habits: [],
				setupComplete: true
			});
			monthsCount++;
		} else if (type === 'habit') {
			const [, id, monthId, name, order] = row;
			await tx.objectStore('habits').put({
				id,
				monthId,
				name,
				order: parseInt(order)
			});
			habitsCount++;
		} else if (type === 'entry') {
			const [, , monthId, , , date, journalText, habitId, completed] = row;
			if (!date) continue;

			let entry = await tx.objectStore('entries').get(date);
			if (!entry) {
				entry = { date, monthId, journalText: '', completions: {} };
			}
			if (journalText) entry.journalText = journalText;
			if (habitId) entry.completions[habitId] = completed === 'true';

			await tx.objectStore('entries').put(entry);
			entriesCount++;
		}
	}

	await tx.done;
	return { months: monthsCount, habits: habitsCount, entries: entriesCount };
}

function parseCSVRow(row: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		if (inQuotes) {
			if (char === '"' && row[i + 1] === '"') {
				current += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				current += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
	}
	result.push(current);
	return result;
}
