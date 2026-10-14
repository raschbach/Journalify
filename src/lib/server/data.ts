// Zentrale Datenzugriffe inkl. Berechtigungsprüfungen.

import { error, redirect, type Cookies } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import type {
	CategoryInfo,
	CategoryWithFields,
	EntrySummary,
	FieldDef,
	Flash
} from '#lib/types.ts';
import { levelProgress, totalXp } from '#lib/xp.ts';
import { db } from './db';
import { categories, categoryFields, entries, friendships, users, type Entry } from './db/schema';
import type { SessionUser } from './auth/session';

export function requireUser(locals: App.Locals): SessionUser {
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------

export const categoryColumns = {
	id: categories.id,
	slug: categories.slug,
	name: categories.name,
	emoji: categories.emoji,
	color: categories.color,
	ownerId: categories.ownerId,
	creatorLabel: categories.creatorLabel,
	yearLabel: categories.yearLabel
};

/** Bedingung: eingebaute Kategorie oder eigene Kategorie des Nutzers */
function accessibleCategory(userId: string): SQL {
	return or(isNull(categories.ownerId), eq(categories.ownerId, userId))!;
}

/** Alle Kategorien, die der Nutzer verwenden darf (eingebaute zuerst). */
export async function getCategories(userId: string): Promise<CategoryInfo[]> {
	return db
		.select(categoryColumns)
		.from(categories)
		.where(accessibleCategory(userId))
		.orderBy(
			sql`${categories.ownerId} IS NOT NULL`,
			asc(categories.sortOrder),
			asc(categories.name)
		);
}

export async function getFields(categoryIds: string[]): Promise<Map<string, FieldDef[]>> {
	const map = new Map<string, FieldDef[]>();
	if (!categoryIds.length) return map;
	const rows = await db
		.select()
		.from(categoryFields)
		.where(inArray(categoryFields.categoryId, categoryIds))
		.orderBy(asc(categoryFields.sortOrder));
	for (const row of rows) {
		const list = map.get(row.categoryId) ?? [];
		list.push({
			id: row.id,
			key: row.key,
			label: row.label,
			type: row.type,
			options: row.options ?? null,
			placeholder: row.placeholder ?? null,
			sortOrder: row.sortOrder
		});
		map.set(row.categoryId, list);
	}
	return map;
}

export async function getCategoriesWithFields(userId: string): Promise<CategoryWithFields[]> {
	const cats = await getCategories(userId);
	const fields = await getFields(cats.map((c) => c.id));
	return cats.map((c) => ({ ...c, fields: fields.get(c.id) ?? [] }));
}

export async function getCategoryForUser(
	userId: string,
	where: { id?: string; slug?: string }
): Promise<CategoryWithFields | null> {
	const condition = where.id ? eq(categories.id, where.id) : eq(categories.slug, where.slug ?? '');
	const [cat] = await db
		.select(categoryColumns)
		.from(categories)
		.where(and(condition, accessibleCategory(userId)))
		.orderBy(sql`${categories.ownerId} IS NOT NULL`)
		.limit(1);
	if (!cat) return null;
	const fields = await getFields([cat.id]);
	return { ...cat, fields: fields.get(cat.id) ?? [] };
}

/** Kategorien, zuletzt genutzte zuerst. */
export async function getCategoriesByRecentUse(userId: string): Promise<CategoryWithFields[]> {
	const [cats, usage] = await Promise.all([
		getCategoriesWithFields(userId),
		db
			.select({ categoryId: entries.categoryId, last: sql<number>`max(${entries.createdAt})` })
			.from(entries)
			.where(eq(entries.userId, userId))
			.groupBy(entries.categoryId)
	]);
	const lastUsed = new Map(usage.map((u) => [u.categoryId, Number(u.last)]));
	const original = new Map(cats.map((c, i) => [c.id, i]));
	return [...cats].sort((a, b) => {
		const la = lastUsed.get(a.id) ?? 0;
		const lb = lastUsed.get(b.id) ?? 0;
		if (la !== lb) return lb - la;
		return (original.get(a.id) ?? 0) - (original.get(b.id) ?? 0);
	});
}

// ---------------------------------------------------------------------------
// Freundschaften
// ---------------------------------------------------------------------------

export async function getFriendIds(userId: string): Promise<string[]> {
	const rows = await db
		.select({ requesterId: friendships.requesterId, addresseeId: friendships.addresseeId })
		.from(friendships)
		.where(
			and(
				eq(friendships.status, 'accepted'),
				or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
			)
		);
	return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/** Beziehung zwischen zwei Nutzer:innen, unabhängig von der Richtung. */
export async function getFriendship(a: string, b: string) {
	const [row] = await db
		.select()
		.from(friendships)
		.where(
			or(
				and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
				and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a))
			)
		)
		.limit(1);
	return row ?? null;
}

export async function areFriends(a: string, b: string): Promise<boolean> {
	if (a === b) return false;
	const row = await getFriendship(a, b);
	return row?.status === 'accepted';
}

