import { error, redirect } from '@sveltejs/kit';
import { isValidISODate, todayISO } from '#lib/dates.ts';
import { weekPeriod } from '#lib/recap.ts';
import { loadRecap } from '#lib/server/recap.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!isValidISODate(params.key)) error(404, 'Rückblick nicht gefunden');
	const period = weekPeriod(params.key);
	if (period.key !== params.key) redirect(307, `/remember/week/${period.key}`);
	if (period.start > todayISO()) error(404, 'Rückblick nicht gefunden');
	return loadRecap(locals, period);
};
