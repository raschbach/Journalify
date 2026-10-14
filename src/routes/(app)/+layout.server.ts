import { countIncomingRequests, getUserLevel, requireUser } from '#lib/server/data.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [incomingRequests, level] = await Promise.all([
		countIncomingRequests(user.id),
		getUserLevel(user.id)
	]);
	return { me: user, incomingRequests, level };
};
