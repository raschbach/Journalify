import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '#lib/server/auth/password.ts';
import { createSession, generateSessionToken, setSessionCookie } from '#lib/server/auth/session.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { formString, safeRedirect } from '#lib/server/validation.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const username = formString(data, 'username').trim().toLowerCase();
		const password = formString(data, 'password');

		if (!username || !password) {
			return fail(400, { username, message: 'Bitte Benutzername und Passwort eingeben.' });
		}

		const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
		const valid = user ? await verifyPassword(password, user.passwordHash) : false;
		if (!user || !valid) {
			return fail(400, { username, message: 'Benutzername oder Passwort ist falsch.' });
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id);
		setSessionCookie(cookies, url, token, session.expiresAt);

		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
