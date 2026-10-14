import { randomUUID } from 'node:crypto';
import { error, fail, redirect } from '@sveltejs/kit';
import { isValidISODate, todayISO } from '#lib/dates.ts';
import { getCategoryForUser, getUserXp, requireUser } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { entries } from '#lib/server/db/schema.ts';
import { parseEntryForm } from '#lib/server/entry-form.ts';
import { emptyFormValues, flashXp, getFormCategories } from '#lib/server/entries.ts';
import { formString } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const categories = await getFormCategories(user.id);
	const today = todayISO();
	const dateParam = url.searchParams.get('date');
	const date = dateParam && isValidISODate(dateParam) ? dateParam : today;

	const slug = url.searchParams.get('category');
	const selected = slug ? (categories.find((c) => c.slug === slug) ?? null) : null;

	return {
		categories,
		selected: selected?.id ?? null,
		initial: emptyFormValues(selected?.id ?? '', date),
		date,
		today
	};
};

export const actions: Actions = {
	default: async ({ locals, request, cookies, url }) => {
		const user = requireUser(locals);
		const data = await request.formData();

		const category = await getCategoryForUser(user.id, { id: formString(data, 'categoryId') });
		if (!category) error(400, 'Unbekannte Kategorie');

		const parsed = await parseEntryForm(data, category);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const xpBefore = await getUserXp(user.id);
		const id = randomUUID();
		const now = new Date();
		await db
			.insert(entries)
			.values({ id, userId: user.id, ...parsed.input, createdAt: now, updatedAt: now });
		const xpAfter = await getUserXp(user.id);

		flashXp(cookies, url, 'Eintrag gespeichert', xpBefore, xpAfter);
		redirect(303, `/entries/${id}`);
	}
};
