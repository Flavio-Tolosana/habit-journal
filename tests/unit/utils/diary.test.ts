import { describe, it, expect } from 'vitest';
import {
  hasDiaryText,
  monthsWithDiary,
  buildSlideSequence,
  initialSlideDate,
  initialSlideIndex,
} from '../../../src/lib/utils/diary';
import type { DailyEntry } from '../../../src/lib/db/types';

function entry(date: string, journalText = '', completions: Record<string, boolean> = {}): DailyEntry {
  return { date, monthId: date.substring(0, 7), journalText, completions };
}

describe('hasDiaryText', () => {
  it('returns false for empty text', () => {
    expect(hasDiaryText(entry('2026-09-01', ''))).toBe(false);
  });

  it('returns false for whitespace-only text', () => {
    expect(hasDiaryText(entry('2026-09-01', '   \n\t '))).toBe(false);
  });

  it('returns true for non-empty text', () => {
    expect(hasDiaryText(entry('2026-09-01', 'Un día estupendo'))).toBe(true);
  });

  it('returns true when text has content around whitespace', () => {
    expect(hasDiaryText(entry('2026-09-01', '  contenido  '))).toBe(true);
  });
});

describe('monthsWithDiary', () => {
  it('returns an empty array for no entries', () => {
    expect(monthsWithDiary([])).toEqual([]);
  });

  it('returns an empty array when all entries lack diary text', () => {
    const entries = [entry('2026-09-01', ''), entry('2026-09-02', '  ')];
    expect(monthsWithDiary(entries)).toEqual([]);
  });

  it('returns the month of a single entry with text', () => {
    const entries = [entry('2026-09-10', 'texto')];
    expect(monthsWithDiary(entries)).toEqual(['2026-09']);
  });

  it('excludes months whose entries only have habits (no text)', () => {
    const entries = [
      entry('2026-08-01', '', { h1: true }),
      entry('2026-09-01', 'tengo diario'),
    ];
    expect(monthsWithDiary(entries)).toEqual(['2026-09']);
  });

  it('deduplicates months and sorts them descending (most recent first)', () => {
    const entries = [
      entry('2026-08-15', 'agosto'),
      entry('2026-09-01', 'septiembre'),
      entry('2026-08-20', 'agosto otra vez'),
      entry('2026-07-03', 'julio'),
    ];
    expect(monthsWithDiary(entries)).toEqual(['2026-09', '2026-08', '2026-07']);
  });
});

describe('buildSlideSequence', () => {
  it('returns an empty array for no entries', () => {
    expect(buildSlideSequence([], '2026-09', 'mantra')).toEqual([]);
  });

  it('filters out entries without diary text', () => {
    const entries = [entry('2026-09-01', ''), entry('2026-09-02', 'con texto')];
    const slides = buildSlideSequence(entries, '2026-09', undefined);
    expect(slides).toHaveLength(1);
    expect(slides[0].date).toBe('2026-09-02');
  });

  it('does not cross month boundaries', () => {
    const entries = [
      entry('2026-08-31', 'agosto'),
      entry('2026-09-01', 'septiembre'),
    ];
    const slides = buildSlideSequence(entries, '2026-09', undefined);
    expect(slides.map((s) => s.date)).toEqual(['2026-09-01']);
  });

  it('sorts slides descending by date (newest first)', () => {
    const entries = [
      entry('2026-09-01', 'día 1'),
      entry('2026-09-22', 'día 22'),
      entry('2026-09-05', 'día 5'),
    ];
    const slides = buildSlideSequence(entries, '2026-09', undefined);
    expect(slides.map((s) => s.date)).toEqual(['2026-09-22', '2026-09-05', '2026-09-01']);
  });

  it('attaches the mantra, text and completions to each slide', () => {
    const entries = [entry('2026-09-01', 'texto', { h1: true, h2: false })];
    const slides = buildSlideSequence(entries, '2026-09', 'Mi mantra del mes');
    expect(slides).toHaveLength(1);
    expect(slides[0]).toEqual({
      date: '2026-09-01',
      journalText: 'texto',
      mantra: 'Mi mantra del mes',
      completions: { h1: true, h2: false },
    });
  });

  it('returns empty when the month has no diary entries', () => {
    const entries = [entry('2026-08-10', 'solo agosto')];
    expect(buildSlideSequence(entries, '2026-09', undefined)).toEqual([]);
  });
});

describe('initialSlideDate', () => {
  it('returns today when today has a diary entry', () => {
    const slides = buildSlideSequence(
      [entry('2026-09-01', 'antes'), entry('2026-09-10', 'hoy')],
      '2026-09',
      undefined
    );
    expect(initialSlideDate(slides, '2026-09-10')).toBe('2026-09-10');
  });

  it('returns the most recent slide on or before today when today has none', () => {
    const slides = buildSlideSequence(
      [entry('2026-09-01', 'día 1'), entry('2026-09-05', 'día 5')],
      '2026-09',
      undefined
    );
    expect(initialSlideDate(slides, '2026-09-03')).toBe('2026-09-01');
  });

  it('never returns a date after today', () => {
    const slides = buildSlideSequence(
      [entry('2026-09-05', 'día 5'), entry('2026-09-10', 'día 10')],
      '2026-09',
      undefined
    );
    expect(initialSlideDate(slides, '2026-09-07')).toBe('2026-09-05');
  });

  it('returns undefined when there are no slides', () => {
    expect(initialSlideDate([], '2026-09-01')).toBeUndefined();
  });
});

describe('initialSlideIndex', () => {
  it('returns 0 when today has a diary entry (newest first)', () => {
    const slides = buildSlideSequence(
      [entry('2026-09-01', 'antes'), entry('2026-09-10', 'hoy')],
      '2026-09',
      undefined
    );
    expect(initialSlideIndex(slides, '2026-09-10')).toBe(0);
  });

  it('returns the index of the fallback slide', () => {
    const slides = buildSlideSequence(
      [entry('2026-09-01', 'día 1'), entry('2026-09-05', 'día 5'), entry('2026-09-20', 'día 20')],
      '2026-09',
      undefined
    );
    expect(initialSlideIndex(slides, '2026-09-03')).toBe(2);
  });

  it('returns -1 when there are no slides', () => {
    expect(initialSlideIndex([], '2026-09-01')).toBe(-1);
  });
});