import { error } from '@sveltejs/kit';
import { isValidMonthKey, monthKey, todayISO } from '#lib/dates.ts';
import { monthPeriod } from '#lib/recap.ts';
import { loadRecap } from '#lib/server/recap.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!isValidMonthKey(params.key) || params.key > monthKey(todayISO())) {
		error(404, 'Rückblick nicht gefunden');
	}
	return loadRecap(locals, monthPeriod(params.key));
};
