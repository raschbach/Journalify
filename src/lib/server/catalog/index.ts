import { eq } from 'drizzle-orm';
import { rankCatalog } from '../../catalog-search';
import type { CatalogResult } from '../../types';
import type { Db } from '../db/client';
import { catalogItems } from '../db/schema';

/**
 * Schnittstelle für Titel-Bibliotheken. v1 nutzt nur die lokale Seed-Bibliothek;
 * später können hier z. B. TMDB, Open Library oder MusicBrainz angebunden werden.
 */
export interface CatalogProvider {
	search(category: { id: string; slug: string }, query: string, limit?: number): Promise<CatalogResult[]>;
}

export class LocalCatalogProvider implements CatalogProvider {
	constructor(private readonly db: Db) {}

	async search(category: { id: string }, query: string, limit = 8): Promise<CatalogResult[]> {
		if (!query.trim()) return [];
		const items = await this.db
			.select({
				id: catalogItems.id,
				title: catalogItems.title,
				creator: catalogItems.creator,
				year: catalogItems.year,
				metadata: catalogItems.metadata
			})
			.from(catalogItems)
			.where(eq(catalogItems.categoryId, category.id));
		return rankCatalog(items, query, limit);
	}
}
