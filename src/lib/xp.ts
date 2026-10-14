// XP- und Level-Logik. Reine Funktionen ohne Seiteneffekte – XP wird nie
// gespeichert, sondern immer aus dem aktuellen Inhalt der Einträge berechnet.

export const XP_RULES = {
	entry: 10,
	rating: 5,
	note: 20,
	longNote: 15
} as const;

/** Mindestlänge (Zeichen, ohne Leerraum am Rand) für die Notiz-XP */
export const NOTE_MIN_LENGTH = 20;
/** Ab dieser Länge gibt es die Zusatz-XP für eine ausführliche Notiz */
export const LONG_NOTE_MIN_LENGTH = 280;

const XP_PER_LEVEL_UNIT = 50;

export interface XpInput {
	rating?: number | null;
	notes?: string | null;
}

export interface XpBreakdown {
	entry: number;
	rating: number;
	note: number;
	longNote: number;
	total: number;
}

/** Länge einer Notiz in Zeichen (Unicode-Codepoints, ohne Leerraum am Rand). */
export function noteLength(notes: string | null | undefined): number {
	if (!notes) return 0;
	return Array.from(notes.trim()).length;
}

export function hasRating(rating: number | null | undefined): boolean {
	return typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/** XP eines einzelnen Eintrags, aufgeschlüsselt nach Regel. */
export function entryXp(input: XpInput): XpBreakdown {
	const length = noteLength(input.notes);
	const entry = XP_RULES.entry;
	const rating = hasRating(input.rating) ? XP_RULES.rating : 0;
	const note = length >= NOTE_MIN_LENGTH ? XP_RULES.note : 0;
	const longNote = length >= LONG_NOTE_MIN_LENGTH ? XP_RULES.longNote : 0;
	return { entry, rating, note, longNote, total: entry + rating + note + longNote };
}

/** Summe der XP über alle Einträge. */
export function totalXp(entries: Iterable<XpInput>): number {
	let sum = 0;
	for (const e of entries) sum += entryXp(e).total;
	return sum;
}

/** Benötigte Gesamt-XP, um ein Level zu erreichen (Level 1 = 0 XP). */
export function xpForLevel(level: number): number {
	if (level <= 1) return 0;
	return XP_PER_LEVEL_UNIT * (level - 1) ** 2;
}

/** Level = ⌊√(XP / 50)⌋ + 1 – mit Ganzzahl-Korrektur gegen Rundungsfehler. */
export function levelForXp(xp: number): number {
	const safeXp = Math.max(0, Math.floor(xp));
	let n = Math.floor(Math.sqrt(safeXp / XP_PER_LEVEL_UNIT));
	while (xpForLevel(n + 2) <= safeXp) n++;
	while (n > 0 && xpForLevel(n + 1) > safeXp) n--;
	return n + 1;
}

const LEVEL_TITLES: [minLevel: number, title: string][] = [
	[1, 'Zuschauer:in'],
	[2, 'Entdecker:in'],
	[3, 'Kulturgänger:in'],
	[4, 'Stammgast'],
	[5, 'Kenner:in'],
	[6, 'Chronist:in'],
	[7, 'Kritiker:in'],
	[8, 'Feuilletonist:in'],
	[10, 'Kulturikone']
];

export function levelTitle(level: number): string {
	let title = LEVEL_TITLES[0][1];
	for (const [min, t] of LEVEL_TITLES) if (level >= min) title = t;
	return title;
}

export interface LevelProgress {
	xp: number;
	level: number;
	title: string;
	/** XP-Schwelle des aktuellen Levels */
	levelStart: number;
	/** XP-Schwelle des nächsten Levels */
	nextLevelAt: number;
	/** XP, die seit Erreichen des aktuellen Levels gesammelt wurden */
	xpIntoLevel: number;
	/** Fehlende XP bis zum nächsten Level */
	xpToNext: number;
	/** Fortschritt im aktuellen Level, 0–1 */
	progress: number;
}

export function levelProgress(xp: number): LevelProgress {
	const safeXp = Math.max(0, Math.floor(xp));
	const level = levelForXp(safeXp);
	const levelStart = xpForLevel(level);
	const nextLevelAt = xpForLevel(level + 1);
	const span = nextLevelAt - levelStart;
	return {
		xp: safeXp,
		level,
		title: levelTitle(level),
		levelStart,
		nextLevelAt,
		xpIntoLevel: safeXp - levelStart,
		xpToNext: nextLevelAt - safeXp,
		progress: span > 0 ? (safeXp - levelStart) / span : 0
	};
}

/** Kompakte Beschreibung der XP-Bestandteile, z. B. „+10 Eintrag · +5 Bewertung“. */
export function describeXp(b: XpBreakdown): string {
	const parts = [`+${b.entry} Eintrag`];
	if (b.rating) parts.push(`+${b.rating} Bewertung`);
	if (b.note) parts.push(`+${b.note} Notiz`);
	if (b.longNote) parts.push(`+${b.longNote} ausführlich`);
	return parts.join(' · ');
}
