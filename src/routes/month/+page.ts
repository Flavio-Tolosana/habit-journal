import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { getToday } from '$lib/utils/dates';

export function load() {
	const today = getToday();
	const [year, month] = today.split('-');
	redirect(307, `${base}/month/${year}/${parseInt(month)}`);
}
