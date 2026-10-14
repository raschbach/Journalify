import { and, eq, inArray } from 'drizzle-orm';
import { computeStats } from '#lib/stats.ts';
import { levelProgress, totalXp } from '#lib/xp.ts';
import { categoryColumns } from './data.ts';
import { db } from './db/index.ts';
import { categories, entries } from './db/schema.ts';

/** Statistiken eines Profils – bei Freund:innen nur aus geteilten Einträgen. */
export async function loadProfileStats(userId: string, onlyShared: boolean) {
	const rows = await db
		.select({ categoryId: entries.categoryId, rating: entries.rating, notes: entries.notes })
		.from(entries)
		.where(
			onlyShared
				? and(eq(entries.userId, userId), eq(entries.visibility, 'friends'))
				: eq(entries.userId, userId)
		);
	const stats = computeStats(rows);
	const ids = stats.perCategory.map((c) => c.categoryId);
	const cats = ids.length
		? await db.select(categoryColumns).from(categories).where(inArray(categories.id, ids))
		: [];
	return {
		stats,
		level: levelProgress(totalXp(rows)),
		categories: cats
	};
}
