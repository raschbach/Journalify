// Eingebaute Kategorien, Felder und Bibliothek. Wird beim Serverstart und vom
// Seed-Skript idempotent in die Datenbank geschrieben.
// Nur relative Imports – das Modul wird auch vom Seed-Skript genutzt.

import { sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { FieldType } from '../types';
import { CATALOG_SEED } from './catalog/seed-data';
import { catalogItems, categories, categoryFields } from './db/schema';
import type * as schema from './db/schema';

interface BuiltinField {
	key: string;
	label: string;
	type: FieldType;
	options?: string[];
	placeholder?: string;
}

interface BuiltinCategory {
	id: string;
	name: string;
	emoji: string;
	color: string;
	creatorLabel: string | null;
	yearLabel: string | null;
	fields: BuiltinField[];
}

const WITH_WHOM: BuiltinField = {
	key: 'with',
	label: 'Mit wem',
	type: 'people',
	placeholder: 'z. B. Lena, Tom'
};

export const BUILTIN_CATEGORIES: BuiltinCategory[] = [
	{
		id: 'film',
		name: 'Film',
		emoji: '🎬',
		color: '#e11d48',
		creatorLabel: 'Regie',
		yearLabel: 'Erscheinungsjahr',
		fields: [
			{
				key: 'where',
				label: 'Wo gesehen',
				type: 'select',
				options: ['Kino', 'Streaming', 'TV', 'Disc']
			},
			{ key: 'venue', label: 'Kino bzw. Plattform', type: 'text', placeholder: 'z. B. Yorck Kino, Netflix' },
			{ key: 'version', label: 'Fassung', type: 'select', options: ['OV', 'Synchro', 'OmU'] },
			WITH_WHOM
		]
	},
	{
		id: 'series',
		name: 'Serie',
		emoji: '📺',
		color: '#7c3aed',
		creatorLabel: 'Showrunner:in',
		yearLabel: 'Startjahr',
		fields: [
			{ key: 'season', label: 'Staffel', type: 'number', placeholder: 'z. B. 2' },
			{ key: 'episodes', label: 'Folgen', type: 'text', placeholder: 'z. B. 1–8' },
			{ key: 'platform', label: 'Plattform', type: 'text', placeholder: 'z. B. ARD Mediathek' },
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['läuft', 'abgeschlossen', 'abgebrochen']
			},
			WITH_WHOM
		]
	},
	{
		id: 'book',
		name: 'Buch',
		emoji: '📚',
		color: '#d97706',
		creatorLabel: 'Autor:in',
		yearLabel: 'Erscheinungsjahr',
		fields: [
			{ key: 'format', label: 'Format', type: 'select', options: ['Print', 'E-Book', 'Hörbuch'] },
			{ key: 'startedAt', label: 'Begonnen am', type: 'date' },
			{ key: 'pages', label: 'Seiten', type: 'number' },
			{ key: 'publisher', label: 'Verlag', type: 'text' }
		]
	},
	{
		id: 'music',
		name: 'Musik',
		emoji: '🎧',
		color: '#059669',
		creatorLabel: 'Künstler:in',
		yearLabel: 'Erscheinungsjahr',
		fields: [
			{ key: 'kind', label: 'Art', type: 'select', options: ['Album', 'Song', 'Playlist'] },
			{ key: 'genre', label: 'Genre', type: 'text' },
			{ key: 'occasion', label: 'Anlass', type: 'text', placeholder: 'z. B. Sonntagmorgen, Roadtrip' }
		]
	},
	{
		id: 'concert',
		name: 'Konzert',
		emoji: '🎤',
		color: '#ea580c',
		creatorLabel: 'Künstler:in',
		yearLabel: null,
		fields: [
			{ key: 'location', label: 'Location', type: 'text' },
			{ key: 'city', label: 'Stadt', type: 'text' },
			{ key: 'support', label: 'Vorband', type: 'text' },
			WITH_WHOM
		]
	},
	{
		id: 'theater',
		name: 'Theater',
		emoji: '🎭',
		color: '#c026d3',
		creatorLabel: 'Autor:in',
		yearLabel: null,
		fields: [
			{ key: 'venue', label: 'Spielstätte', type: 'text' },
			{ key: 'city', label: 'Stadt', type: 'text' },
			{ key: 'director', label: 'Regie', type: 'text' },
			{ key: 'cast', label: 'Hauptdarsteller:innen', type: 'people' },
			{ key: 'seat', label: 'Platz', type: 'text', placeholder: 'z. B. Parkett, Reihe 7' },
			WITH_WHOM
		]
	},
	{
		id: 'opera',
		name: 'Oper',
		emoji: '🎼',
		color: '#4f46e5',
		creatorLabel: 'Komponist:in',
		yearLabel: null,
		fields: [
			{ key: 'house', label: 'Opernhaus', type: 'text' },
			{ key: 'conductor', label: 'Dirigent:in', type: 'text' },
			{ key: 'director', label: 'Regie', type: 'text' },
			{ key: 'cast', label: 'Besetzung (Hauptrollen)', type: 'people' },
			WITH_WHOM
		]
	},
	{
		id: 'museum',
		name: 'Museum / Ausstellung',
		emoji: '🖼️',
		color: '#0284c7',
		creatorLabel: null,
		yearLabel: null,
		fields: [
			{ key: 'museum', label: 'Museum', type: 'text' },
			{ key: 'exhibition', label: 'Ausstellung', type: 'text' },
			{ key: 'city', label: 'Stadt', type: 'text' },
			{ key: 'favorite', label: 'Lieblingswerk', type: 'text' },
			{ key: 'duration', label: 'Dauer', type: 'text', placeholder: 'z. B. 2 Stunden' },
			WITH_WHOM
		]
	}
];

