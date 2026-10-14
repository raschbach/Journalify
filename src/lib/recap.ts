// Rückblicke und „An diesem Tag“ – reine Funktionen über Eintragslisten.

import {
	addDays,
	addMonths,
	isLeapYear,
	isoWeek,
	monthKey,
	monthRange,
	parseISODate,
	startOfWeek
} from './dates';
import { entryXp, noteLength } from './xp';

export interface RecapEntry {
	id: string;
	title: string;
	experiencedAt: string;
	rating: number | null;
	notes: string | null;
	categoryId: string;
}

export type RecapType = 'week' | 'month';

export interface Period {
	type: RecapType;
	/** Wochen: Datum des Montags (YYYY-MM-DD); Monate: YYYY-MM */
	key: string;
	start: string;
	end: string;
}

export function weekPeriod(anyDayInWeek: string): Period {
	const start = startOfWeek(anyDayInWeek);
	return { type: 'week', key: start, start, end: addDays(start, 6) };
}

export function monthPeriod(key: string): Period {
	return { type: 'month', key, ...monthRange(key) };
}

/** Letzte vollständig abgeschlossene Woche (Mo–So) vor dem heutigen Tag. */
export function lastCompletedWeek(today: string): Period {
	return weekPeriod(addDays(startOfWeek(today), -7));
}

/** Letzter vollständig abgeschlossener Kalendermonat. */
export function lastCompletedMonth(today: string): Period {
	return monthPeriod(addMonths(monthKey(today), -1));
}

/** Vorheriger bzw. nächster Zeitraum gleichen Typs. */
export function shiftPeriod(period: Period, steps: number): Period {
	return period.type === 'week'
		? weekPeriod(addDays(period.start, steps * 7))
		: monthPeriod(addMonths(period.key, steps));
}

/** Ist der Zeitraum vollständig abgeschlossen (Ende liegt vor heute)? */
export function isCompleted(period: Period, today: string): boolean {
	return period.end < today;
}

export function inPeriod(iso: string, period: Period): boolean {
	return iso >= period.start && iso <= period.end;
}

export interface Recap<E extends RecapEntry = RecapEntry> {
	count: number;
	byCategory: { categoryId: string; count: number }[];
	averageRating: number | null;
	ratedCount: number;
	topRated: E | null;
	longestNote: { entry: E; length: number } | null;
	xp: number;
	/** Alle Einträge chronologisch (ältester zuerst) */
	entries: E[];
}

/** Erstellt einen Rückblick über die übergebenen Einträge (bereits nach Zeitraum gefiltert). */
export function buildRecap<E extends RecapEntry>(list: E[]): Recap<E> {
	const entries = [...list].sort(
		(a, b) => a.experiencedAt.localeCompare(b.experiencedAt) || a.title.localeCompare(b.title, 'de')
	);

	const counts = new Map<string, number>();
	let ratingSum = 0;
	let ratedCount = 0;
	let topRated: E | null = null;
	let longestNote: { entry: E; length: number } | null = null;
	let xp = 0;

	for (const e of entries) {
		counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
		xp += entryXp(e).total;

		if (e.rating) {
			ratingSum += e.rating;
			ratedCount++;
			// Bei Gleichstand gewinnt der spätere Eintrag (frischere Erinnerung).
			if (!topRated || (topRated.rating ?? 0) <= e.rating) topRated = e;
		}

		const length = noteLength(e.notes);
		if (length > 0 && (!longestNote || length > longestNote.length)) {
			longestNote = { entry: e, length };
		}
	}

	const byCategory = [...counts.entries()]
		.map(([categoryId, count]) => ({ categoryId, count }))
		.sort((a, b) => b.count - a.count);

	return {
		count: entries.length,
		byCategory,
		averageRating: ratedCount ? ratingSum / ratedCount : null,
		ratedCount,
		topRated,
		longestNote,
		xp,
		entries
	};
}

export interface OnThisDayGroup<E> {
	yearsAgo: number;
	year: number;
	entries: E[];
}

export interface OnThisDayResult<E> {
	/** day = gleicher Kalendertag, week = gleiche Kalenderwoche (Fallback), none = nichts gefunden */
	mode: 'day' | 'week' | 'none';
	groups: OnThisDayGroup<E>[];
}

/**
 * Einträge vom heutigen Kalendertag in früheren Jahren. Gibt es keine, werden
 * Einträge aus derselben (ISO-)Kalenderwoche früherer Jahre geliefert.
 * Am 28.02. eines Nicht-Schaltjahres werden auch Einträge vom 29.02. gezeigt.
 */
export function onThisDay<E extends { experiencedAt: string }>(
	list: E[],
	today: string
): OnThisDayResult<E> {
	const t = parseISODate(today);
	if (!t) return { mode: 'none', groups: [] };

	const todayMd = today.slice(5);
	const matchingMd = new Set([todayMd]);
	if (todayMd === '02-28' && !isLeapYear(t.year)) matchingMd.add('02-29');

	const sameDay = list.filter((e) => {
		const p = parseISODate(e.experiencedAt);
		return !!p && p.year < t.year && matchingMd.has(e.experiencedAt.slice(5));
	});
	if (sameDay.length) {
		return {
			mode: 'day',
			groups: groupByYear(sameDay, (e) => t.year - Number(e.experiencedAt.slice(0, 4)))
		};
	}

	const tw = isoWeek(today);
	const sameWeek = list.filter((e) => {
		if (!parseISODate(e.experiencedAt)) return false;
		const w = isoWeek(e.experiencedAt);
		return w.week === tw.week && w.year < tw.year;
	});
	if (sameWeek.length) {
		return {
			mode: 'week',
			groups: groupByYear(sameWeek, (e) => tw.year - isoWeek(e.experiencedAt).year)
		};
	}

	return { mode: 'none', groups: [] };
}

function groupByYear<E extends { experiencedAt: string }>(
	list: E[],
	yearsAgoOf: (e: E) => number
): OnThisDayGroup<E>[] {
	const groups = new Map<number, E[]>();
	for (const e of list) {
		const yearsAgo = yearsAgoOf(e);
		const group = groups.get(yearsAgo) ?? [];
		group.push(e);
		groups.set(yearsAgo, group);
	}
	return [...groups.entries()]
		.sort(([a], [b]) => a - b)
		.map(([yearsAgo, entries]) => ({
			yearsAgo,
			year: Number(entries[0].experiencedAt.slice(0, 4)),
			entries: entries.sort((a, b) => b.experiencedAt.localeCompare(a.experiencedAt))
		}));
}
