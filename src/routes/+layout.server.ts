import { takeFlash } from '#lib/server/data.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies, url }) => {
	return {
		user: locals.user,
		flash: takeFlash(cookies, url)
	};
};
