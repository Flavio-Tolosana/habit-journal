import type { DailyEntry } from '$lib/db/types';
import { getMonthId } from '$lib/utils/dates';

export interface DiarySlide {
  /** 'YYYY-MM-DD' */
  date: string;
  /** Texto del diario, no vacío tras trim (FR-005) */
  journalText: string;
  /** Mantra del mes al que pertenece el slide (FR-002) */
  mantra: string | undefined;
  /** completions de la entrada — para el toggle de hábitos (FR-019) */
  completions: Record<string, boolean>;
}

export function hasDiaryText(entry: Pick<DailyEntry, 'journalText'>): boolean {
  return entry.journalText.trim().length > 0;
}

export function monthsWithDiary(entries: DailyEntry[]): string[] {
  const months = new Set<string>();
  for (const e of entries) {
    if (hasDiaryText(e)) {
      months.add(getMonthId(e.date));
    }
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function buildSlideSequence(
  entries: DailyEntry[],
  monthId: string,
  mantra: string | undefined
): DiarySlide[] {
  return entries
    .filter((e) => getMonthId(e.date) === monthId && hasDiaryText(e))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({
      date: e.date,
      journalText: e.journalText,
      mantra,
      completions: e.completions,
    }));
}

export function initialSlideDate(slides: DiarySlide[], today: string): string | undefined {
  const slide = slides.find((s) => s.date <= today);
  return slide?.date;
}

export function initialSlideIndex(slides: DiarySlide[], today: string): number {
  const date = initialSlideDate(slides, today);
  if (date === undefined) return -1;
  return slides.findIndex((s) => s.date === date);
}