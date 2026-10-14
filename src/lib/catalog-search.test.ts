import { describe, expect, it } from 'vitest';
import { normalizeForSearch, rankCatalog } from './catalog-search';

const items = [
	{ title: 'Die fabelhafte Welt der Amélie', creator: 'Jean-Pierre Jeunet' },
	{ title: 'Inception', creator: 'Christopher Nolan' },
	{ title: 'Oppenheimer', creator: 'Christopher Nolan' },
	{ title: 'Der Pate', creator: 'Francis Ford Coppola' },
	{ title: 'Das Parfum', creator: 'Patrick Süskind' }
];

describe('Titelsuche', () => {
	it('normalisiert Akzente und Groß-/Kleinschreibung', () => {
		expect(normalizeForSearch('  Amélie Süß ')).toBe('amelie suss');
	});

	it('findet Titel unabhängig von Akzenten', () => {
		expect(rankCatalog(items, 'amelie').map((i) => i.title)).toEqual([
			'Die fabelhafte Welt der Amélie'
		]);
	});

	it('bevorzugt Titelanfänge vor Ersteller:innen', () => {
		expect(rankCatalog(items, 'pa').map((i) => i.title)).toEqual(['Das Parfum', 'Der Pate']);
		expect(rankCatalog(items, 'opp').map((i) => i.title)).toEqual(['Oppenheimer', 'Der Pate']);
	});

	it('findet über Ersteller:in', () => {
		expect(rankCatalog(items, 'nolan').map((i) => i.title)).toEqual(['Inception', 'Oppenheimer']);
		expect(rankCatalog(items, 'suskind').map((i) => i.title)).toEqual(['Das Parfum']);
	});

	it('liefert nichts für leere Anfragen', () => {
		expect(rankCatalog(items, '   ')).toEqual([]);
	});
});
