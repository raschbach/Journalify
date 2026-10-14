// Datumsfunktionen auf Basis von ISO-Datumsstrings (YYYY-MM-DD).
// Es wird bewusst ohne Uhrzeit/Zeitzone gerechnet: Ein Erlebnis findet an einem
// Kalendertag statt. Für Arithmetik wird intern UTC verwendet (keine
// Sommerzeit-Sprünge).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_LONG = [
	'Montag',
	'Dienstag',
	'Mittwoch',
	'Donnerstag',
	'Freitag',
	'Samstag',
	'Sonntag'
];
export const MONTHS = [
	'Januar',
	'Februar',
	'März',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September',
	'Oktober',
	'November',
	'Dezember'
];

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export interface DateParts {
	year: number;
	month: number; // 1–12
	day: number;
}

export function parseISODate(iso: string): DateParts | null {
	const m = ISO_DATE.exec(iso);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
	return { year, month, day };
}

export function isValidISODate(iso: unknown): iso is string {
	return typeof iso === 'string' && parseISODate(iso) !== null;
}

function partsOrThrow(iso: string): DateParts {
	const p = parseISODate(iso);
	if (!p) throw new Error(`Ungültiges Datum: ${iso}`);
	return p;
}

export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function fromUtc(d: Date): string {
	return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toUtc(iso: string): Date {
	const { year, month, day } = partsOrThrow(iso);
	return new Date(Date.UTC(year, month - 1, day));
}

/** Lokales Datum (nicht UTC!) eines Date-Objekts als YYYY-MM-DD. */
export function toISODate(date: Date): string {
	return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(now: Date = new Date()): string {
	return toISODate(now);
}

export function addDays(iso: string, days: number): string {
	const d = toUtc(iso);
	d.setUTCDate(d.getUTCDate() + days);
	return fromUtc(d);
}

/** Anzahl Tage von a bis b (positiv, wenn b nach a liegt). */
export function daysBetween(a: string, b: string): number {
	return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

/** Wochentag mit Montag = 0 … Sonntag = 6. */
export function weekdayIndex(iso: string): number {
	return (toUtc(iso).getUTCDay() + 6) % 7;
}

/** Montag der Woche, in der das Datum liegt. */
export function startOfWeek(iso: string): string {
	return addDays(iso, -weekdayIndex(iso));
}

/** ISO-8601-Kalenderwoche (Woche beginnt Montag, KW 1 enthält den ersten Donnerstag). */
export function isoWeek(iso: string): { year: number; week: number } {
	const thursday = addDays(iso, 3 - weekdayIndex(iso));
	const { year } = partsOrThrow(thursday);
	const week = Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1;
	return { year, week };
}

export function monthKey(iso: string): string {
	return iso.slice(0, 7);
}

export function isValidMonthKey(key: unknown): key is string {
	if (typeof key !== 'string') return false;
	const m = MONTH_KEY.exec(key);
	return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

export function addMonths(key: string, months: number): string {
	const m = MONTH_KEY.exec(key);
	if (!m) throw new Error(`Ungültiger Monat: ${key}`);
	const index = Number(m[1]) * 12 + (Number(m[2]) - 1) + months;
	return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`;
}

export function monthRange(key: string): { start: string; end: string } {
	const m = MONTH_KEY.exec(key);
	if (!m) throw new Error(`Ungültiger Monat: ${key}`);
	const year = Number(m[1]);
	const month = Number(m[2]);
	return { start: `${key}-01`, end: `${key}-${pad(daysInMonth(year, month))}` };
}

// ---------------------------------------------------------------------------
// Formatierung (deutsch)
// ---------------------------------------------------------------------------

/** TT.MM.JJJJ */
export function formatDate(iso: string): string {
	const p = parseISODate(iso);
	if (!p) return iso;
	return `${pad(p.day)}.${pad(p.month)}.${p.year}`;
}

/** „Sa., 03.10.2026“ */
export function formatDateWithWeekday(iso: string): string {
	if (!parseISODate(iso)) return iso;
	return `${WEEKDAYS_SHORT[weekdayIndex(iso)]}., ${formatDate(iso)}`;
}

/** „Samstag, 03.10.2026“ */
export function formatDateLong(iso: string): string {
	if (!parseISODate(iso)) return iso;
	return `${WEEKDAYS_LONG[weekdayIndex(iso)]}, ${formatDate(iso)}`;
}

/** „3. Oktober“ */
export function formatDayMonth(iso: string): string {
	const p = parseISODate(iso);
	if (!p) return iso;
	return `${p.day}. ${MONTHS[p.month - 1]}`;
}

/** „Oktober 2026“ */
export function formatMonth(key: string): string {
	const m = MONTH_KEY.exec(key);
	if (!m) return key;
	return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** „05.10.–11.10.2026“ bzw. „29.12.2025–04.01.2026“ über den Jahreswechsel. */
export function formatRange(start: string, end: string): string {
	const s = partsOrThrow(start);
	const e = partsOrThrow(end);
	if (s.year === e.year) return `${pad(s.day)}.${pad(s.month)}.–${formatDate(end)}`;
	return `${formatDate(start)}–${formatDate(end)}`;
}

export function yearsAgoLabel(years: number): string {
	return years === 1 ? 'Vor 1 Jahr' : `Vor ${years} Jahren`;
}

/** Relative Zeitangabe vom Datum bis heute, z. B. „Gestern“, „Vor 3 Wochen“. */
export function relativeLabel(iso: string, today: string): string {
	const diff = daysBetween(iso, today);
	if (diff < 0) {
		if (diff === -1) return 'Morgen';
		return `In ${-diff} Tagen`;
	}
	if (diff === 0) return 'Heute';
	if (diff === 1) return 'Gestern';
	if (diff < 7) return `Vor ${diff} Tagen`;
	if (diff < 30) {
		const weeks = Math.floor(diff / 7);
		return weeks === 1 ? 'Vor 1 Woche' : `Vor ${weeks} Wochen`;
	}
	const a = partsOrThrow(iso);
	const b = partsOrThrow(today);
	let months = (b.year - a.year) * 12 + (b.month - a.month);
	if (b.day < a.day) months--;
	if (months < 12) {
		const m = Math.max(1, months);
		return m === 1 ? 'Vor 1 Monat' : `Vor ${m} Monaten`;
	}
	return yearsAgoLabel(Math.floor(months / 12));
}
