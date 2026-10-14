// Filter- und Sortierlogik für „Stöbern“ (rein, testbar).

import { normalizeForSearch } from './catalog-search';
import type { EntrySummary, ExtraField, FieldValues } from './types';

export const SORT_FIELDS = ['date', 'rating', 'title', 'added'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = 'asc' | 'desc';

export const SORT_LABELS: Record<SortField, string> = {
	date: 'Datum',
	rating: 'Bewertung',
	title: 'Name',
	added: 'Zuletzt hinzugefügt'
};

/** Sinnvolle Standard-Richtung je Sortierfeld */
export const DEFAULT_DIR: Record<SortField, SortDir> = {
	date: 'desc',
	rating: 'desc',
	title: 'asc',
	added: 'desc'
};

export interface BrowseParams {
	category: string | null;
	sort: SortField;
	dir: SortDir;
	q: string;
	minRating: number | null;
	year: number | null;
	withNotes: boolean;
	view: 'list' | 'grid';
}

export function parseBrowseParams(search: URLSearchParams): BrowseParams {
	const sortRaw = search.get('sort');
	const sort = (SORT_FIELDS as readonly string[]).includes(sortRaw ?? '')
		? (sortRaw as SortField)
		: 'date';
	const dirRaw = search.get('dir');
	const dir: SortDir = dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : DEFAULT_DIR[sort];
	const min = Number(search.get('min'));
	const year = Number(search.get('year'));
	return {
		category: search.get('cat') || null,
		sort,
		dir,
		q: (search.get('q') ?? '').slice(0, 100),
		minRating: Number.isInteger(min) && min >= 1 && min <= 5 ? min : null,
		year: Number.isInteger(year) && year >= 1000 && year <= 9999 ? year : null,
		withNotes: search.get('notes') === '1',
		view: search.get('view') === 'grid' ? 'grid' : 'list'
	};
}

/** Baut den Query-String – Standardwerte werden weggelassen. */
export function browseQuery(p: BrowseParams): string {
	const s = new URLSearchParams();
	if (p.category) s.set('cat', p.category);
	if (p.q.trim()) s.set('q', p.q.trim());
	if (p.sort !== 'date') s.set('sort', p.sort);
	if (p.dir !== DEFAULT_DIR[p.sort]) s.set('dir', p.dir);
	if (p.minRating) s.set('min', String(p.minRating));
	if (p.year) s.set('year', String(p.year));
	if (p.withNotes) s.set('notes', '1');
	if (p.view === 'grid') s.set('view', 'grid');
	const query = s.toString();
	return query ? `?${query}` : '';
}

export interface Searchable extends EntrySummary {
	fieldValues: FieldValues;
	extraFields: ExtraField[];
}

function haystack(e: Searchable): string {
	return normalizeForSearch(
		[
			e.title,
			e.creator ?? '',
			e.year ?? '',
			e.notes ?? '',
			...Object.values(e.fieldValues ?? {}).map(String),
			...(e.extraFields ?? []).flatMap((f) => [f.label, f.value])
		].join(' \u0000 ')
	);
}

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

export function filterAndSort<T extends Searchable>(list: T[], p: BrowseParams): T[] {
	const terms = normalizeForSearch(p.q).split(/\s+/).filter(Boolean);
	const filtered = list.filter((e) => {
		if (p.minRating && (e.rating ?? 0) < p.minRating) return false;
		if (p.year && Number(e.experiencedAt.slice(0, 4)) !== p.year) return false;
		if (p.withNotes && !e.notes?.trim()) return false;
		if (terms.length) {
			const text = haystack(e);
			if (!terms.every((t) => text.includes(t))) return false;
		}
		return true;
	});

	const sign = p.dir === 'asc' ? 1 : -1;
	const byDate = (a: T, b: T) =>
		a.experiencedAt.localeCompare(b.experiencedAt) || a.createdAt - b.createdAt;

	return filtered.sort((a, b) => {
		switch (p.sort) {
			case 'rating': {
				// Einträge ohne Bewertung stehen immer am Ende
				if (a.rating === null && b.rating === null) return -byDate(a, b);
				if (a.rating === null) return 1;
				if (b.rating === null) return -1;
				return sign * (a.rating - b.rating) || -byDate(a, b);
			}
			case 'title':
				return sign * collator.compare(a.title, b.title) || -byDate(a, b);
			case 'added':
				return sign * (a.createdAt - b.createdAt);
			default:
				return sign * byDate(a, b);
		}
	});
}
