// Laden von Rückblicken aus der Datenbank.

import { and, eq, gte, lte, min } from 'drizzle-orm';
import { todayISO } from '#lib/dates.ts';
import {
	buildRecap,
	isCompleted,
	lastCompletedMonth,
	lastCompletedWeek,
	shiftPeriod,
	type Period
} from '#lib/recap.ts';
import type { EntrySummary } from '#lib/types.ts';
import { db } from './db/index.ts';
import { entries, users } from './db/schema.ts';
import { getCategories, requireUser, selectSummaries, toSummary } from './data.ts';

export async function loadRecap(locals: App.Locals, period: Period) {
	const user = requireUser(locals);
	const today = todayISO();
	const latest = period.type === 'week' ? lastCompletedWeek(today) : lastCompletedMonth(today);

	const rows = await selectSummaries().where(
		and(
			eq(entries.userId, user.id),
			gte(entries.experiencedAt, period.start),
			lte(entries.experiencedAt, period.end)
		)
	);
	const list: (EntrySummary & { categoryId: string })[] = rows.map((r) => ({
		...toSummary(r),
		categoryId: r.categoryId
	}));
	const recap = buildRecap(list);

	const [first] = await db
		.select({ date: min(entries.experiencedAt) })
		.from(entries)
		.where(eq(entries.userId, user.id));
	const prev = shiftPeriod(period, -1);
	const next = shiftPeriod(period, 1);

	// Beim Ansehen des neuesten Rückblicks gilt er als gesehen
	if (period.key === latest.key) {
		await db
			.update(users)
			.set(period.type === 'week' ? { recapSeenWeek: period.key } : { recapSeenMonth: period.key })
			.where(eq(users.id, user.id));
	}

	const categories = await getCategories(user.id);
	return {
		period,
		recap,
		categories,
		today,
		prev: first?.date && first.date <= prev.end ? prev : null,
		next: isCompleted(next, today) ? next : null,
		isLatest: period.key === latest.key,
		completed: isCompleted(period, today)
	};
}
