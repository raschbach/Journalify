import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, count, eq } from 'drizzle-orm';
import {
	CATEGORY_COLORS,
	deleteCategory,
	getOwnCategory,
	parseCategoryForm,
	updateCategory
} from '#lib/server/categories.ts';
import { requireUser, setFlash } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { categoryFields, entries } from '#lib/server/db/schema.ts';
import type { EditorField } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

async function entryCount(userId: string, categoryId: string) {
	const [row] = await db
		.select({ n: count() })
		.from(entries)
		.where(and(eq(entries.categoryId, categoryId), eq(entries.userId, userId)));
	return row?.n ?? 0;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const category = await getOwnCategory(user.id, params.id);
	if (!category) error(404, 'Kategorie nicht gefunden');

	const fields = await db
		.select()
		.from(categoryFields)
		.where(eq(categoryFields.categoryId, category.id))
		.orderBy(asc(categoryFields.sortOrder));

	const colors = CATEGORY_COLORS.includes(category.color)
		? CATEGORY_COLORS
		: [category.color, ...CATEGORY_COLORS];

	return {
		category: { id: category.id, name: category.name },
		initial: {
			name: category.name,
			emoji: category.emoji,
			color: category.color,
			fields: fields.map(
				(f): EditorField => ({
					id: f.id,
					uid: f.id,
					label: f.label,
					type: f.type,
					options: (f.options ?? []).join(', '),
					placeholder: f.placeholder ?? ''
				})
			)
		},
		colors,
		entryCount: await entryCount(user.id, category.id)
	};
};

export const actions: Actions = {
	save: async ({ locals, params, request, cookies, url }) => {
		const user = requireUser(locals);
		const category = await getOwnCategory(user.id, params.id);
		if (!category) error(404, 'Kategorie nicht gefunden');
		const parsed = parseCategoryForm(await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });
		await updateCategory(user.id, category.id, parsed.input);
		setFlash(cookies, url, { message: `Kategorie „${parsed.input.name}“ gespeichert` });
		redirect(303, '/categories');
	},

	delete: async ({ locals, params, request, cookies, url }) => {
		const user = requireUser(locals);
		const category = await getOwnCategory(user.id, params.id);
		if (!category) error(404, 'Kategorie nicht gefunden');
		const n = await entryCount(user.id, category.id);
		const confirmed = (await request.formData()).get('confirmEntries') === 'on';
		if (n > 0 && !confirmed) {
			return fail(400, { deleteError: 'Bitte bestätige, dass auch die Einträge gelöscht werden sollen.' });
		}
		await deleteCategory(user.id, category.id);
		setFlash(cookies, url, {
			message: n ? `„${category.name}“ und ${n} ${n === 1 ? 'Eintrag' : 'Einträge'} gelöscht` : `„${category.name}“ gelöscht`,
			tone: 'info'
		});
		redirect(303, '/categories');
	}
};
