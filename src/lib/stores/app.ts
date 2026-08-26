import { writable, derived } from 'svelte/store';
import { getToday, getMonthId } from '../utils/dates';

export const currentDate = writable(getToday());
export const currentMonthId = derived(currentDate, ($date) => getMonthId($date));
export const selectedMonth = writable<string | null>(null);
export const setupPromptOpen = writable(false);
