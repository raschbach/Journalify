import { describe, expect, it } from 'vitest';
import {
	addDays,
	addMonths,
	daysBetween,
	formatDate,
	formatDateWithWeekday,
	formatMonth,
	formatRange,
	isoWeek,
	isValidISODate,
	monthRange,
	relativeLabel,
	startOfWeek,
	toISODate,
	weekdayIndex
} from './dates';

describe('Datumsfunktionen', () => {
	it('validiert ISO-Daten', () => {
		expect(isValidISODate('2026-10-14')).toBe(true);
		expect(isValidISODate('2026-02-29')).toBe(false);
		expect(isValidISODate('2024-02-29')).toBe(true);
		expect(isValidISODate('2026-13-01')).toBe(false);
		expect(isValidISODate('14.10.2026')).toBe(false);
		expect(isValidISODate(undefined)).toBe(false);
	});

	it('verwendet das lokale Datum statt UTC', () => {
		expect(toISODate(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
		expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
	});

	it('rechnet Tage über Monats- und Jahresgrenzen', () => {
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
		expect(addDays('2026-03-29', 1)).toBe('2026-03-30'); // Zeitumstellung
		expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
	});

	it('beginnt die Woche am Montag', () => {
		expect(weekdayIndex('2026-10-12')).toBe(0); // Montag
		expect(weekdayIndex('2026-10-18')).toBe(6); // Sonntag
		expect(startOfWeek('2026-10-14')).toBe('2026-10-12');
		expect(startOfWeek('2026-10-18')).toBe('2026-10-12');
		expect(startOfWeek('2026-10-12')).toBe('2026-10-12');
	});

	it('berechnet ISO-Kalenderwochen', () => {
		expect(isoWeek('2026-10-14')).toEqual({ year: 2026, week: 42 });
		expect(isoWeek('2026-01-01')).toEqual({ year: 2026, week: 1 });
		expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
		expect(isoWeek('2024-12-30')).toEqual({ year: 2025, week: 1 });
	});

	it('rechnet mit Monaten', () => {
		expect(addMonths('2026-01', -1)).toBe('2025-12');
		expect(addMonths('2026-12', 1)).toBe('2027-01');
		expect(addMonths('2026-10', -14)).toBe('2025-08');
		expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
		expect(monthRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' });
	});

	it('formatiert deutsch', () => {
		expect(formatDate('2026-10-03')).toBe('03.10.2026');
		expect(formatDateWithWeekday('2026-10-03')).toBe('Sa., 03.10.2026');
		expect(formatMonth('2026-03')).toBe('März 2026');
		expect(formatRange('2026-10-05', '2026-10-11')).toBe('05.10.–11.10.2026');
		expect(formatRange('2025-12-29', '2026-01-04')).toBe('29.12.2025–04.01.2026');
	});

	it('beschreibt relative Zeitabstände', () => {
		const today = '2026-10-14';
		expect(relativeLabel('2026-10-14', today)).toBe('Heute');
		expect(relativeLabel('2026-10-13', today)).toBe('Gestern');
		expect(relativeLabel('2026-10-10', today)).toBe('Vor 4 Tagen');
		expect(relativeLabel('2026-10-01', today)).toBe('Vor 1 Woche');
		expect(relativeLabel('2026-08-14', today)).toBe('Vor 2 Monaten');
		expect(relativeLabel('2025-10-14', today)).toBe('Vor 1 Jahr');
		expect(relativeLabel('2023-10-15', today)).toBe('Vor 2 Jahren');
	});
});
