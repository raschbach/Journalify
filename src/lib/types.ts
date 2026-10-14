// Gemeinsame Typen für Server und Client (keine Laufzeit-Abhängigkeiten).

export const FIELD_TYPES = [
	'text',
	'longtext',
	'number',
	'date',
	'select',
	'people',
	'boolean'
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
	text: 'Text',
	longtext: 'Langer Text',
	number: 'Zahl',
	date: 'Datum',
	select: 'Auswahl',
	people: 'Personen',
	boolean: 'Ja/Nein'
};

export type Visibility = 'private' | 'friends';

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export interface ExtraField {
	label: string;
	value: string;
}

/** Kategorie, wie sie im UI verwendet wird */
export interface CategoryInfo {
	id: string;
	slug: string;
	name: string;
	emoji: string;
	color: string;
	ownerId: string | null;
	creatorLabel: string | null;
	yearLabel: string | null;
}

export interface FieldDef {
	id: string;
	key: string;
	label: string;
	type: FieldType;
	options: string[] | null;
	placeholder: string | null;
	sortOrder: number;
}

export interface CategoryWithFields extends CategoryInfo {
	fields: FieldDef[];
}

/** Kompakte Darstellung eines Eintrags für Listen, Feed und Kalender */
export interface EntrySummary {
	id: string;
	title: string;
	creator: string | null;
	year: number | null;
	coverUrl: string | null;
	experiencedAt: string;
	rating: number | null;
	notes: string | null;
	visibility: Visibility;
	createdAt: number;
	category: CategoryInfo;
	author?: { username: string; displayName: string };
}

export interface CatalogResult {
	id: string;
	title: string;
	creator: string | null;
	year: number | null;
	metadata: Record<string, string> | null;
}

export interface Flash {
	id: string;
	message: string;
	tone?: 'success' | 'info' | 'error';
	xp?: number;
	levelUp?: { level: number; title: string };
}

/** Kategorie inkl. Info, ob es eine Bibliothek für die Titelsuche gibt */
export interface FormCategory extends CategoryWithFields {
	hasCatalog: boolean;
}

/** Zustand des Eintragsformulars (Neu & Bearbeiten) */
export interface EntryFormValues {
	categoryId: string;
	catalogItemId: string | null;
	catalogLabel: string | null;
	title: string;
	creator: string;
	year: string;
	coverUrl: string;
	experiencedAt: string;
	rating: number | null;
	notes: string;
	fieldValues: Record<string, string | boolean>;
	extraFields: ExtraField[];
	visibility: Visibility;
}

/** Feld im Kategorie-Editor */
export interface EditorField {
	/** Bestehende Feld-ID oder null für neue Felder */
	id: string | null;
	/** Stabiler Schlüssel für die Liste im Editor */
	uid: string;
	label: string;
	type: FieldType;
	/** Optionen als kommagetrennter Text */
	options: string;
	placeholder: string;
}
