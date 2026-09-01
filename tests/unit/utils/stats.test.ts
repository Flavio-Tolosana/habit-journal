import { describe, it, expect } from 'vitest';
import {
	completionRate,
	chartDataForMonth,
	monthCountsData
} from '../../../src/lib/utils/stats';

describe('completionRate', () => {
  it('returns 0% completion with no entries', () => {
    const result = completionRate('h1', [], 30);
    expect(result).toEqual({ completed: 0, total: 30, rate: 0 });
  });

  it('returns 100% completion', () => {
    const entries = [
      { date: '2026-08-01', completions: { h1: true } },
      { date: '2026-08-02', completions: { h1: true } },
      { date: '2026-08-03', completions: { h1: true } },
    ];
    const result = completionRate('h1', entries, 3);
    expect(result).toEqual({ completed: 3, total: 3, rate: 1 });
  });

  it('returns partial completion', () => {
    const entries = [
      { date: '2026-08-01', completions: { h1: true } },
      { date: '2026-08-02', completions: { h1: false } },
      { date: '2026-08-03', completions: { h1: true } },
      { date: '2026-08-04', completions: { h1: false } },
    ];
    const result = completionRate('h1', entries, 4);
    expect(result).toEqual({ completed: 2, total: 4, rate: 0.5 });
  });

  it('handles missing completions for a habit', () => {
    const entries: Array<{ date: string; completions: Record<string, boolean> }> = [
      { date: '2026-08-01', completions: { h2: true } },
      { date: '2026-08-02', completions: { h1: true } },
    ];
    const result = completionRate('h1', entries, 2);
    expect(result).toEqual({ completed: 1, total: 2, rate: 0.5 });
  });

  it('computes completion rate across multiple months', () => {
    const entries = [
      { date: '2026-08-31', completions: { h1: true } },
      { date: '2026-09-01', completions: { h1: true } },
      { date: '2026-09-02', completions: { h1: false } },
    ];
    const result = completionRate('h1', entries, 3);
    expect(result).toEqual({ completed: 2, total: 3, rate: 2 / 3 });
  });
});

describe('chartDataForMonth', () => {
  it('returns correct labels and datasets', () => {
    const habits = [{ id: 'h1', name: 'Exercise' }];
    const entries = [
      { date: '2026-08-01', completions: { h1: true } },
      { date: '2026-08-02', completions: { h1: false } },
      { date: '2026-08-03', completions: { h1: true } },
    ];

    const result = chartDataForMonth(habits, entries);
    expect(result.labels).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
    expect(result.datasets).toEqual([
      { label: 'Exercise', data: [1, 0, 1] },
    ]);
  });

  it('returns correct datasets for multiple habits', () => {
    const habits = [
      { id: 'h1', name: 'Exercise' },
      { id: 'h2', name: 'Reading' },
    ];
    const entries = [
      { date: '2026-08-01', completions: { h1: true, h2: false } },
      { date: '2026-08-02', completions: { h1: false, h2: true } },
    ];

    const result = chartDataForMonth(habits, entries);
    expect(result.labels).toEqual(['2026-08-01', '2026-08-02']);
    expect(result.datasets).toEqual([
      { label: 'Exercise', data: [1, 0] },
      { label: 'Reading', data: [0, 1] },
    ]);
  });

  it('returns empty datasets with no entries', () => {
    const habits = [{ id: 'h1', name: 'Exercise' }];
    const result = chartDataForMonth(habits, []);
    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([
      { label: 'Exercise', data: [] },
    ]);
  });

  it('aggregates a habit across multiple months', () => {
    const habits = [{ id: 'h1', name: 'Exercise' }];
    const entries = [
      { date: '2026-08-31', completions: { h1: true } },
      { date: '2026-09-01', completions: { h1: true } },
      { date: '2026-09-02', completions: { h1: false } },
    ];

    const result = chartDataForMonth(habits, entries);

    expect(result.labels).toEqual(['2026-08-31', '2026-09-01', '2026-09-02']);
    expect(result.datasets).toEqual([{ label: 'Exercise', data: [1, 1, 0] }]);
  });
});

describe('monthCountsData', () => {
  it('builds a full month of day labels with completed habit counts', () => {
    const habitIds = ['h1', 'h2', 'h3'];
    type MonthEntry = { date: string; completions: Record<string, boolean> };
    const entriesByDate = new Map<string, MonthEntry>([
      ['2026-08-01', { date: '2026-08-01', completions: { h1: true, h2: true, h3: false } }],
      ['2026-08-03', { date: '2026-08-03', completions: { h1: true } }],
    ]);

    const result = monthCountsData(2026, 8, 31, habitIds, entriesByDate);

    expect(result.labels).toHaveLength(31);
    expect(result.labels[0]).toBe('1');
    expect(result.labels[30]).toBe('31');
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toHaveLength(31);
    expect(result.datasets[0].data[0]).toBe(2);
    expect(result.datasets[0].data[1]).toBe(0);
    expect(result.datasets[0].data[2]).toBe(1);
  });

  it('handles an empty month map with all zeros', () => {
    const result = monthCountsData(2026, 2, 28, ['h1'], new Map());
    expect(result.labels).toHaveLength(28);
    expect(result.datasets[0].data.every((v) => v === 0)).toBe(true);
  });
});
