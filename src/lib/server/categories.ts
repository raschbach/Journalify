// Eigene Kategorien: Validierung, Anlegen, Bearbeiten (inkl. Feld-Editor) und Löschen.

import { randomUUID } from 'node:crypto';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import {
	migrateEntryFields,
	slugify,
	uniqueSlug,
	type MigrationField
} from '#lib/field-migration.ts';
import { FIELD_TYPES } from '#lib/types.ts';
import { db } from './db/index.ts';
import { categories, categoryFields, entries } from './db/schema.ts';
import { fieldErrors, formString } from './validation.ts';

export const CATEGORY_COLORS = [
	'#0d9488',
	'#65a30d',
	'#0891b2',
	'#2563eb',
	'#9333ea',
	'#db2777',
	'#dc2626',
	'#ea580c',
	'#ca8a04',
	'#57534e'
];

const fieldSchema = z
	.object({
		id: z.string().max(100).nullable(),
		label: z
			.string()
			.trim()
			.min(1, { error: 'Bitte gib dem Feld einen Namen.' })
			.max(40, { error: 'Höchstens 40 Zeichen.' }),
		type: z.enum(FIELD_TYPES),
		options: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
		placeholder: z.string().trim().max(80).default('')
	})
	.superRefine((field, ctx) => {
		if (field.type === 'select' && field.options.length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['options'],
				message: 'Eine Auswahl braucht mindestens eine Option.'
			});
		}
	});

const categorySchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, { error: 'Bitte gib einen Namen ein.' })
			.max(40, { error: 'Höchstens 40 Zeichen.' }),
		emoji: z
			.string()
			.trim()
			.min(1, { error: 'Bitte wähle ein Emoji.' })
			.refine((value) => graphemeCount(value) <= 2 && value.length <= 16, {
				error: 'Bitte nur ein Emoji verwenden.'
			}),
		color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: 'Ungültige Farbe.' }),
		fields: z.array(fieldSchema).max(30, { error: 'Höchstens 30 Felder.' })
	})
	.superRefine((value, ctx) => {
		const seen = new Set<string>();
		value.fields.forEach((field, index) => {
			const label = field.label.toLowerCase();
			if (seen.has(label)) {
				ctx.addIssue({
					code: 'custom',
					path: ['fields', index, 'label'],
					message: 'Diesen Feldnamen gibt es schon.'
				});
			}
			seen.add(label);
		});
	});

export type CategoryFormInput = z.infer<typeof categorySchema>;

function graphemeCount(value: string): number {
	return [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(value)].length;
}

export function parseCategoryForm(
	data: FormData
): { ok: true; input: CategoryFormInput } | { ok: false; errors: Record<string, string> } {
	let fields: unknown;
	try {
		fields = JSON.parse(formString(data, 'fields') || '[]');
	} catch {
		return { ok: false, errors: { fields: 'Die Felder konnten nicht gelesen werden.' } };
	}
	const parsed = categorySchema.safeParse({
		name: formString(data, 'name'),
		emoji: formString(data, 'emoji'),
		color: formString(data, 'color'),
		fields
	});
	if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
	// Optionen nur für Auswahlfelder behalten, doppelte entfernen
	for (const field of parsed.data.fields) {
		field.options = field.type === 'select' ? [...new Set(field.options)] : [];
	}
	return { ok: true, input: parsed.data };
}

/** Slugs, die für den Nutzer schon vergeben sind (eingebaute + eigene Kategorien). */
async function takenSlugs(userId: string, exceptId?: string): Promise<Set<string>> {
	const rows = await db
		.select({ slug: categories.slug })
		.from(categories)
		.where(
			and(
				or(isNull(categories.ownerId), eq(categories.ownerId, userId)),
				exceptId ? ne(categories.id, exceptId) : undefined
			)
		);
	return new Set(rows.map((r) => r.slug));
}

export async function getOwnCategory(userId: string, id: string) {
	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, id), eq(categories.ownerId, userId)))
		.limit(1);
	return category ?? null;
}

