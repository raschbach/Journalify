import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { areFriends, requireUser, selectSummaries, toSummary, newestFirst } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { entries, users } from '#lib/server/db/schema.ts';
import { loadProfileStats } from '#lib/server/profile.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const me = requireUser(locals);
	const username = params.username.toLowerCase();
	if (username === me.username) redirect(307, '/profile');

	const [user] = await db
		.select({ id: users.id, username: users.username, displayName: users.displayName })
		.from(users)
		.where(eq(users.username, username))
		.limit(1);

	// Profile sind nur für bestätigte Freund:innen sichtbar – sonst 404 (verrät nicht, ob es den Account gibt)
	if (!user || !(await areFriends(me.id, user.id))) error(404, 'Profil nicht gefunden');

	const [profile, recentRows] = await Promise.all([
		loadProfileStats(user.id, true),
		selectSummaries()
			.where(and(eq(entries.userId, user.id), eq(entries.visibility, 'friends')))
			.orderBy(...newestFirst)
			.limit(20)
	]);

	return {
		user,
		...profile,
		recent: recentRows.map((r) => toSummary(r, true))
	};
};
