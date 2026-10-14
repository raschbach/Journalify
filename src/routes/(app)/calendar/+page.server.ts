import { and, asc, eq, gte, lte } from 'drizzle-orm';
import {
	addDays,
	isValidMonthKey,
	monthKey,
	monthRange,
	startOfWeek,
	todayISO
} from '#lib/dates.ts';
import { requireUser, selectSummaries, toSummary } from '#lib/server/data.ts';
import { entries } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const today = todayISO();
	const param = url.searchParams.get('m');
	const month = param && isValidMonthKey(param) ? param : monthKey(today);
	const range = monthRange(month);
	const gridStart = startOfWeek(range.start);
	const gridEnd = addDays(startOfWeek(range.end), 6);

	const rows = await selectSummaries()
		.where(
			and(
				eq(entries.userId, user.id),
				gte(entries.experiencedAt, gridStart),
				lte(entries.experiencedAt, gridEnd)
			)
		)
		.orderBy(asc(entries.experiencedAt), asc(entries.createdAt));

	const selectedParam = url.searchParams.get('d');
	return {
		today,
		month,
		gridStart,
		gridEnd,
		entries: rows.map((r) => toSummary(r)),
		selected:
			selectedParam && selectedParam >= gridStart && selectedParam <= gridEnd ? selectedParam : null
	};
};