export async function createCategory(userId: string, input: CategoryFormInput): Promise<string> {
	const id = randomUUID();
	const slug = uniqueSlug(slugify(input.name), await takenSlugs(userId));
	const keys = new Set<string>();

	await db.transaction(async (tx) => {
		await tx.insert(categories).values({
			id,
			ownerId: userId,
			name: input.name,
			slug,
			emoji: input.emoji,
			color: input.color,
			sortOrder: 100
		});
		for (const [index, field] of input.fields.entries()) {
			const key = uniqueSlug(slugify(field.label), keys);
			keys.add(key);
			await tx.insert(categoryFields).values({
				id: randomUUID(),
				categoryId: id,
				key,
				label: field.label,
				type: field.type,
				options: field.type === 'select' ? field.options : null,
				placeholder: field.placeholder || null,
				sortOrder: index
			});
		}
	});
	return id;
}

export async function updateCategory(userId: string, categoryId: string, input: CategoryFormInput) {
	const slug = uniqueSlug(slugify(input.name), await takenSlugs(userId, categoryId));
	const oldFields = await db
		.select()
		.from(categoryFields)
		.where(eq(categoryFields.categoryId, categoryId));
	const oldById = new Map(oldFields.map((f) => [f.id, f]));
	const keys = new Set(oldFields.map((f) => f.key));

	// Neue Felddefinitionen (bestehende behalten ID und Schlüssel)
	const nextFields = input.fields.map((field, index) => {
		const existing = field.id ? oldById.get(field.id) : undefined;
		let key = existing?.key;
		if (!key) {
			key = uniqueSlug(slugify(field.label), keys);
			keys.add(key);
		}
		return {
			id: existing?.id ?? randomUUID(),
			isNew: !existing,
			categoryId,
			key,
			label: field.label,
			type: field.type,
			options: field.type === 'select' ? field.options : null,
			placeholder: field.placeholder || null,
			sortOrder: index
		};
	});
	const keptIds = new Set(nextFields.map((f) => f.id));

	await db.transaction(async (tx) => {
		await tx
			.update(categories)
			.set({ name: input.name, slug, emoji: input.emoji, color: input.color })
			.where(and(eq(categories.id, categoryId), eq(categories.ownerId, userId)));

		// Vorhandene Werte an geänderte/gelöschte Felder anpassen – ohne Datenverlust
		const toMigration = (f: {
			id: string;
			key: string;
			label: string;
			type: MigrationField['type'];
			options: string[] | null;
		}) => ({
			id: f.id,
			key: f.key,
			label: f.label,
			type: f.type,
			options: f.options ?? null
		});
		const categoryEntries = await tx
			.select({
				id: entries.id,
				fieldValues: entries.fieldValues,
				extraFields: entries.extraFields
			})
			.from(entries)
			.where(and(eq(entries.categoryId, categoryId), eq(entries.userId, userId)));
		for (const entry of categoryEntries) {
			const result = migrateEntryFields(
				entry.fieldValues ?? {},
				entry.extraFields ?? [],
				oldFields.map(toMigration),
				nextFields.map(toMigration)
			);
			if (result.changed) {
				await tx
					.update(entries)
					.set({ fieldValues: result.fieldValues, extraFields: result.extraFields })
					.where(eq(entries.id, entry.id));
			}
		}

		for (const old of oldFields) {
			if (!keptIds.has(old.id))
				await tx.delete(categoryFields).where(eq(categoryFields.id, old.id));
		}
		for (const field of nextFields) {
			const { isNew, ...values } = field;
			if (isNew) {
				await tx.insert(categoryFields).values(values);
			} else {
				await tx
					.update(categoryFields)
					.set({
						label: values.label,
						type: values.type,
						options: values.options,
						placeholder: values.placeholder,
						sortOrder: values.sortOrder
					})
					.where(eq(categoryFields.id, values.id));
			}
		}
	});
}

export async function deleteCategory(userId: string, categoryId: string) {
	await db.transaction(async (tx) => {
		await tx
			.delete(entries)
			.where(and(eq(entries.categoryId, categoryId), eq(entries.userId, userId)));
		await tx.delete(categoryFields).where(eq(categoryFields.categoryId, categoryId));
		await tx
			.delete(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.ownerId, userId)));
	});
}
