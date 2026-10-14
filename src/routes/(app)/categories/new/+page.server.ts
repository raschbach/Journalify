import { fail, redirect } from '@sveltejs/kit';
import { CATEGORY_COLORS, createCategory, parseCategoryForm } from '#lib/server/categories.ts';
import { requireUser, setFlash } from '#lib/server/data.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ colors: CATEGORY_COLORS });

export const actions: Actions = {
	save: async ({ locals, request, cookies, url }) => {
		const user = requireUser(locals);
		const parsed = parseCategoryForm(await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });
		await createCategory(user.id, parsed.input);
		setFlash(cookies, url, { message: `Kategorie „${parsed.input.name}“ angelegt` });
		redirect(303, '/categories');
	}
};
