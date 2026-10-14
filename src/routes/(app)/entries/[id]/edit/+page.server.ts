import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { todayISO } from '#lib/dates.ts';
import { getCategoryForUser, getOwnEntry, getUserXp, requireUser } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { entries } from '#lib/server/db/schema.ts';
import { parseEntryForm } from '#lib/server/entry-form.ts';
import { entryToFormValues, flashXp, getFormCategories } from '#lib/server/entries.ts';
import { formString } from '#lib/server/validation.ts';
import { entryXp } from '#lib/xp.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const entry = await getOwnEntry(user.id, params.id);
	const [categories, initial] = await Promise.all([
		getFormCategories(user.id),
		entryToFormValues(entry)
	]);
	return {
		entryId: entry.id,
		title: entry.title,
		categories,
		initial,
		originalXp: entryXp(entry).total,
		today: todayISO()
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request, cookies, url }) => {
		const user = requireUser(locals);
		const entry = await getOwnEntry(user.id, params.id);
		const data = await request.formData();

		const category = await getCategoryForUser(user.id, { id: formString(data, 'categoryId') });
		if (!category) error(400, 'Unbekannte Kategorie');

		const parsed = await parseEntryForm(data, category);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const xpBefore = await getUserXp(user.id);
		await db
			.update(entries)
			.set({ ...parsed.input, updatedAt: new Date() })
			.where(and(eq(entries.id, entry.id), eq(entries.userId, user.id)));
		const xpAfter = await getUserXp(user.id);

		flashXp(cookies, url, 'Änderungen gespeichert', xpBefore, xpAfter);
		redirect(303, `/entries/${entry.id}`);
	}
};
