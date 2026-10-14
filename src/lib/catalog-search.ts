// Ranking für die Titelsuche (Autovervollständigung). Akzent- und
// groß/klein-unabhängig: „amelie“ findet „Amélie“.

export function normalizeForSearch(value: string): string {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/ß/g, 'ss')
		.toLowerCase()
		.trim();
}

interface Searchable {
	title: string;
	creator: string | null;
}

/** Bewertet einen Treffer; 0 = kein Treffer, höher = besser. */
export function matchScore(item: Searchable, query: string): number {
	const q = normalizeForSearch(query);
	if (!q) return 0;
	const title = normalizeForSearch(item.title);
	const creator = normalizeForSearch(item.creator ?? '');

	if (title === q) return 100;
	if (title.startsWith(q)) return 80;
	if (title.split(/[\s\-:,.!?'"()]+/).some((word) => word.startsWith(q))) return 60;
	if (title.includes(q)) return 40;
	if (creator.split(/[\s\-&,.()]+/).some((word) => word.startsWith(q))) return 30;
	if (creator.includes(q)) return 20;
	return 0;
}

export function rankCatalog<T extends Searchable>(items: T[], query: string, limit = 8): T[] {
	return items
		.map((item) => ({ item, score: matchScore(item, query) }))
		.filter((r) => r.score > 0)
		.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'de'))
		.slice(0, limit)
		.map((r) => r.item);
}
