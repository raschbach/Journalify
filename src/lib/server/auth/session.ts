import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, users } from '../db/schema';

export const SESSION_COOKIE = 'journalify_session';
const DAY = 24 * 60 * 60 * 1000;
const SESSION_DURATION = 30 * DAY;
const RENEW_THRESHOLD = 15 * DAY;

export interface SessionUser {
	id: string;
	username: string;
	displayName: string;
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

export async function createSession(token: string, userId: string) {
	const session = {
		id: hashToken(token),
		userId,
		expiresAt: new Date(Date.now() + SESSION_DURATION)
	};
	await db.insert(sessions).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = hashToken(token);
	const [row] = await db
		.select({
			user: { id: users.id, username: users.username, displayName: users.displayName },
			session: sessions
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (!row) return { session: null, user: null };

	const { session, user } = row;
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - RENEW_THRESHOLD) {
		session.expiresAt = new Date(Date.now() + SESSION_DURATION);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	return { session, user: user satisfies SessionUser };
}

export async function invalidateSession(sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Setzt das Session-Cookie. `secure` nur bei HTTPS – sonst würde der Login am
 * Handy über http://192.168.x.x:5173 im WLAN nicht funktionieren.
 */
export function setSessionCookie(cookies: Cookies, url: URL, token: string, expiresAt: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		expires: expiresAt
	});
}

export function deleteSessionCookie(cookies: Cookies, url: URL) {
	cookies.delete(SESSION_COOKIE, { path: '/', secure: url.protocol === 'https:' });
}
