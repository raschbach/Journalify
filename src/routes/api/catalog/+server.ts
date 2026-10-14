import { error, json } from '@sveltejs/kit';
import { LocalCatalogProvider, type CatalogProvider } from '#lib/server/catalog/index.ts';
import { getCategoryForUser, requireUser } from '#lib/server/data.ts';
import { db } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

const provider: CatalogProvider = new LocalCatalogProvider(db);

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const categoryId = url.searchParams.get('category') ?? '';
	const query = (url.searchParams.get('q') ?? '').slice(0, 100);

	const category = await getCategoryForUser(user.id, { id: categoryId });
	if (!category) error(404, 'Kategorie nicht gefunden');

	const results = await provider.search(category, query);
	return json(results, { headers: { 'cache-control': 'private, max-age=60' } });
};
