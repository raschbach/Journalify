import { randomUUID } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { hashPassword } from '#lib/server/auth/password.ts';
import { createSession, generateSessionToken, setSessionCookie } from '#lib/server/auth/session.ts';
import { setFlash } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import {
	displayNameSchema,
	fieldErrors,
	formString,
	passwordSchema,
	safeRedirect,
	usernameSchema
} from '#lib/server/validation.ts';
import type { Actions } from './$types';

const schema = z.object({
	username: usernameSchema,
	displayName: displayNameSchema,
	password: passwordSchema
});

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const raw = {
			username: formString(data, 'username'),
			displayName: formString(data, 'displayName'),
			password: formString(data, 'password')
		};
		const values = { username: raw.username, displayName: raw.displayName };

		const parsed = schema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { values, errors: fieldErrors(parsed.error) });
		}

		const taken: Record<string, string> = { username: 'Dieser Benutzername ist schon vergeben.' };
		const { username, displayName, password } = parsed.data;
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.username, username))
			.limit(1);
		if (existing) {
			return fail(400, { values, errors: taken });
		}

		const id = randomUUID();
		try {
			await db
				.insert(users)
				.values({ id, username, displayName, passwordHash: await hashPassword(password) });
		} catch {
			// z. B. gleichzeitige Registrierung mit demselben Namen
			return fail(400, { values, errors: taken });
		}

		const token = generateSessionToken();
		const session = await createSession(token, id);
		setSessionCookie(cookies, url, token, session.expiresAt);
		setFlash(cookies, url, {
			message: `Willkommen bei Journalify, ${displayName}!`,
			tone: 'success'
		});

		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
