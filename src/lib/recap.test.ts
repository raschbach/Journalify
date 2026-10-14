import { describe, expect, it } from 'vitest';
import {
	buildRecap,
	isCompleted,
	lastCompletedMonth,
	lastCompletedWeek,
	onThisDay,
	shiftPeriod,
	type RecapEntry
} from './recap';

let counter = 0;
function entry(experiencedAt: string, extra: Partial<RecapEntry> = {}): RecapEntry {
	counter++;
	return {
		id: `e${counter}`,
		title: `Eintrag ${counter}`,
		experiencedAt,
		rating: null,
		notes: null,
		categoryId: 'film',
		...extra
	};
}

describe('Zeiträume', () => {
	it('findet die letzte abgeschlossene Woche (Mo–So)', () => {
		expect(lastCompletedWeek('2026-10-14')).toMatchObject({
			start: '2026-10-05',
			end: '2026-10-11'
		});
		// Am Montag ist die Vorwoche gerade abgeschlossen
		expect(lastCompletedWeek('2026-10-12')).toMatchObject({ start: '2026-10-05' });
		// Am Sonntag ist die laufende Woche noch nicht abgeschlossen
		expect(lastCompletedWeek('2026-10-18')).toMatchObject({ start: '2026-10-05' });
	});

	it('findet den letzten abgeschlossenen Monat', () => {
		expect(lastCompletedMonth('2026-10-14')).toMatchObject({
			key: '2026-09',
			start: '2026-09-01',
			end: '2026-09-30'
		});
		expect(lastCompletedMonth('2026-01-01')).toMatchObject({ key: '2025-12' });
	});

	it('blättert vor und zurück', () => {
		const week = lastCompletedWeek('2026-10-14');
		expect(shiftPeriod(week, -1)).toMatchObject({ start: '2026-09-28', end: '2026-10-04' });
		expect(shiftPeriod(week, 1)).toMatchObject({ start: '2026-10-12' });
		const month = lastCompletedMonth('2026-01-15');
		expect(shiftPeriod(month, -1)).toMatchObject({ key: '2025-11' });
	});

	it('erkennt abgeschlossene Zeiträume', () => {
		const week = lastCompletedWeek('2026-10-14');
		expect(isCompleted(week, '2026-10-14')).toBe(true);
		expect(isCompleted(shiftPeriod(week, 1), '2026-10-14')).toBe(false);
	});
});

describe('buildRecap', () => {
	it('liefert leere Werte ohne Einträge', () => {
		const r = buildRecap([]);
		expect(r).toMatchObject({ count: 0, averageRating: null, topRated: null, longestNote: null, xp: 0 });
	});

	it('berechnet Statistiken', () => {
		const a = entry('2026-10-06', { rating: 4, categoryId: 'film', notes: 'Kurz' });
		const b = entry('2026-10-05', { rating: 5, categoryId: 'book', notes: 'x'.repeat(30) });
		const c = entry('2026-10-08', { categoryId: 'film' });
		const r = buildRecap([a, b, c]);

		expect(r.count).toBe(3);
		expect(r.byCategory).toEqual([
			{ categoryId: 'film', count: 2 },
			{ categoryId: 'book', count: 1 }
		]);
		expect(r.averageRating).toBe(4.5);
		expect(r.ratedCount).toBe(2);
		expect(r.topRated?.id).toBe(b.id);
		expect(r.longestNote).toEqual({ entry: b, length: 30 });
		expect(r.xp).toBe(15 + 35 + 10);
		expect(r.entries.map((e) => e.id)).toEqual([b.id, a.id, c.id]);
	});

	it('nimmt bei gleicher Bestbewertung den späteren Eintrag', () => {
		const early = entry('2026-10-01', { rating: 5 });
		const late = entry('2026-10-03', { rating: 5 });
		expect(buildRecap([late, early]).topRated?.id).toBe(late.id);
	});
});

describe('onThisDay', () => {
	it('findet Einträge vom gleichen Kalendertag in früheren Jahren', () => {
		const list = [
			entry('2025-10-14'),
			entry('2023-10-14'),
			entry('2023-10-14'),
			entry('2026-10-14'), // heute – zählt nicht
			entry('2025-10-13')
		];
		const r = onThisDay(list, '2026-10-14');
		expect(r.mode).toBe('day');
		expect(r.groups.map((g) => [g.yearsAgo, g.entries.length])).toEqual([
			[1, 1],
			[3, 2]
		]);
	});

	it('weicht auf dieselbe Kalenderwoche aus', () => {
		// 14.10.2026 liegt in KW 42; 2025 ist KW 42 der 13.–19.10.
		const list = [entry('2025-10-17'), entry('2025-10-20'), entry('2026-10-12')];
		const r = onThisDay(list, '2026-10-14');
		expect(r.mode).toBe('week');
		expect(r.groups).toHaveLength(1);
		expect(r.groups[0].yearsAgo).toBe(1);
		expect(r.groups[0].entries.map((e) => e.experiencedAt)).toEqual(['2025-10-17']);
	});

	it('meldet „none“, wenn nichts passt', () => {
		expect(onThisDay([entry('2025-03-01')], '2026-10-14')).toEqual({ mode: 'none', groups: [] });
	});

	it('zeigt am 28.02. im Nicht-Schaltjahr auch den 29.02.', () => {
		const r = onThisDay([entry('2024-02-29'), entry('2025-02-28')], '2026-02-28');
		expect(r.mode).toBe('day');
		expect(r.groups.map((g) => g.yearsAgo)).toEqual([1, 2]);
	});

	it('zeigt am 28.02. eines Schaltjahres nicht den 29.02.', () => {
		const r = onThisDay([entry('2024-02-29')], '2028-02-28');
		expect(r.mode).not.toBe('day');
	});
});
