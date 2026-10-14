// Gemeinsame Logik für das Anlegen und Bearbeiten von Einträgen.

import { sql } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import type { EntryFormValues, FormCategory } from '#lib/types.ts';
import { levelForXp, levelTitle } from '#lib/xp.ts';
import type { Entry } from './db/schema.ts';
import { db } from './db/index.ts';
import { catalogItems } from './db/schema.ts';
import { getCategoriesByRecentUse, setFlash } from './data.ts';

/** Kategorien für das Formular – zuletzt genutzte zuerst, mit Bibliotheks-Info. */
export async function getFormCategories(userId: string): Promise<FormCategory[]> {
	const [cats, withCatalog] = await Promise.all([
		getCategoriesByRecentUse(userId),
		db.selectDistinct({ categoryId: catalogItems.categoryId }).from(catalogItems)
	]);
	const catalogIds = new Set(withCatalog.map((r) => r.categoryId));
	return cats.map((c) => ({ ...c, hasCatalog: catalogIds.has(c.id) }));
}

export function emptyFormValues(categoryId: string, date: string): EntryFormValues {
	return {
		categoryId,
		catalogItemId: null,
		catalogLabel: null,
		title: '',
		creator: '',
		year: '',
		coverUrl: '',
		experiencedAt: date,
		rating: null,
		notes: '',
		fieldValues: {},
		extraFields: [],
		visibility: 'friends'
	};
}

export async function entryToFormValues(entry: Entry): Promise<EntryFormValues> {
	let catalogLabel: string | null = null;
	if (entry.catalogItemId) {
		const [item] = await db
			.select({ creator: catalogItems.creator, year: catalogItems.year, title: catalogItems.title })
			.from(catalogItems)
			.where(sql`${catalogItems.id} = ${entry.catalogItemId}`)
			.limit(1);
		if (item) catalogLabel = [item.creator, item.year].filter(Boolean).join(' · ') || item.title;
	}
	const fieldValues: Record<string, string | boolean> = {};
	for (const [key, value] of Object.entries(entry.fieldValues ?? {})) {
		fieldValues[key] = typeof value === 'boolean' ? value : String(value);
	}
	return {
		categoryId: entry.categoryId,
		catalogItemId: catalogLabel ? entry.catalogItemId : null,
		catalogLabel,
		title: entry.title,
		creator: entry.creator ?? '',
		year: entry.year === null ? '' : String(entry.year),
		coverUrl: entry.coverUrl ?? '',
		experiencedAt: entry.experiencedAt,
		rating: entry.rating,
		notes: entry.notes ?? '',
		fieldValues,
		extraFields: entry.extraFields ?? [],
		visibility: entry.visibility
	};
}

/** Flash-Meldung mit XP-Gewinn und ggf. Level-Up. */
export function flashXp(
	cookies: Cookies,
	url: URL,
	message: string,
	xpBefore: number,
	xpAfter: number
) {
	const gained = xpAfter - xpBefore;
	const levelBefore = levelForXp(xpBefore);
	const levelAfter = levelForXp(xpAfter);
	setFlash(cookies, url, {
		message,
		tone: 'success',
		xp: gained > 0 ? gained : undefined,
		levelUp: levelAfter > levelBefore ? { level: levelAfter, title: levelTitle(levelAfter) } : undefined
	});
}
