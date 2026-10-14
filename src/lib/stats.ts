// Profil-Statistiken (rein, testbar).

import { noteLength } from './xp';

export interface StatsEntry {
	categoryId: string;
	rating: number | null;
	notes: string | null;
}

export interface ProfileStats {
	total: number;
	perCategory: { categoryId: string; count: number }[];
	averageRating: number | null;
	ratedCount: number;
	withNotes: number;
	/** Anteil der Einträge mit Notiz (0–1) */
	notesShare: number;
}

export function computeStats(list: StatsEntry[]): ProfileStats {
	const counts = new Map<string, number>();
	let ratingSum = 0;
	let ratedCount = 0;
	let withNotes = 0;
	for (const e of list) {
		counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
		if (e.rating) {
			ratingSum += e.rating;
			ratedCount++;
		}
		if (noteLength(e.notes) > 0) withNotes++;
	}
	return {
		total: list.length,
		perCategory: [...counts.entries()]
			.map(([categoryId, count]) => ({ categoryId, count }))
			.sort((a, b) => b.count - a.count),
		averageRating: ratedCount ? ratingSum / ratedCount : null,
		ratedCount,
		withNotes,
		notesShare: list.length ? withNotes / list.length : 0
	};
}
