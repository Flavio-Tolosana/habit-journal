import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		year: parseInt(params.year),
		month: parseInt(params.month),
		day: parseInt(params.day)
	};
};
