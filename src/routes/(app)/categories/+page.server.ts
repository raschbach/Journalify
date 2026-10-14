import { count, eq } from 'drizzle-orm';
import { getCategoriesWithFields, requireUser } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { entries } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const all = await getCategoriesWithFields(user.id);
	const counts = await db
		.select({ categoryId: entries.categoryId, n: count() })
		.from(entries)
		.where(eq(entries.userId, user.id))
		.groupBy(entries.categoryId);
	const byId = new Map(counts.map((c) => [c.categoryId, c.n]));
	const withCounts = all.map((c) => ({ ...c, entryCount: byId.get(c.id) ?? 0 }));
	return {
		builtin: withCounts.filter((c) => c.ownerId === null),
		custom: withCounts.filter((c) => c.ownerId !== null)
	};
};