export async function countIncomingRequests(userId: string): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(friendships)
		.where(and(eq(friendships.addresseeId, userId), eq(friendships.status, 'pending')));
	return Number(row?.count ?? 0);
}

// ---------------------------------------------------------------------------
// Einträge
// ---------------------------------------------------------------------------

export const summaryColumns = {
	id: entries.id,
	title: entries.title,
	creator: entries.creator,
	year: entries.year,
	coverUrl: entries.coverUrl,
	experiencedAt: entries.experiencedAt,
	rating: entries.rating,
	notes: entries.notes,
	visibility: entries.visibility,
	createdAt: entries.createdAt,
	categoryId: categories.id,
	categorySlug: categories.slug,
	categoryName: categories.name,
	categoryEmoji: categories.emoji,
	categoryColor: categories.color,
	categoryOwnerId: categories.ownerId,
	categoryCreatorLabel: categories.creatorLabel,
	categoryYearLabel: categories.yearLabel,
	authorUsername: users.username,
	authorDisplayName: users.displayName
};

type SummaryRow = Awaited<ReturnType<typeof selectSummaries>>[number];

export function toSummary(row: SummaryRow, withAuthor = false): EntrySummary {
	return {
		id: row.id,
		title: row.title,
		creator: row.creator,
		year: row.year,
		coverUrl: row.coverUrl,
		experiencedAt: row.experiencedAt,
		rating: row.rating,
		notes: row.notes,
		visibility: row.visibility,
		createdAt: row.createdAt.getTime(),
		category: {
			id: row.categoryId,
			slug: row.categorySlug,
			name: row.categoryName,
			emoji: row.categoryEmoji,
			color: row.categoryColor,
			ownerId: row.categoryOwnerId,
			creatorLabel: row.categoryCreatorLabel,
			yearLabel: row.categoryYearLabel
		},
		author: withAuthor
			? { username: row.authorUsername, displayName: row.authorDisplayName }
			: undefined
	};
}

/** Basis-Abfrage für Eintragslisten inkl. Kategorie und Autor:in. */
export function selectSummaries() {
	return db
		.select(summaryColumns)
		.from(entries)
		.innerJoin(categories, eq(entries.categoryId, categories.id))
		.innerJoin(users, eq(entries.userId, users.id));
}

export const newestFirst = [desc(entries.experiencedAt), desc(entries.createdAt)];

/**
 * Lädt einen Eintrag, wenn der Nutzer ihn sehen darf: eigene Einträge immer,
 * fremde nur, wenn sie für Freunde freigegeben sind und eine bestätigte
 * Freundschaft besteht. Sonst 404 (ohne zu verraten, dass es ihn gibt).
 */
export async function getViewableEntry(userId: string, entryId: string) {
	const [row] = await db
		.select({
			entry: entries,
			author: { username: users.username, displayName: users.displayName }
		})
		.from(entries)
		.innerJoin(users, eq(entries.userId, users.id))
		.where(eq(entries.id, entryId))
		.limit(1);
	if (!row) error(404, 'Eintrag nicht gefunden');
	const isOwner = row.entry.userId === userId;
	if (!isOwner) {
		const allowed =
			row.entry.visibility === 'friends' && (await areFriends(userId, row.entry.userId));
		if (!allowed) error(404, 'Eintrag nicht gefunden');
	}
	return { entry: row.entry, author: row.author, isOwner };
}

/** Lädt einen eigenen Eintrag zum Bearbeiten/Löschen. */
export async function getOwnEntry(userId: string, entryId: string): Promise<Entry> {
	const [entry] = await db
		.select()
		.from(entries)
		.where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
		.limit(1);
	if (!entry) error(404, 'Eintrag nicht gefunden');
	return entry;
}

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------

export async function getUserXp(userId: string, onlyShared = false): Promise<number> {
	const rows = await db
		.select({ rating: entries.rating, notes: entries.notes })
		.from(entries)
		.where(
			onlyShared
				? and(eq(entries.userId, userId), eq(entries.visibility, 'friends'))
				: eq(entries.userId, userId)
		);
	return totalXp(rows);
}

export async function getUserLevel(userId: string) {
	return levelProgress(await getUserXp(userId));
}

// ---------------------------------------------------------------------------
// Flash-Meldungen (überleben einen Redirect, auch ohne JavaScript)
// ---------------------------------------------------------------------------

const FLASH_COOKIE = 'journalify_flash';

export function setFlash(cookies: Cookies, url: URL, flash: Omit<Flash, 'id'>) {
	const value: Flash = { id: crypto.randomUUID(), ...flash };
	cookies.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify(value)), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60
	});
}

export function takeFlash(cookies: Cookies, url: URL): Flash | null {
	const raw = cookies.get(FLASH_COOKIE);
	if (!raw) return null;
	cookies.delete(FLASH_COOKIE, { path: '/', secure: url.protocol === 'https:' });
	try {
		const parsed = JSON.parse(decodeURIComponent(raw)) as Flash;
		return typeof parsed?.message === 'string' ? parsed : null;
	} catch {
		return null;
	}
}
