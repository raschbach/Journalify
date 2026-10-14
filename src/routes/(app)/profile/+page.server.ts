import { requireUser } from '#lib/server/data.ts';
import { loadProfileStats } from '#lib/server/profile.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	return loadProfileStats(user.id, false);
};
