import { redirect } from '@sveltejs/kit';
import { todayISO } from '#lib/dates.ts';
import { lastCompletedMonth } from '#lib/recap.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(307, `/remember/month/${lastCompletedMonth(todayISO()).key}`);
