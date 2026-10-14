import { and, eq, gte, lt, lte, ne, sql } from 'drizzle-orm';
import { todayISO } from '#lib/dates.ts';
import { buildRecap, lastCompletedMonth, lastCompletedWeek, onThisDay } from '#lib/recap.ts';
import {
	getCategories,
	requireUser,
	selectSummaries,
	toSummary
} from '#lib/server/data.ts';
import { entries } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const today = todayISO();
	const categories = await getCategories(user.id);

	// Zufällige Erinnerung (optional nach Kategorie, nicht zweimal dieselbe hintereinander)
	const slug = url.searchParams.get('category');
	const filterCategory = slug ? categories.find((c) => c.slug === slug) : undefined;
	const previousId = url.searchParams.get('after');
	const conditions = [eq(entries.userId, user.id)];
	if (filterCategory) conditions.push(eq(entries.categoryId, filterCategory.id));
	let [randomRow] = await selectSummaries()
		.where(and(...conditions, previousId ? ne(entries.id, previousId) : undefined))
		.orderBy(sql`random()`)
		.limit(1);
	if (!randomRow && previousId) {
		// Es gibt nur einen passenden Eintrag
		[randomRow] = await selectSummaries().where(and(...conditions)).limit(1);
	}

	// „An diesem Tag“ – nur Einträge aus früheren Jahren
	const yearStart = `${today.slice(0, 4)}-01-01`;
	const pastRows = await selectSummaries().where(
		and(eq(entries.userId, user.id), lt(entries.experiencedAt, yearStart))
	);
	const memories = onThisDay(
		pastRows.map((r) => toSummary(r)),
		today
	);

	// Teaser für die neuesten Rückblicke
	const week = lastCompletedWeek(today);
	const month = lastCompletedMonth(today);
	const recapTeaser = async (start: string, end: string) => {
		const rows = await selectSummaries().where(
			and(eq(entries.userId, user.id), gte(entries.experiencedAt, start), lte(entries.experiencedAt, end))
		);
		const r = buildRecap(rows.map((row) => ({ ...toSummary(row), categoryId: row.categoryId })));
		return { count: r.count, averageRating: r.averageRating, xp: r.xp, emojis: [...new Set(r.entries.map((e) => e.category.emoji))].slice(0, 5) };
	};
	const [weekTeaser, monthTeaser] = await Promise.all([
		recapTeaser(week.start, week.end),
		recapTeaser(month.start, month.end)
	]);

	return {
		today,
		categories,
		filter: filterCategory?.slug ?? null,
		random: randomRow ? toSummary(randomRow) : null,
		memories,
		week: { ...week, ...weekTeaser },
		month: { ...month, ...monthTeaser }
	};
};
