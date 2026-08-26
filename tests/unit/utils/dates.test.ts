import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getToday,
  getMonthId,
  getDaysInMonth,
  formatDisplayDate,
  isSameMonth,
} from '../../../src/lib/utils/dates';

describe('getToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today as YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 26)); // Aug 26, 2026

    expect(getToday()).toBe('2026-08-26');
  });

  it('pads single-digit months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 5)); // Jan 5, 2025

    expect(getToday()).toBe('2025-01-05');
  });

  it('handles last day of year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31)); // Dec 31, 2026

    expect(getToday()).toBe('2026-12-31');
  });

  it('handles first day of year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // Jan 1, 2026

    expect(getToday()).toBe('2026-01-01');
  });

  it('uses local timezone, not UTC', () => {
    vi.useFakeTimers();
    // 11 PM local could be next day UTC, but getToday should use local date
    vi.setSystemTime(new Date(2026, 7, 26, 23, 59, 59));

    expect(getToday()).toBe('2026-08-26');
  });
});

describe('getMonthId', () => {
  it('extracts YYYY-MM from full date', () => {
    expect(getMonthId('2026-08-26')).toBe('2026-08');
  });

  it('handles January', () => {
    expect(getMonthId('2025-01-15')).toBe('2025-01');
  });

  it('handles December', () => {
    expect(getMonthId('2024-12-31')).toBe('2024-12');
  });

  it('handles first day of month', () => {
    expect(getMonthId('2026-03-01')).toBe('2026-03');
  });

  it('handles leap day', () => {
    expect(getMonthId('2024-02-29')).toBe('2024-02');
  });
});

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 1)).toBe(31);
  });

  it('returns 28 for February in non-leap year', () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
  });

  it('returns 29 for February in leap year', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
  });

  it('returns 29 for February in century non-leap year', () => {
    expect(getDaysInMonth(1900, 2)).toBe(28);
  });

  it('returns 29 for February in 400-year leap year', () => {
    expect(getDaysInMonth(2000, 2)).toBe(29);
  });

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 4)).toBe(30);
  });

  it('returns 30 for June', () => {
    expect(getDaysInMonth(2026, 6)).toBe(30);
  });

  it('returns 30 for September', () => {
    expect(getDaysInMonth(2026, 9)).toBe(30);
  });

  it('returns 30 for November', () => {
    expect(getDaysInMonth(2026, 11)).toBe(30);
  });

  it('returns 31 for July', () => {
    expect(getDaysInMonth(2026, 7)).toBe(31);
  });

  it('returns 31 for August', () => {
    expect(getDaysInMonth(2026, 8)).toBe(31);
  });

  it('returns 31 for October', () => {
    expect(getDaysInMonth(2026, 10)).toBe(31);
  });

  it('returns 31 for March', () => {
    expect(getDaysInMonth(2026, 3)).toBe(31);
  });

  it('returns 31 for May', () => {
    expect(getDaysInMonth(2026, 5)).toBe(31);
  });
});

describe('formatDisplayDate', () => {
  it('formats a standard date', () => {
    expect(formatDisplayDate('2026-08-26')).toBe('26 agosto 2026');
  });

  it('formats January 1st', () => {
    expect(formatDisplayDate('2026-01-01')).toBe('1 enero 2026');
  });

  it('formats December 31st', () => {
    expect(formatDisplayDate('2026-12-31')).toBe('31 diciembre 2026');
  });

  it('formats a leap day', () => {
    expect(formatDisplayDate('2024-02-29')).toBe('29 febrero 2024');
  });

  it('formats March', () => {
    expect(formatDisplayDate('2026-03-15')).toBe('15 marzo 2026');
  });

  it('formats April', () => {
    expect(formatDisplayDate('2026-04-10')).toBe('10 abril 2026');
  });

  it('formats May', () => {
    expect(formatDisplayDate('2026-05-05')).toBe('5 mayo 2026');
  });

  it('formats June', () => {
    expect(formatDisplayDate('2026-06-21')).toBe('21 junio 2026');
  });

  it('formats July', () => {
    expect(formatDisplayDate('2026-07-04')).toBe('4 julio 2026');
  });

  it('formats September', () => {
    expect(formatDisplayDate('2026-09-16')).toBe('16 septiembre 2026');
  });

  it('formats October', () => {
    expect(formatDisplayDate('2026-10-31')).toBe('31 octubre 2026');
  });

  it('formats November', () => {
    expect(formatDisplayDate('2026-11-02')).toBe('2 noviembre 2026');
  });

  it('omits leading zero on single-digit days', () => {
    expect(formatDisplayDate('2026-08-05')).toBe('5 agosto 2026');
  });

  it('does not pad single-digit days', () => {
    expect(formatDisplayDate('2025-01-09')).toBe('9 enero 2025');
  });
});

describe('isSameMonth', () => {
  it('returns true for same date', () => {
    expect(isSameMonth('2026-08-26', '2026-08-26')).toBe(true);
  });

  it('returns true for different days in same month', () => {
    expect(isSameMonth('2026-08-01', '2026-08-31')).toBe(true);
  });

  it('returns false for adjacent months', () => {
    expect(isSameMonth('2026-08-31', '2026-09-01')).toBe(false);
  });

  it('returns false for same day different month', () => {
    expect(isSameMonth('2026-07-15', '2026-08-15')).toBe(false);
  });

  it('returns false for same day different year', () => {
    expect(isSameMonth('2025-08-26', '2026-08-26')).toBe(false);
  });

  it('returns true for same month different years', () => {
    expect(isSameMonth('2025-03-10', '2026-03-10')).toBe(false);
  });

  it('returns true for January dates across year boundary check', () => {
    expect(isSameMonth('2026-01-15', '2026-01-31')).toBe(true);
  });

  it('returns false for December and January', () => {
    expect(isSameMonth('2026-12-25', '2027-01-01')).toBe(false);
  });

  it('handles leap year February', () => {
    expect(isSameMonth('2024-02-29', '2024-02-01')).toBe(true);
  });

  it('returns false comparing leap Feb with non-leap Feb', () => {
    expect(isSameMonth('2024-02-29', '2025-02-28')).toBe(false);
  });

  it('returns true regardless of argument order', () => {
    expect(isSameMonth('2026-11-20', '2026-11-05')).toBe(
      isSameMonth('2026-11-05', '2026-11-20'),
    );
  });
});
