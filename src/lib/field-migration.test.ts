import { describe, expect, it } from 'vitest';
import { convertValue, migrateEntryFields, slugify, uniqueSlug, type MigrationField } from './field-migration';

const f = (partial: Partial<MigrationField> & { id: string }): MigrationField => ({
	key: partial.id,
	label: partial.id,
	type: 'text',
	options: null,
	...partial
});

describe('Feld-Migration', () => {
	it('verschiebt Werte gelöschter Felder in eigene Felder', () => {
		const result = migrateEntryFields(
			{ platform: 'PC', hours: 12 },
			[],
			[f({ id: 'platform', label: 'Plattform' }), f({ id: 'hours', label: 'Spielzeit', type: 'number' })],
			[f({ id: 'hours', label: 'Spielzeit', type: 'number' })]
		);
		expect(result.fieldValues).toEqual({ hours: 12 });
		expect(result.extraFields).toEqual([{ label: 'Plattform', value: 'PC' }]);
		expect(result.changed).toBe(true);
	});

	it('wandelt kompatible Typen um und behält sie', () => {
		const result = migrateEntryFields(
			{ hours: '12,5' },
			[],
			[f({ id: 'hours' })],
			[f({ id: 'hours', type: 'number' })]
		);
		expect(result.fieldValues).toEqual({ hours: 12.5 });
		expect(result.extraFields).toEqual([]);
	});

	it('behält unpassende Auswahlwerte als eigenes Feld', () => {
		const result = migrateEntryFields(
			{ platform: 'Amiga' },
			[{ label: 'Snack', value: 'Chips' }],
			[f({ id: 'platform', label: 'Plattform' })],
			[f({ id: 'platform', label: 'System', type: 'select', options: ['PC', 'Switch'] })]
		);
		expect(result.fieldValues).toEqual({});
		expect(result.extraFields).toEqual([
			{ label: 'Snack', value: 'Chips' },
			{ label: 'System', value: 'Amiga' }
		]);
	});

	it('ändert nichts, wenn alles passt', () => {
		const fields = [f({ id: 'a' })];
		const result = migrateEntryFields({ a: 'x' }, [], fields, fields);
		expect(result.changed).toBe(false);
	});

	it('prüft Typen streng', () => {
		expect(convertValue(true, f({ id: 'x', type: 'text' }))).toBeUndefined();
		expect(convertValue('ja', f({ id: 'x', type: 'boolean' }))).toBeUndefined();
		expect(convertValue('2026-02-30', f({ id: 'x', type: 'date' }))).toBeUndefined();
		expect(convertValue(42, f({ id: 'x', type: 'longtext' }))).toBe('42');
		expect(convertValue('abc', f({ id: 'x', type: 'number' }))).toBeUndefined();
	});
});

describe('slugify', () => {
	it('erzeugt lesbare Schlüssel', () => {
		expect(slugify('Spielzeit (Std.)')).toBe('spielzeit-std');
		expect(slugify('Größe & Übermaß')).toBe('groesse-uebermass');
		expect(slugify('Café')).toBe('cafe');
		expect(slugify('🎮')).toBe('feld');
	});

	it('macht Schlüssel eindeutig', () => {
		expect(uniqueSlug('podcast', new Set(['podcast', 'podcast-2']))).toBe('podcast-3');
		expect(uniqueSlug('neu', new Set())).toBe('neu');
	});
});
