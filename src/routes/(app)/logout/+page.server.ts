import { redirect } from '@sveltejs/kit';
import { deleteSessionCookie, invalidateSession } from '#lib/server/auth/session.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: async ({ locals, cookies, url }) => {
		if (locals.sessionId) await invalidateSession(locals.sessionId);
		deleteSessionCookie(cookies, url);
		redirect(303, '/login');
	}
};
