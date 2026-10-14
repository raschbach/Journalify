import { describe, expect, it } from 'vitest';
import { computeStats } from './stats';

describe('computeStats', () => {
	it('liefert Nullwerte ohne Einträge', () => {
		expect(computeStats([])).toEqual({
			total: 0,
			perCategory: [],
			averageRating: null,
			ratedCount: 0,
			withNotes: 0,
			notesShare: 0
		});
	});

	it('zählt Kategorien, Bewertungen und Notizen', () => {
		const s = computeStats([
			{ categoryId: 'film', rating: 4, notes: 'Toll' },
			{ categoryId: 'film', rating: 2, notes: '   ' },
			{ categoryId: 'book', rating: null, notes: null },
			{ categoryId: 'film', rating: null, notes: 'Hmm' }
		]);
		expect(s.total).toBe(4);
		expect(s.perCategory).toEqual([
			{ categoryId: 'film', count: 3 },
			{ categoryId: 'book', count: 1 }
		]);
		expect(s.averageRating).toBe(3);
		expect(s.withNotes).toBe(2);
		expect(s.notesShare).toBe(0.5);
	});
});
