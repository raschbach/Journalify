// Serverseitige Validierung des Eintragsformulars (Neu & Bearbeiten).

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { isValidISODate } from '#lib/dates.ts';
import type { CategoryWithFields, ExtraField, FieldValues, Visibility } from '#lib/types.ts';
import { db } from './db/index.ts';
import { catalogItems } from './db/schema.ts';
import { formString } from './validation.ts';

export interface EntryInput {
	categoryId: string;
	catalogItemId: string | null;
	title: string;
	creator: string | null;
	year: number | null;
	coverUrl: string | null;
	experiencedAt: string;
	rating: number | null;
	notes: string | null;
	fieldValues: FieldValues;
	extraFields: ExtraField[];
	visibility: Visibility;
}

export type EntryFormErrors = Record<string, string>;

const MAX_TEXT = 2000;
const MAX_NOTES = 20000;
const MAX_EXTRA_FIELDS = 30;

const urlSchema = z.url({ protocol: /^https?$/, error: 'Bitte eine gültige Web-Adresse (https://…) angeben.' });

function optionalText(value: string, max: number): string | null {
	const trimmed = value.trim();
	return trimmed ? trimmed.slice(0, max) : null;
}

function parseNumber(value: string): number | null | 'invalid' {
	const trimmed = value.trim().replace(',', '.');
	if (!trimmed) return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : 'invalid';
}

/**
 * Liest und prüft das Formular. Die Kategorie muss bereits auf Zugriff
 * geprüft sein (eingebaut oder eigene).
 */
export async function parseEntryForm(
	data: FormData,
	category: CategoryWithFields
): Promise<{ ok: true; input: EntryInput } | { ok: false; errors: EntryFormErrors }> {
	const errors: EntryFormErrors = {};

	const title = formString(data, 'title').trim();
	if (!title) errors.title = 'Bitte gib einen Titel ein.';
	else if (title.length > 200) errors.title = 'Der Titel darf höchstens 200 Zeichen lang sein.';

	const experiencedAt = formString(data, 'experiencedAt').trim();
	if (!isValidISODate(experiencedAt)) errors.experiencedAt = 'Bitte wähle ein gültiges Datum.';

	let rating: number | null = null;
	const ratingRaw = formString(data, 'rating').trim();
	if (ratingRaw) {
		const n = Number(ratingRaw);
		if (Number.isInteger(n) && n >= 1 && n <= 5) rating = n;
		else errors.rating = 'Die Bewertung muss zwischen 1 und 5 Sternen liegen.';
	}

	const notesRaw = formString(data, 'notes');
	const notes = notesRaw.trim() ? notesRaw.replace(/\r\n/g, '\n').trim() : null;
	if (notes && notes.length > MAX_NOTES) errors.notes = `Die Notiz darf höchstens ${MAX_NOTES} Zeichen lang sein.`;

	const creator = optionalText(formString(data, 'creator'), 200);

	let year: number | null = null;
	const yearRaw = formString(data, 'year').trim();
	if (yearRaw) {
		const n = Number(yearRaw);
		if (Number.isInteger(n) && n >= 0 && n <= 3000) year = n;
		else errors.year = 'Bitte ein gültiges Jahr angeben (z. B. 2010).';
	}

	let coverUrl: string | null = null;
	const coverRaw = formString(data, 'coverUrl').trim();
	if (coverRaw) {
		const parsed = urlSchema.safeParse(coverRaw);
		if (parsed.success && coverRaw.length <= 1000) coverUrl = coverRaw;
		else errors.coverUrl = 'Bitte eine gültige Web-Adresse (https://…) angeben.';
	}

	const visibility: Visibility = formString(data, 'visibility') === 'private' ? 'private' : 'friends';

	// Kategoriespezifische Felder
	const fieldValues: FieldValues = {};
	for (const field of category.fields) {
		const name = `f.${field.key}`;
		const raw = formString(data, name);
		const errorKey = name;
		switch (field.type) {
			case 'boolean':
				if (raw === 'on' || raw === 'true') fieldValues[field.key] = true;
				break;
			case 'number': {
				const n = parseNumber(raw);
				if (n === 'invalid') errors[errorKey] = `„${field.label}“ muss eine Zahl sein.`;
				else if (n !== null) fieldValues[field.key] = n;
				break;
			}
			case 'date':
				if (raw.trim()) {
					if (isValidISODate(raw.trim())) fieldValues[field.key] = raw.trim();
					else errors[errorKey] = `„${field.label}“ ist kein gültiges Datum.`;
				}
				break;
			case 'select':
				if (raw.trim()) {
					if (field.options?.includes(raw.trim())) fieldValues[field.key] = raw.trim();
					else errors[errorKey] = `Bitte eine gültige Option für „${field.label}“ wählen.`;
				}
				break;
			default: {
				const text = optionalText(raw, MAX_TEXT);
				if (text) fieldValues[field.key] = text;
			}
		}
	}

	// Frei hinzugefügte Felder (Label + Wert)
	const labels = data.getAll('extraLabel').map((v) => (typeof v === 'string' ? v.trim() : ''));
	const values = data.getAll('extraValue').map((v) => (typeof v === 'string' ? v.trim() : ''));
	const extraFields: ExtraField[] = [];
	for (let i = 0; i < Math.max(labels.length, values.length); i++) {
		const label = (labels[i] ?? '').slice(0, 60);
		const value = (values[i] ?? '').slice(0, MAX_TEXT);
		if (!label && !value) continue;
		if (!label) {
			errors[`extra.${i}`] = 'Bitte gib dem Feld einen Namen.';
			continue;
		}
		extraFields.push({ label, value });
	}
	if (extraFields.length > MAX_EXTRA_FIELDS) errors.extra = `Höchstens ${MAX_EXTRA_FIELDS} eigene Felder.`;

	// Bibliotheksverknüpfung nur übernehmen, wenn sie zur Kategorie passt
	let catalogItemId: string | null = formString(data, 'catalogItemId').trim() || null;
	if (catalogItemId) {
		const [item] = await db
			.select({ id: catalogItems.id })
			.from(catalogItems)
			.where(and(eq(catalogItems.id, catalogItemId), eq(catalogItems.categoryId, category.id)))
			.limit(1);
		if (!item) catalogItemId = null;
	}

	if (Object.keys(errors).length) return { ok: false, errors };

	return {
		ok: true,
		input: {
			categoryId: category.id,
			catalogItemId,
			title,
			creator,
			year,
			coverUrl,
			experiencedAt,
			rating,
			notes,
			fieldValues,
			extraFields,
			visibility
		}
	};
}
