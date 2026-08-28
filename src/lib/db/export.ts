import { getDB } from './index';
import type { Month, Habit, DailyEntry } from './types';

const CSV_VERSION = 2;

export async function exportToCSV(): Promise<string> {
	const db = await getDB();
	const months = await db.getAll('months');
	const habits = await db.getAll('habits');
	const entries = await db.getAll('entries');

	const lines: string[] = [];
	lines.push('type,id,name,monthId,mantra,date,journalText,order,completed,value,key');

	for (const h of habits) {
		lines.push(`habit,${csvCell(h.id)},${csvCell(h.name)},,,,,,,`);
	}

	for (const m of months) {
		lines.push(`month,,,${csvCell(m.id)},${csvCell(m.mantra)},,,,,`);
		for (const mem of m.memberships) {
			const habit = habits.find((h) => h.id === mem.habitId);
			lines.push(
				`member,${csvCell(mem.habitId)},${csvCell(habit?.name ?? '')},${csvCell(m.id)},,,,${mem.order},,,`
			);
		}
	}

	const sortedEntries = entries.sort((a, b) => a.date.localeCompare(b.date));

	for (const e of sortedEntries) {
		const habitIds = Object.keys(e.completions);
		if (habitIds.length === 0) {
			lines.push(`entry,,,${csvCell(e.monthId)},,${csvCell(e.date)},${csvCell(e.journalText)},,,,`);
			continue;
		}
		habitIds.forEach((habitId, idx) => {
			const habit = habits.find((h) => h.id === habitId);
			const journal = idx === 0 ? csvCell(e.journalText) : '';
			lines.push(
				`entry,${csvCell(habitId)},${csvCell(habit?.name ?? '')},${csvCell(e.monthId)},,${csvCell(
					e.date
				)},${journal},,${e.completions[habitId] ? 1 : 0},,`
			);
		});
	}

	lines.push(`meta,,,,,,,,,${CSV_VERSION},format`);

	return lines.join('\n');
}

export async function importFromCSV(
	csv: string
): Promise<{ months: number; habits: number; entries: number }> {
	const db = await getDB();
	const lines = csv.split('\n').filter((l) => l.trim() !== '');
	if (lines.length < 2) throw new Error('CSV file is empty or invalid');

	const header = parseCSVRow(lines[0]);
	if (header[0] !== 'type') throw new Error('Archivo CSV no válido');
	const hasMeta = lines.some((l) => l.startsWith('meta'));
	if (!hasMeta) throw new Error('Formato no soportado');

	let monthsCount = 0,
		habitsCount = 0,
		entriesCount = 0;

	const tx = db.transaction(['months', 'habits', 'entries'], 'readwrite');

	for (let i = 1; i < lines.length; i++) {
		const row = parseCSVRow(lines[i]);
		const type = row[0];

		if (type === 'habit') {
			const [, id, name] = row;
			if (!id) continue;
			await tx.objectStore('habits').put({ id, name: name ?? '' } as Habit);
			habitsCount++;
		}
	}

	for (let i = 1; i < lines.length; i++) {
		const row = parseCSVRow(lines[i]);
		const type = row[0];

		if (type === 'month') {
			const monthId = row[3];
			const [yearStr, monthStr] = monthId.split('-');
			await tx.objectStore('months').put({
				id: monthId,
				year: parseInt(yearStr),
				month: parseInt(monthStr),
				mantra: row[4] || '',
				memberships: [],
				setupComplete: true
			} as Month);
			monthsCount++;
		} else if (type === 'member') {
			const [, habitId, , monthId] = row;
			const order = parseInt(row[7] ?? '0');
			if (!monthId) continue;
			const month = (await tx.objectStore('months').get(monthId)) as Month | undefined;
			if (month) {
				const memberships = month.memberships ?? [];
				if (!memberships.some((mm) => mm.habitId === habitId)) {
					memberships.push({ habitId, order });
				}
				await tx.objectStore('months').put({ ...month, memberships });
			}
		}
	}

	for (let i = 1; i < lines.length; i++) {
		const row = parseCSVRow(lines[i]);
		if (row[0] !== 'entry') continue;
		const date = row[5];
		if (!date) continue;
		const habitId = row[1];
		const monthId = row[3];
		const journalText = row[6] || '';
		const completed = row[8] === '1';

		let entry = (await tx.objectStore('entries').get(date)) as DailyEntry | undefined;
		if (!entry) {
			entry = { date, monthId, journalText: '', completions: {} };
		}
		if (journalText) entry.journalText = journalText;
		if (habitId) entry.completions[habitId] = completed;

		await tx.objectStore('entries').put(entry);
		entriesCount++;
	}

	await tx.done;
	return { months: monthsCount, habits: habitsCount, entries: entriesCount };
}

function csvCell(value: string): string {
	const escaped = (value ?? '').replace(/"/g, '""');
	return `"${escaped}"`;
}

function parseCSVRow(row: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		if (char === '"') {
			if (inQuotes && row[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current);
	return result;
}
