import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Passwort-Hashing', () => {
	it('verifiziert das richtige Passwort', async () => {
		const hash = await hashPassword('geheim123');
		expect(hash.startsWith('scrypt$')).toBe(true);
		expect(await verifyPassword('geheim123', hash)).toBe(true);
	});

	it('lehnt falsche Passwörter und kaputte Hashes ab', async () => {
		const hash = await hashPassword('geheim123');
		expect(await verifyPassword('geheim124', hash)).toBe(false);
		expect(await verifyPassword('geheim123', 'kaputt')).toBe(false);
	});

	it('verwendet ein zufälliges Salt', async () => {
		expect(await hashPassword('x')).not.toBe(await hashPassword('x'));
	});
});
