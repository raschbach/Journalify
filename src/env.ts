import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Verbindungs-URL der SQLite-Datenbank (Standard: file:local.db).',
		schema: (value) => (value && value.trim() !== '' ? value.trim() : 'file:local.db')
	}
});
