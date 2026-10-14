import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { todayISO } from '#lib/dates.ts';
import {
	getFields,
	getOwnEntry,
	getUserXp,
	getViewableEntry,
	requireUser,
	setFlash,
	categoryColumns
} from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { categories, entries } from '#lib/server/db/schema.ts';
import { flashXp } from '#lib/server/entries.ts';
import { formString } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const { entry, author, isOwner } = await getViewableEntry(user.id, params.id);

	// Die Kategorie kann einer Freundin gehören – sichtbar ist sie über den Eintrag.
	const [category] = await db
		.select(categoryColumns)
		.from(categories)
		.where(eq(categories.id, entry.categoryId))
		.limit(1);
	if (!category) error(404, 'Eintrag nicht gefunden');
	const fields = (await getFields([category.id])).get(category.id) ?? [];

	return {
		entry: {
			id: entry.id,
			title: entry.title,
			creator: entry.creator,
			year: entry.year,
			coverUrl: entry.coverUrl,
			experiencedAt: entry.experiencedAt,
			rating: entry.rating,
			notes: entry.notes,
			fieldValues: entry.fieldValues ?? {},
			extraFields: entry.extraFields ?? [],
			visibility: entry.visibility,
			createdAt: entry.createdAt.getTime(),
			updatedAt: entry.updatedAt.getTime()
		},
		category: { ...category, fields },
		author,
		isOwner,
		today: todayISO()
	};
};

export const actions: Actions = {
	addNote: async ({ locals, params, request, cookies, url }) => {
		const user = requireUser(locals);
		const entry = await getOwnEntry(user.id, params.id);
		const data = await request.formData();
		const notes = formString(data, 'notes').replace(/\r\n/g, '\n').trim();

		if (!notes) return fail(400, { noteError: 'Schreib ein paar Worte – jede Erinnerung zählt.' });
		if (notes.length > 20000) return fail(400, { noteError: 'Die Notiz ist zu lang.' });

		const xpBefore = await getUserXp(user.id);
		await db
			.update(entries)
			.set({ notes, updatedAt: new Date() })
			.where(and(eq(entries.id, entry.id), eq(entries.userId, user.id)));
		const xpAfter = await getUserXp(user.id);

		flashXp(cookies, url, 'Notiz gespeichert', xpBefore, xpAfter);
		return { noteSaved: true };
	},

	delete: async ({ locals, params, cookies, url }) => {
		const user = requireUser(locals);
		const entry = await getOwnEntry(user.id, params.id);
		await db.delete(entries).where(and(eq(entries.id, entry.id), eq(entries.userId, user.id)));
		setFlash(cookies, url, { message: `„${entry.title}“ wurde gelöscht`, tone: 'info' });
		redirect(303, '/');
	}
};
