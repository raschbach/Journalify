import { and, count, eq, gte, inArray, lte } from 'drizzle-orm';
import { todayISO } from '#lib/dates.ts';
import { lastCompletedMonth, lastCompletedWeek } from '#lib/recap.ts';
import {
	getFriendIds,
	newestFirst,
	requireUser,
	selectSummaries,
	toSummary
} from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { entries, users } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';
import { desc } from 'drizzle-orm';

const PAGE_SIZE = 20;

async function countInRange(userId: string, start: string, end: string) {
	const [row] = await db
		.select({ n: count() })
		.from(entries)
		.where(and(eq(entries.userId, userId), gte(entries.experiencedAt, start), lte(entries.experiencedAt, end)));
	return row?.n ?? 0;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const tab = url.searchParams.get('feed') === 'friends' ? 'friends' : 'me';
	const requested = Number.parseInt(url.searchParams.get('n') ?? '', 10);
	const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, PAGE_SIZE), 500) : PAGE_SIZE;

	const friendIds = await getFriendIds(user.id);

	let rows;
	if (tab === 'friends') {
		rows = friendIds.length
			? await selectSummaries()
					.where(and(inArray(entries.userId, friendIds), eq(entries.visibility, 'friends')))
					.orderBy(desc(entries.createdAt))
					.limit(limit + 1)
			: [];
	} else {
		rows = await selectSummaries()
			.where(eq(entries.userId, user.id))
			.orderBy(...newestFirst)
			.limit(limit + 1);
	}

	const hasMore = rows.length > limit;
	const feed = rows.slice(0, limit).map((r) => toSummary(r, tab === 'friends'));

	// Hinweis auf neue Rückblicke
	const today = todayISO();
	const week = lastCompletedWeek(today);
	const month = lastCompletedMonth(today);
	const [me] = await db
		.select({ recapSeenWeek: users.recapSeenWeek, recapSeenMonth: users.recapSeenMonth })
		.from(users)
		.where(eq(users.id, user.id));
	const [weekCount, monthCount, totalCount] = await Promise.all([
		me?.recapSeenWeek === week.key ? 0 : countInRange(user.id, week.start, week.end),
		me?.recapSeenMonth === month.key ? 0 : countInRange(user.id, month.start, month.end),
		db.select({ n: count() }).from(entries).where(eq(entries.userId, user.id)).then((r) => r[0]?.n ?? 0)
	]);

	return {
		tab,
		feed,
		hasMore,
		limit,
		pageSize: PAGE_SIZE,
		friendCount: friendIds.length,
		totalCount,
		today,
		recaps: {
			week: weekCount > 0 ? { ...week, count: weekCount } : null,
			month: monthCount > 0 ? { ...month, count: monthCount } : null
		}
	};
};

export const actions: Actions = {
	dismissRecap: async ({ locals, request }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const today = todayISO();
		if (data.get('type') === 'month') {
			await db.update(users).set({ recapSeenMonth: lastCompletedMonth(today).key }).where(eq(users.id, user.id));
		} else {
			await db.update(users).set({ recapSeenWeek: lastCompletedWeek(today).key }).where(eq(users.id, user.id));
		}
	}
};
