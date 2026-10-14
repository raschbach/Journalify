import { redirect } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { databaseIsReady, ensureBuiltins } from '#lib/server/builtins.ts';
import { db } from '#lib/server/db/index.ts';
import {
	deleteSessionCookie,
	SESSION_COOKIE,
	setSessionCookie,
	validateSessionToken
} from '#lib/server/auth/session.ts';

let dbReady = false;

async function prepareDatabase() {
	if (dbReady) return true;
	if (!(await databaseIsReady(db))) return false;
	await ensureBuiltins(db);
	dbReady = true;
	return true;
}

export const init: ServerInit = async () => {
	try {
		if (!(await prepareDatabase())) {
			console.warn(
				'\n⚠️  Journalify: Die Datenbank ist noch nicht eingerichtet. Bitte `npm run db:push` und `npm run db:seed` ausführen.\n'
			);
		}
	} catch (error) {
		console.error('Journalify: Datenbank konnte nicht vorbereitet werden.', error);
	}
};

/** Seiten, die ohne Login erreichbar sind */
const PUBLIC_PATHS = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
	if (!(await prepareDatabase())) {
		return new Response(
			'<!doctype html><meta charset="utf-8"><title>Journalify</title>' +
				'<body style="font-family:system-ui;padding:2rem;line-height:1.5">' +
				'<h1>Datenbank fehlt</h1><p>Bitte im Projektordner ausführen:</p>' +
				'<pre>npm run db:push\nnpm run db:seed</pre><p>Danach die Seite neu laden.</p>',
			{ status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
		);
	}

	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = null;
	event.locals.sessionId = null;

	if (token) {
		const { session, user } = await validateSessionToken(token);
		if (session) {
			setSessionCookie(event.cookies, event.url, token, session.expiresAt);
			event.locals.user = user;
			event.locals.sessionId = session.id;
		} else {
			deleteSessionCookie(event.cookies, event.url);
		}
	}

	const path = event.url.pathname;
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

	if (!event.locals.user && !isPublic) {
		if (path.startsWith('/api/')) {
			return new Response(JSON.stringify({ message: 'Nicht angemeldet' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		const target = path + event.url.search;
		redirect(303, target === '/' ? '/login' : `/login?redirectTo=${encodeURIComponent(target)}`);
	}

	if (event.locals.user && isPublic) {
		redirect(303, '/');
	}

	return resolve(event);
};
