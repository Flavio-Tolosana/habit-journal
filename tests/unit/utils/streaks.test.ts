import { describe, it, expect, afterEach } from 'vitest';
import { vi } from 'vitest';
import { calculateStreaks } from '../../../src/lib/utils/streaks';

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateStreaks', () => {
  it('returns empty map for empty habits', () => {
    const result = calculateStreaks([], []);
    expect(result.size).toBe(0);
  });

  it('calculates current streak ending today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-24', completions: { h1: true } },
      { date: '2026-08-25', completions: { h1: true } },
      { date: '2026-08-26', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 3, longest: 3 });
  });

  it('calculates current streak ending yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-23', completions: { h1: true } },
      { date: '2026-08-24', completions: { h1: true } },
      { date: '2026-08-25', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 3, longest: 3 });
  });

  it('calculates longest streak across all time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-01', completions: { h1: true } },
      { date: '2026-08-02', completions: { h1: true } },
      { date: '2026-08-03', completions: { h1: true } },
      { date: '2026-08-04', completions: { h1: true } },
      { date: '2026-08-05', completions: { h1: true } },
      { date: '2026-08-07', completions: { h1: true } },
      { date: '2026-08-08', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 2, longest: 5 });
  });

  it('handles streak break resetting current streak', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-20', completions: { h1: true } },
      { date: '2026-08-21', completions: { h1: true } },
      { date: '2026-08-22', completions: { h1: true } },
      { date: '2026-08-25', completions: { h1: true } },
      { date: '2026-08-26', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 2, longest: 3 });
  });

  it('handles single day streak', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [{ date: '2026-08-26', completions: { h1: true } }];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 1, longest: 1 });
  });

  it('handles multiple habits with different streaks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00'));

    const habits = [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }];
    const entries: Array<{ date: string; completions: Record<string, boolean> }> = [
      { date: '2026-08-24', completions: { h1: true, h2: true } },
      { date: '2026-08-25', completions: { h1: true, h2: true } },
      { date: '2026-08-26', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 3, longest: 3 });
    expect(result.get('h2')).toEqual({ current: 2, longest: 2 });
    expect(result.get('h3')).toEqual({ current: 0, longest: 0 });
  });

  it('counts a streak that crosses a month boundary as continuous', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-30', completions: { h1: true } },
      { date: '2026-08-31', completions: { h1: true } },
      { date: '2026-09-01', completions: { h1: true } },
      { date: '2026-09-02', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 4, longest: 4 });
  });

  it('keeps a broken streak separated when the habit is repeated months later', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T12:00:00'));

    const habits = [{ id: 'h1' }];
    const entries = [
      { date: '2026-08-01', completions: { h1: true } },
      { date: '2026-08-02', completions: { h1: true } },
      { date: '2026-09-01', completions: { h1: true } },
      { date: '2026-09-02', completions: { h1: true } },
    ];

    const result = calculateStreaks(habits, entries);
    expect(result.get('h1')).toEqual({ current: 2, longest: 2 });
  });
});
