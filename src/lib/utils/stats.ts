interface HabitLike {
  id: string;
  name: string;
}

interface EntryLike {
  date: string;
  completions: Record<string, boolean>;
}

export function completionRate(
  habitId: string,
  entries: EntryLike[],
  totalDaysInMonth: number
): { completed: number; total: number; rate: number } {
  let completed = 0;
  for (const entry of entries) {
    if (entry.completions[habitId] === true) {
      completed++;
    }
  }
  return {
    completed,
    total: totalDaysInMonth,
    rate: totalDaysInMonth > 0 ? completed / totalDaysInMonth : 0
  };
}

export function chartDataForMonth(
  habits: HabitLike[],
  entries: EntryLike[]
): { labels: string[]; datasets: Array<{ label: string; data: number[] }> } {
  const dates = [...new Set(entries.map((e) => e.date))].sort();
  const datasets = habits.map((habit) => ({
    label: habit.name,
    data: dates.map((date) => {
      const entry = entries.find((e) => e.date === date);
      return entry && entry.completions[habit.id] === true ? 1 : 0;
    })
  }));

  return { labels: dates, datasets };
}

export function monthCountsData(
  year: number,
  month: number,
  daysInMonth: number,
  habitIds: string[],
  entriesByDate: Map<string, EntryLike>
): { labels: string[]; datasets: Array<{ label: string; data: number[] }> } {
  const labels: string[] = [];
  const data: number[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = entriesByDate.get(date);
    let count = 0;
    if (entry) {
      for (const id of habitIds) {
        if (entry.completions[id] === true) count++;
      }
    }
    labels.push(String(day));
    data.push(count);
  }
  return {
    labels,
    datasets: [{ label: 'Hábitos completados', data }]
  };
}