export const BUILTIN_SLUGS = new Set(BUILTIN_CATEGORIES.map((c) => c.id));

type Db = LibSQLDatabase<typeof schema>;

/** Legt eingebaute Kategorien, Felder und die Seed-Bibliothek an bzw. aktualisiert sie. */
export async function ensureBuiltins(db: Db): Promise<void> {
	await db.transaction(async (tx) => {
		for (const [index, cat] of BUILTIN_CATEGORIES.entries()) {
			const values = {
				id: cat.id,
				ownerId: null,
				name: cat.name,
				slug: cat.id,
				emoji: cat.emoji,
				color: cat.color,
				creatorLabel: cat.creatorLabel,
				yearLabel: cat.yearLabel,
				sortOrder: index
			};
			await tx
				.insert(categories)
				.values(values)
				.onConflictDoUpdate({
					target: categories.id,
					set: {
						name: values.name,
						slug: values.slug,
						emoji: values.emoji,
						color: values.color,
						creatorLabel: values.creatorLabel,
						yearLabel: values.yearLabel,
						sortOrder: values.sortOrder
					}
				});

			for (const [fieldIndex, field] of cat.fields.entries()) {
				const fieldValues = {
					id: `${cat.id}.${field.key}`,
					categoryId: cat.id,
					key: field.key,
					label: field.label,
					type: field.type,
					options: field.options ?? null,
					placeholder: field.placeholder ?? null,
					sortOrder: fieldIndex
				};
				await tx
					.insert(categoryFields)
					.values(fieldValues)
					.onConflictDoUpdate({
						target: categoryFields.id,
						set: {
							label: fieldValues.label,
							type: fieldValues.type,
							options: fieldValues.options,
							placeholder: fieldValues.placeholder,
							sortOrder: fieldValues.sortOrder
						}
					});
			}
		}

		for (const item of CATALOG_SEED) {
			await tx
				.insert(catalogItems)
				.values({ ...item, source: 'seed' })
				.onConflictDoUpdate({
					target: catalogItems.id,
					set: {
						title: item.title,
						creator: item.creator,
						year: item.year,
						metadata: item.metadata,
						categoryId: item.categoryId
					}
				});
		}
	});
}

/** Prüft, ob die Tabellen existieren (also `npm run db:push` gelaufen ist). */
export async function databaseIsReady(db: Db): Promise<boolean> {
	const rows = await db.all<{ name: string }>(
		sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'entries'`
	);
	return rows.length > 0;
}
