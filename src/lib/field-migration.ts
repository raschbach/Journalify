// Wenn Felder einer eigenen Kategorie gelöscht oder geändert werden, sollen
// bereits eingetragene Werte nicht verloren gehen: Passt ein Wert nicht mehr,
// wird er als frei hinzugefügtes Feld (Label + Wert) im Eintrag behalten.

import { isValidISODate } from './dates';
import type { ExtraField, FieldType, FieldValue, FieldValues } from './types';

export interface MigrationField {
	id: string;
	key: string;
	label: string;
	type: FieldType;
	options: string[] | null;
}

const TEXT_TYPES: FieldType[] = ['text', 'longtext', 'people'];

/** Wandelt einen Wert in den neuen Feldtyp um – oder `undefined`, wenn das nicht geht. */
export function convertValue(value: FieldValue, field: MigrationField): FieldValue | undefined {
	switch (field.type) {
		case 'boolean':
			return typeof value === 'boolean' ? value : undefined;
		case 'number': {
			if (typeof value === 'number') return value;
			if (typeof value !== 'string') return undefined;
			const n = Number(value.trim().replace(',', '.'));
			return value.trim() && Number.isFinite(n) ? n : undefined;
		}
		case 'date':
			return typeof value === 'string' && isValidISODate(value) ? value : undefined;
		case 'select':
			return typeof value === 'string' && field.options?.includes(value) ? value : undefined;
		default:
			return TEXT_TYPES.includes(field.type) && typeof value !== 'boolean'
				? String(value)
				: undefined;
	}
}

function display(value: FieldValue): string {
	if (value === true) return 'Ja';
	if (value === false) return 'Nein';
	return String(value);
}

/**
 * Überträgt die Werte eines Eintrags von den alten auf die neuen Felddefinitionen.
 * Felder werden über ihre ID zugeordnet (der Schlüssel bleibt beim Bearbeiten gleich).
 */
export function migrateEntryFields(
	fieldValues: FieldValues,
	extraFields: ExtraField[],
	oldFields: MigrationField[],
	newFields: MigrationField[]
): { fieldValues: FieldValues; extraFields: ExtraField[]; changed: boolean } {
	const nextValues: FieldValues = { ...fieldValues };
	const nextExtras = [...extraFields];
	let changed = false;

	for (const old of oldFields) {
		const value = fieldValues[old.key];
		if (value === undefined || value === '' || value === false) continue;
		const target = newFields.find((f) => f.id === old.id);
		const converted = target ? convertValue(value, target) : undefined;
		if (converted === undefined) {
			delete nextValues[old.key];
			nextExtras.push({ label: target?.label ?? old.label, value: display(value) });
			changed = true;
		} else if (converted !== value) {
			nextValues[old.key] = converted;
			changed = true;
		}
	}

	return { fieldValues: nextValues, extraFields: nextExtras, changed };
}

/** URL-/Schlüssel-tauglicher Name, z. B. „Spielzeit (Std.)“ → „spielzeit-std“. */
export function slugify(value: string): string {
	return (
		value
			.toLowerCase()
			.replace(/ä/g, 'ae')
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ß/g, 'ss')
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40)
			.replace(/-+$/g, '') || 'feld'
	);
}

/** Hängt -2, -3 … an, bis der Wert nicht mehr vergeben ist. */
export function uniqueSlug(base: string, taken: Set<string>): string {
	let candidate = base;
	for (let i = 2; taken.has(candidate); i++) candidate = `${base}-${i}`;
	return candidate;
}
