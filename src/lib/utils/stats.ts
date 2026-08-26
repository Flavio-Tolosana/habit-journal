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
