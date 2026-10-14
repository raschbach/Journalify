import { z } from 'zod';

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;

export const usernameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.regex(USERNAME_PATTERN, {
		error: '3–24 Zeichen: Kleinbuchstaben, Ziffern, Punkt oder Unterstrich.'
	});

export const passwordSchema = z
	.string()
	.min(8, { error: 'Mindestens 8 Zeichen.' })
	.max(200, { error: 'Höchstens 200 Zeichen.' });

export const displayNameSchema = z
	.string()
	.trim()
	.min(1, { error: 'Bitte gib einen Namen an.' })
	.max(40, { error: 'Höchstens 40 Zeichen.' });

/** Fehler eines Zod-Ergebnisses als { feld: meldung } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path.join('.') || '_';
		out[key] ??= issue.message;
	}
	return out;
}

/** Nur interne Pfade als Weiterleitungsziel erlauben (kein Open Redirect). */
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
		return fallback;
	}
	return target;
}

export function formString(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value : '';
}
