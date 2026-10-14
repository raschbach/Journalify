import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import type { ExtraField, FieldType, FieldValues, Visibility } from '../../types';

// Hinweis: Dieses Modul nutzt bewusst nur relative Imports, damit es auch vom
// Seed-Skript (außerhalb von Vite/SvelteKit) geladen werden kann.

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	displayName: text('display_name').notNull(),
	passwordHash: text('password_hash').notNull(),
	/** Startdatum (YYYY-MM-DD) des zuletzt gesehenen Wochenrückblicks */
	recapSeenWeek: text('recap_seen_week'),
	/** Monat (YYYY-MM) des zuletzt gesehenen Monatsrückblicks */
	recapSeenMonth: text('recap_seen_month'),
	createdAt: createdAt()
});

export const sessions = sqliteTable(
	'sessions',
	{
		/** SHA-256-Hash des Session-Tokens – das Token selbst liegt nur im Cookie */
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const friendships = sqliteTable(
	'friendships',
	{
		requesterId: text('requester_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		addresseeId: text('addressee_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		status: text('status', { enum: ['pending', 'accepted'] }).notNull(),
		createdAt: createdAt()
	},
	(t) => [
		primaryKey({ columns: [t.requesterId, t.addresseeId] }),
		index('friendships_addressee_idx').on(t.addresseeId)
	]
);

export const categories = sqliteTable(
	'categories',
	{
		id: text('id').primaryKey(),
		/** null = eingebaute Kategorie */
		ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		emoji: text('emoji').notNull(),
		color: text('color').notNull(),
		/** Beschriftung für „Ersteller:in“ (z. B. „Regie“). null = kein eigenes Feld */
		creatorLabel: text('creator_label'),
		/** Beschriftung für das Jahr (z. B. „Erscheinungsjahr“). null = kein Jahresfeld */
		yearLabel: text('year_label'),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: createdAt()
	},
	(t) => [index('categories_owner_idx').on(t.ownerId)]
);

export const categoryFields = sqliteTable(
	'category_fields',
	{
		id: text('id').primaryKey(),
		categoryId: text('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		key: text('key').notNull(),
		label: text('label').notNull(),
		type: text('type').$type<FieldType>().notNull(),
		options: text('options', { mode: 'json' }).$type<string[]>(),
		placeholder: text('placeholder'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [uniqueIndex('category_fields_key_idx').on(t.categoryId, t.key)]
);

export const catalogItems = sqliteTable(
	'catalog_items',
	{
		id: text('id').primaryKey(),
		categoryId: text('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		creator: text('creator'),
		year: integer('year'),
		metadata: text('metadata', { mode: 'json' }).$type<Record<string, string>>(),
		source: text('source').notNull().default('seed')
	},
	(t) => [index('catalog_items_category_idx').on(t.categoryId)]
);

export const entries = sqliteTable(
	'entries',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		categoryId: text('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		catalogItemId: text('catalog_item_id').references(() => catalogItems.id, {
			onDelete: 'set null'
		}),
		title: text('title').notNull(),
		creator: text('creator'),
		year: integer('year'),
		coverUrl: text('cover_url'),
		/** Datum des Erlebnisses als YYYY-MM-DD (lokales Datum, ohne Zeitzone) */
		experiencedAt: text('experienced_at').notNull(),
		rating: integer('rating'),
		notes: text('notes'),
		fieldValues: text('field_values', { mode: 'json' }).$type<FieldValues>().notNull().default({}),
		extraFields: text('extra_fields', { mode: 'json' }).$type<ExtraField[]>().notNull().default([]),
		visibility: text('visibility').$type<Visibility>().notNull().default('friends'),
		createdAt: createdAt(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => [
		index('entries_user_date_idx').on(t.userId, t.experiencedAt),
		index('entries_user_created_idx').on(t.userId, t.createdAt),
		index('entries_category_idx').on(t.categoryId)
	]
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CategoryField = typeof categoryFields.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type Entry = typeof entries.$inferSelect;
