interface HabitLike {
  id: string;
}

interface EntryLike {
  date: string;
  completions: Record<string, boolean>;
}

export function calculateStreaks(
  habits: HabitLike[],
  entries: EntryLike[]
): Map<string, { current: number; longest: number }> {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const result = new Map<string, { current: number; longest: number }>();

  for (const habit of habits) {
    const completedDates = sorted
      .filter((e) => e.completions[habit.id] === true)
      .map((e) => e.date);

    let longest = 0;
    let current = 0;
    let groupLen = 0;

    for (let i = 0; i < completedDates.length; i++) {
      if (i === 0) {
        groupLen = 1;
      } else {
        const prev = new Date(completedDates[i - 1]);
        const curr = new Date(completedDates[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          groupLen++;
        } else {
          groupLen = 1;
        }
      }

      if (groupLen > longest) {
        longest = groupLen;
      }
    }

    current = groupLen;

    result.set(habit.id, { current, longest });
  }

  return result;
}
