import { fail } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';
import { getFriendship, requireUser, setFlash } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import { friendships, users } from '#lib/server/db/schema.ts';
import { formString } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

const otherUser = { id: users.id, username: users.username, displayName: users.displayName };

export const load: PageServerLoad = async ({ locals }) => {
	const me = requireUser(locals);
	const rows = await db
		.select({
			requesterId: friendships.requesterId,
			addresseeId: friendships.addresseeId,
			status: friendships.status,
			createdAt: friendships.createdAt,
			other: otherUser
		})
		.from(friendships)
		.innerJoin(
			users,
			or(
				and(eq(friendships.requesterId, me.id), eq(users.id, friendships.addresseeId)),
				and(eq(friendships.addresseeId, me.id), eq(users.id, friendships.requesterId))
			)
		)
		.where(or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id)));

	const byName = (a: { other: { displayName: string } }, b: { other: { displayName: string } }) =>
		a.other.displayName.localeCompare(b.other.displayName, 'de');

	return {
		friends: rows.filter((r) => r.status === 'accepted').sort(byName).map((r) => r.other),
		incoming: rows
			.filter((r) => r.status === 'pending' && r.addresseeId === me.id)
			.sort(byName)
			.map((r) => r.other),
		outgoing: rows
			.filter((r) => r.status === 'pending' && r.requesterId === me.id)
			.sort(byName)
			.map((r) => r.other)
	};
};

async function findUser(username: string) {
	const [user] = await db
		.select(otherUser)
		.from(users)
		.where(eq(users.username, username.trim().toLowerCase().replace(/^@/, '')))
		.limit(1);
	return user ?? null;
}

export const actions: Actions = {
	add: async ({ locals, request, cookies, url }) => {
		const me = requireUser(locals);
		const username = formString(await request.formData(), 'username').trim();
		if (!username) return fail(400, { username, addError: 'Bitte gib einen Benutzernamen ein.' });

		const other = await findUser(username);
		if (!other) {
			return fail(400, {
				username,
				addError: `Es gibt niemanden mit dem Benutzernamen „${username}“. Achte auf die genaue Schreibweise.`
			});
		}
		if (other.id === me.id) return fail(400, { username, addError: 'Das bist du selbst. 🙂' });

		const existing = await getFriendship(me.id, other.id);
		if (existing?.status === 'accepted') {
			return fail(400, { username, addError: `Ihr seid schon befreundet.` });
		}
		if (existing?.requesterId === me.id) {
			return fail(400, { username, addError: `Du hast ${other.displayName} schon eine Anfrage geschickt.` });
		}
		if (existing) {
			// Die andere Person hat bereits angefragt → direkt annehmen
			await db
				.update(friendships)
				.set({ status: 'accepted' })
				.where(and(eq(friendships.requesterId, other.id), eq(friendships.addresseeId, me.id)));
			setFlash(cookies, url, { message: `Du und ${other.displayName} seid jetzt befreundet 🎉` });
			return { added: true };
		}

		await db.insert(friendships).values({ requesterId: me.id, addresseeId: other.id, status: 'pending' });
		setFlash(cookies, url, { message: `Anfrage an ${other.displayName} gesendet` });
		return { added: true };
	},

	accept: async ({ locals, request, cookies, url }) => {
		const me = requireUser(locals);
		const other = await findUser(formString(await request.formData(), 'username'));
		if (!other) return fail(404);
		const result = await db
			.update(friendships)
			.set({ status: 'accepted' })
			.where(
				and(
					eq(friendships.requesterId, other.id),
					eq(friendships.addresseeId, me.id),
					eq(friendships.status, 'pending')
				)
			);
		if (result.rowsAffected) setFlash(cookies, url, { message: `Du und ${other.displayName} seid jetzt befreundet 🎉` });
	},

	decline: async ({ locals, request, cookies, url }) => {
		const me = requireUser(locals);
		const other = await findUser(formString(await request.formData(), 'username'));
		if (!other) return fail(404);
		await db
			.delete(friendships)
			.where(
				and(
					eq(friendships.requesterId, other.id),
					eq(friendships.addresseeId, me.id),
					eq(friendships.status, 'pending')
				)
			);
		setFlash(cookies, url, { message: 'Anfrage abgelehnt', tone: 'info' });
	},

	withdraw: async ({ locals, request, cookies, url }) => {
		const me = requireUser(locals);
		const other = await findUser(formString(await request.formData(), 'username'));
		if (!other) return fail(404);
		await db
			.delete(friendships)
			.where(
				and(
					eq(friendships.requesterId, me.id),
					eq(friendships.addresseeId, other.id),
					eq(friendships.status, 'pending')
				)
			);
		setFlash(cookies, url, { message: 'Anfrage zurückgezogen', tone: 'info' });
	},

	remove: async ({ locals, request, cookies, url }) => {
		const me = requireUser(locals);
		const other = await findUser(formString(await request.formData(), 'username'));
		if (!other) return fail(404);
		await db
			.delete(friendships)
			.where(
				and(
					eq(friendships.status, 'accepted'),
					or(
						and(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, other.id)),
						and(eq(friendships.requesterId, other.id), eq(friendships.addresseeId, me.id))
					)
				)
			);
		setFlash(cookies, url, { message: `${other.displayName} ist nicht mehr in deiner Freundesliste`, tone: 'info' });
	}
};
