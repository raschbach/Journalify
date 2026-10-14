import { describe, expect, it } from 'vitest';
import { browseQuery, filterAndSort, parseBrowseParams, type Searchable } from './browse';

const category = { id: 'film', slug: 'film', name: 'Film', emoji: '🎬', color: '#000', ownerId: null, creatorLabel: null, yearLabel: null };
let n = 0;
function e(partial: Partial<Searchable>): Searchable {
	n++;
	return {
		id: `e${n}`,
		title: `Titel ${n}`,
		creator: null,
		year: null,
		coverUrl: null,
		experiencedAt: '2026-01-01',
		rating: null,
		notes: null,
		visibility: 'friends',
		createdAt: n,
		category,
		fieldValues: {},
		extraFields: [],
		...partial
	};
}

describe('Stöbern', () => {
	it('liest und schreibt URL-Parameter ohne Standardwerte', () => {
		const p = parseBrowseParams(new URLSearchParams('sort=title&min=4&notes=1&q=%20nolan%20'));
		expect(p).toMatchObject({ sort: 'title', dir: 'asc', minRating: 4, withNotes: true, q: ' nolan ' });
		expect(browseQuery(p)).toBe('?q=nolan&sort=title&min=4&notes=1');
		expect(browseQuery(parseBrowseParams(new URLSearchParams('')))).toBe('');
		expect(parseBrowseParams(new URLSearchParams('sort=evil&min=9')).sort).toBe('date');
	});

	it('sucht in Titel, Notizen und Feldern – akzentunabhängig', () => {
		const list = [
			e({ title: 'Amélie' }),
			e({ notes: 'Mit Popcorn im Kino' }),
			e({ fieldValues: { venue: 'Yorck Kino' } }),
			e({ extraFields: [{ label: 'Snack', value: 'Nachos' }] })
		];
		const search = (q: string) =>
			filterAndSort(list, { ...parseBrowseParams(new URLSearchParams()), q }).map((x) => x.id);
		expect(search('amelie')).toEqual([list[0].id]);
		expect(search('kino')).toHaveLength(2);
		expect(search('nachos')).toEqual([list[3].id]);
		expect(search('kino popcorn')).toEqual([list[1].id]);
	});

	it('filtert nach Bewertung, Jahr und Notiz', () => {
		const list = [
			e({ rating: 5, experiencedAt: '2025-03-01', notes: 'gut' }),
			e({ rating: 3, experiencedAt: '2026-03-01' }),
			e({ rating: null, experiencedAt: '2026-04-01', notes: '  ' })
		];
		const base = parseBrowseParams(new URLSearchParams());
		expect(filterAndSort(list, { ...base, minRating: 4 }).map((x) => x.id)).toEqual([list[0].id]);
		expect(filterAndSort(list, { ...base, year: 2026 })).toHaveLength(2);
		expect(filterAndSort(list, { ...base, withNotes: true }).map((x) => x.id)).toEqual([list[0].id]);
	});

	it('sortiert nach Bewertung mit unbewerteten Einträgen am Ende', () => {
		const list = [e({ rating: null }), e({ rating: 2 }), e({ rating: 5 })];
		const base = parseBrowseParams(new URLSearchParams('sort=rating'));
		expect(filterAndSort([...list], base).map((x) => x.rating)).toEqual([5, 2, null]);
		expect(filterAndSort([...list], { ...base, dir: 'asc' }).map((x) => x.rating)).toEqual([2, 5, null]);
	});

	it('sortiert Namen deutsch', () => {
		const list = [e({ title: 'Zebra' }), e({ title: 'Äpfel' }), e({ title: 'apfel 10' }), e({ title: 'apfel 9' })];
		const p = parseBrowseParams(new URLSearchParams('sort=title'));
		expect(filterAndSort(list, p).map((x) => x.title)).toEqual(['Äpfel', 'apfel 9', 'apfel 10', 'Zebra']);
	});
});
