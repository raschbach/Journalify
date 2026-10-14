import { and, eq } from 'drizzle-orm';
import { filterAndSort, parseBrowseParams } from '#lib/browse.ts';
import { getCategories, requireUser, summaryColumns, toSummary } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { categories as categoriesTable, entries, users } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 30;

/** Felder, die nur für die Suche gebraucht werden, nicht an den Client schicken */
function stripSearchFields<T extends { fieldValues: unknown; extraFields: unknown }>(entry: T) {
	const { fieldValues, extraFields, ...rest } = entry;
	void fieldValues;
	void extraFields;
	return rest;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const params = parseBrowseParams(url.searchParams);
	const categories = await getCategories(user.id);
	const category = params.category ? categories.find((c) => c.slug === params.category) : undefined;

	const rows = await db
		.select({ ...summaryColumns, fieldValues: entries.fieldValues, extraFields: entries.extraFields })
		.from(entries)
		.innerJoin(categoriesTable, eq(entries.categoryId, categoriesTable.id))
		.innerJoin(users, eq(entries.userId, users.id))
		.where(and(eq(entries.userId, user.id), category ? eq(entries.categoryId, category.id) : undefined));

	const all = rows.map((r) => ({
		...toSummary(r),
		fieldValues: r.fieldValues ?? {},
		extraFields: r.extraFields ?? []
	}));
	const years = [...new Set(all.map((e) => Number(e.experiencedAt.slice(0, 4))))].sort((a, b) => b - a);
	const results = filterAndSort(all, { ...params, category: category?.slug ?? null });

	const requested = Number.parseInt(url.searchParams.get('n') ?? '', 10);
	const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, PAGE_SIZE), 1000) : PAGE_SIZE;

	return {
		params: { ...params, category: category?.slug ?? null },
		categories,
		years,
		total: results.length,
		results: results.slice(0, limit).map(stripSearchFields),
		limit,
		pageSize: PAGE_SIZE
	};
};
