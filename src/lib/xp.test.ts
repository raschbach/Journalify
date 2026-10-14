import { describe, expect, it } from 'vitest';
import {
	describeXp,
	entryXp,
	levelForXp,
	levelProgress,
	levelTitle,
	noteLength,
	totalXp,
	xpForLevel
} from './xp';

const text = (n: number) => 'x'.repeat(n);

describe('entryXp', () => {
	it('gibt 10 XP für einen Minimal-Eintrag', () => {
		expect(entryXp({})).toEqual({ entry: 10, rating: 0, note: 0, longNote: 0, total: 10 });
	});

	it('gibt +5 XP für eine Bewertung von 1 bis 5', () => {
		for (const rating of [1, 2, 3, 4, 5]) expect(entryXp({ rating }).total).toBe(15);
	});

	it('ignoriert ungültige Bewertungen', () => {
		expect(entryXp({ rating: 0 }).rating).toBe(0);
		expect(entryXp({ rating: 6 }).rating).toBe(0);
		expect(entryXp({ rating: null }).rating).toBe(0);
		expect(entryXp({ rating: 2.5 }).rating).toBe(0);
	});

	it('gibt Notiz-XP erst ab 20 Zeichen', () => {
		expect(entryXp({ notes: text(19) }).note).toBe(0);
		expect(entryXp({ notes: text(20) }).note).toBe(20);
	});

	it('zählt Leerraum am Rand nicht mit', () => {
		expect(entryXp({ notes: `   ${text(19)}   ` }).note).toBe(0);
	});

	it('zählt Emojis und Umlaute als je ein Zeichen', () => {
		expect(noteLength('ä🎬')).toBe(2);
		expect(entryXp({ notes: '🎭'.repeat(20) }).note).toBe(20);
	});

	it('gibt ab 280 Zeichen zusätzlich 15 XP', () => {
		expect(entryXp({ notes: text(279) }).longNote).toBe(0);
		expect(entryXp({ notes: text(280) })).toEqual({
			entry: 10,
			rating: 0,
			note: 20,
			longNote: 15,
			total: 45
		});
	});

	it('kombiniert alle Bestandteile', () => {
		expect(entryXp({ rating: 4, notes: text(300) }).total).toBe(50);
	});

	it('ist idempotent – mehrfaches Berechnen ergibt dasselbe', () => {
		const input = { rating: 3, notes: text(25) };
		expect(entryXp(input)).toEqual(entryXp(input));
	});
});

describe('totalXp', () => {
	it('summiert über alle Einträge', () => {
		expect(totalXp([])).toBe(0);
		expect(totalXp([{}, { rating: 5 }, { notes: text(20) }])).toBe(10 + 15 + 30);
	});

	it('bildet Bearbeiten und Löschen korrekt ab', () => {
		const entries = [{ rating: null as number | null, notes: '' }, { rating: 4, notes: '' }];
		expect(totalXp(entries)).toBe(25);
		entries[0].notes = text(40); // Notiz nachträglich ergänzt
		expect(totalXp(entries)).toBe(45);
		entries.pop(); // Eintrag gelöscht
		expect(totalXp(entries)).toBe(30);
	});
});

describe('Level', () => {
	it('folgt der Formel ⌊√(XP/50)⌋ + 1', () => {
		expect(levelForXp(0)).toBe(1);
		expect(levelForXp(49)).toBe(1);
		expect(levelForXp(50)).toBe(2);
		expect(levelForXp(199)).toBe(2);
		expect(levelForXp(200)).toBe(3);
		expect(levelForXp(799)).toBe(4);
		expect(levelForXp(800)).toBe(5);
		expect(levelForXp(4049)).toBe(9);
		expect(levelForXp(4050)).toBe(10);
	});

	it('ist konsistent mit xpForLevel für viele Level', () => {
		for (let level = 1; level <= 200; level++) {
			expect(levelForXp(xpForLevel(level))).toBe(level);
			if (level > 1) expect(levelForXp(xpForLevel(level) - 1)).toBe(level - 1);
		}
	});

	it('behandelt negative Werte als 0', () => {
		expect(levelForXp(-10)).toBe(1);
	});

	it('berechnet den Fortschritt zum nächsten Level', () => {
		const p = levelProgress(125);
		expect(p.level).toBe(2);
		expect(p.levelStart).toBe(50);
		expect(p.nextLevelAt).toBe(200);
		expect(p.xpIntoLevel).toBe(75);
		expect(p.xpToNext).toBe(75);
		expect(p.progress).toBeCloseTo(0.5);
	});

	it('hat Level-Titel', () => {
		expect(levelTitle(1)).toBe('Zuschauer:in');
		expect(levelTitle(3)).toBe('Kulturgänger:in');
		expect(levelTitle(8)).toBe('Feuilletonist:in');
		expect(levelTitle(9)).toBe('Feuilletonist:in');
		expect(levelTitle(42)).toBe('Kulturikone');
	});
});

describe('describeXp', () => {
	it('listet nur vergebene Bestandteile', () => {
		expect(describeXp(entryXp({}))).toBe('+10 Eintrag');
		expect(describeXp(entryXp({ rating: 5, notes: text(30) }))).toBe(
			'+10 Eintrag · +5 Bewertung · +20 Notiz'
		);
	});
});
