// Setzt die Datenbank auf Demodaten zurück (nur für die Entwicklung!).
// Aufruf: npm run db:seed
//
// Alle Daten werden relativ zum heutigen Datum erzeugt, damit „An diesem Tag“,
// Kalender und Rückblicke sofort Inhalte zeigen.

import { randomUUID } from 'node:crypto';
import { inArray, isNotNull } from 'drizzle-orm';
import { addDays, daysInMonth, todayISO } from '../src/lib/dates';
import { lastCompletedMonth, lastCompletedWeek } from '../src/lib/recap';
import { hashPassword } from '../src/lib/server/auth/password';
import { databaseIsReady, ensureBuiltins } from '../src/lib/server/builtins';
import { createDb } from '../src/lib/server/db/client';
import {
	catalogItems,
	categories,
	categoryFields,
	entries,
	friendships,
	sessions,
	users
} from '../src/lib/server/db/schema';
import type { ExtraField, FieldValues, Visibility } from '../src/lib/types';

const DEMO_PASSWORD = 'journalify';

const db = createDb(process.env.DATABASE_URL || 'file:local.db');

const today = todayISO();
const lastWeek = lastCompletedWeek(today);
const lastMonth = lastCompletedMonth(today);

/** Datum vor n Tagen */
const ago = (days: number) => addDays(today, -days);
/** Tag (0 = Montag … 6 = Sonntag) der letzten abgeschlossenen Woche */
const lastWeekDay = (index: number) => addDays(lastWeek.start, index);
/** Tag im letzten abgeschlossenen Monat (wird auf die Monatslänge begrenzt) */
const lastMonthDay = (day: number) => {
	const [y, m] = lastMonth.key.split('-').map(Number);
	return `${lastMonth.key}-${String(Math.min(day, daysInMonth(y, m))).padStart(2, '0')}`;
};
/** Gleicher Kalendertag vor n Jahren (29.02. → 28.02.) */
const yearsAgoToday = (years: number) => {
	const [y, m, d] = today.split('-').map(Number);
	const year = y - years;
	return `${year}-${String(m).padStart(2, '0')}-${String(Math.min(d, daysInMonth(year, m))).padStart(2, '0')}`;
};

interface SeedEntry {
	category: string;
	title: string;
	date: string;
	rating?: number;
	notes?: string;
	creator?: string;
	year?: number;
	catalog?: string;
	fields?: FieldValues;
	extra?: ExtraField[];
	visibility?: Visibility;
}

const LONG_NOTE_INCEPTION =
	'Beim zweiten Mal sieht man so viel mehr: Die Musik von Hans Zimmer zieht sich wie ein Uhrwerk durch den ganzen Film, und das berühmte „BRAAAM“ ist eigentlich nur ein verlangsamtes Édith-Piaf-Lied. Die Szene im rotierenden Hotelflur ist immer noch unfassbar. Ich bin mir jetzt sicher: Der Kreisel am Ende ist egal – Cobb schaut gar nicht mehr hin. Das ist die eigentliche Antwort.';

const LONG_NOTE_BOOK =
	'Ein leises Buch, das lange nachhallt. Erpenbeck erzählt eine Liebesgeschichte im Ost-Berlin der späten Achtziger und gleichzeitig vom Zerfall eines ganzen Staates – beides spiegelt sich ineinander. Besonders hängen geblieben ist mir, wie Katharina die Kassetten mit seinen Vorwürfen immer wieder anhört. Manche Sätze habe ich zweimal gelesen, weil sie so präzise sind. Nicht leicht, aber großartig.';

const LONG_NOTE_CONCERT =
	'Was für ein Abend! Die Halle war bis unters Dach voll, und schon beim ersten Song hat der ganze Saal mitgesungen. Mitten im Set gab es einen akustischen Teil nur mit Klavier, da war es plötzlich so still, dass man das Knistern der Lichter hören konnte. Die Vorband war überraschend gut – muss ich mir merken. Auf dem Heimweg haben wir noch eine Stunde über die Setlist diskutiert.';

const DEMO_ENTRIES: SeedEntry[] = [
	// Diese Woche & letzte Tage
	{
		category: 'book',
		title: 'Kairos',
		creator: 'Jenny Erpenbeck',
		year: 2021,
		catalog: 'seed-book-12',
		date: ago(1),
		rating: 5,
		notes: LONG_NOTE_BOOK,
		fields: { format: 'Print', pages: 384, publisher: 'Penguin' }
	},
	{
		category: 'series',
		title: 'Severance',
		creator: 'Dan Erickson',
		year: 2022,
		catalog: 'seed-series-07',
		date: ago(2),
		rating: 4,
		notes: 'Staffel 2 ist noch rätselhafter. Die Szene mit den Ziegen – was war das bitte?',
		fields: { season: 2, episodes: '1–4', platform: 'Apple TV+', status: 'läuft', with: 'Jonas' }
	},
	{ category: 'music', title: 'Blond', creator: 'Frank Ocean', year: 2016, catalog: 'seed-music-09', date: ago(3), fields: { kind: 'Album', genre: 'R&B', occasion: 'Abendspaziergang' } },
	{ category: 'videogame', title: 'Hades II', date: ago(4), rating: 4, notes: 'Noch ein Run, nur noch einer … um 2 Uhr nachts.', fields: { platform: 'PC', hours: 12 } },

	// Letzte abgeschlossene Woche
	{
		category: 'film',
		title: 'Perfect Days',
		creator: 'Wim Wenders',
		year: 2023,
		catalog: 'seed-film-12',
		date: lastWeekDay(1),
		rating: 5,
		notes: 'Die letzte Einstellung mit Hirayamas Gesicht im Auto, während „Feeling Good“ läuft – ich hatte Gänsehaut.',
		fields: { where: 'Kino', venue: 'Delphi Lux', version: 'OmU', with: 'Mara' }
	},
	{
		category: 'concert',
		title: 'Tour 2026',
		creator: 'Herbert Grönemeyer',
		date: lastWeekDay(4),
		rating: 5,
		notes: LONG_NOTE_CONCERT,
		fields: { location: 'Waldbühne', city: 'Berlin', support: 'Lisa Morgenstern', with: 'Mara, Jonas' }
	},
	{ category: 'music', title: 'Kind of Blue', creator: 'Miles Davis', year: 1959, catalog: 'seed-music-04', date: lastWeekDay(6), rating: 4, fields: { kind: 'Album', genre: 'Jazz', occasion: 'Sonntagmorgen' } },

	// Letzter abgeschlossener Monat
	{
		category: 'theater',
		title: 'Der Besuch der alten Dame',
		creator: 'Friedrich Dürrenmatt',
		date: lastMonthDay(5),
		rating: 4,
		notes: 'Minimalistisches Bühnenbild, fast nur Licht. Wie die Stimmung im Saal kippt, als Claire ihr Angebot macht – man hörte niemanden atmen.',
		fields: { venue: 'Deutsches Theater', city: 'Berlin', director: 'Anne Lenk', seat: 'Parkett, Reihe 9' }
	},
	{
		category: 'film',
		title: 'Oppenheimer',
		creator: 'Christopher Nolan',
		year: 2023,
		catalog: 'seed-film-08',
		date: lastMonthDay(9),
		rating: 3,
		notes: 'Toll gespielt, aber eine Stunde zu lang. Der Trinity-Test ohne Ton war stark.',
		fields: { where: 'Streaming', venue: 'Prime Video', version: 'OV' }
	},
	{ category: 'museum', title: 'Monet und die impressionistische Stadt', date: lastMonthDay(14), rating: 5, notes: 'Die Nebelbilder von London! Ich stand bestimmt zehn Minuten vor dem Parlament im Sonnenuntergang.', fields: { museum: 'Museum Barberini', city: 'Potsdam', favorite: 'Das Parlament in London', duration: '2,5 Stunden', with: 'Mama' } },
	{ category: 'book', title: 'Tschick', creator: 'Wolfgang Herrndorf', year: 2010, catalog: 'seed-book-03', date: lastMonthDay(20), rating: 4, fields: { format: 'Hörbuch' } },
	{ category: 'series', title: 'The Bear', creator: 'Christopher Storer', year: 2022, catalog: 'seed-series-08', date: lastMonthDay(24), rating: 5, notes: 'Die Folge „Fishes“ ist purer Stress – und genial.', fields: { season: 2, platform: 'Disney+', status: 'abgeschlossen' } },
	{ category: 'opera', title: 'La Traviata', creator: 'Giuseppe Verdi', date: lastMonthDay(27), notes: 'Erste Oper seit Jahren. Das „Addio del passato“ im dritten Akt – ganz leise, ganz allein auf der Bühne.', fields: { house: 'Komische Oper', conductor: 'James Gaffigan', with: 'Oma Ilse' } },

	// Vor 1 Jahr – „An diesem Tag“
	{
		category: 'film',
		title: 'Inception',
		creator: 'Christopher Nolan',
		year: 2010,
		catalog: 'seed-film-01',
		date: yearsAgoToday(1),
		rating: 5,
		notes: LONG_NOTE_INCEPTION,
		fields: { where: 'TV', version: 'Synchro', with: 'Jonas' }
	},
	{ category: 'music', title: 'OK Computer', creator: 'Radiohead', year: 1997, catalog: 'seed-music-02', date: yearsAgoToday(1), rating: 5, notes: 'Auf der Zugfahrt nach Hamburg komplett durchgehört. „Let Down“ passt perfekt zu vorbeiziehenden Feldern.', fields: { kind: 'Album', occasion: 'Zugfahrt' } },

	// Über das Jahr verteilt
	{ category: 'film', title: 'Parasite', creator: 'Bong Joon-ho', year: 2019, catalog: 'seed-film-03', date: ago(9), rating: 5, notes: 'Der Pfirsich. Mehr sage ich nicht.', fields: { where: 'Streaming', version: 'OmU' } },
	{ category: 'book', title: 'Die Vermessung der Welt', creator: 'Daniel Kehlmann', year: 2005, catalog: 'seed-book-09', date: ago(17), rating: 4, notes: 'Gauß und Humboldt als komisches Paar – ich habe oft laut gelacht.', fields: { format: 'E-Book' } },
	{ category: 'film', title: 'Lola rennt', creator: 'Tom Tykwer', year: 1998, catalog: 'seed-film-06', date: ago(25), fields: { where: 'TV' } },
	{ category: 'concert', title: 'Jazzfest', date: ago(32), rating: 3, fields: { location: 'Haus der Berliner Festspiele', city: 'Berlin' }, extra: [{ label: 'Highlight', value: 'Das Schlagzeugsolo im zweiten Set' }] },
	{ category: 'series', title: 'Dark', creator: 'Baran bo Odar & Jantje Friese', year: 2017, catalog: 'seed-series-02', date: ago(48), rating: 5, notes: 'Der Stammbaum an der Wand ist mittlerweile ein eigenes Kunstwerk. Wer ist eigentlich wessen Großvater?', fields: { season: 3, status: 'abgeschlossen', platform: 'Netflix' } },
	{ category: 'videogame', title: 'Zelda: Tears of the Kingdom', date: ago(60), rating: 5, notes: 'Endlich durch! Der letzte Kampf auf dem Drachen war episch.', fields: { platform: 'Switch', hours: 140, finished: true } },
	{ category: 'museum', title: 'Hamburger Bahnhof', date: ago(74), notes: 'Die Lichtinstallation im Keller war das Beste.', fields: { museum: 'Hamburger Bahnhof', city: 'Berlin', duration: '2 Stunden' }, visibility: 'private' },
	{ category: 'music', title: 'Random Access Memories', creator: 'Daft Punk', year: 2013, catalog: 'seed-music-05', date: ago(86), rating: 4, fields: { kind: 'Album', genre: 'Electronic' } },
	{ category: 'film', title: 'Good Bye, Lenin!', creator: 'Wolfgang Becker', year: 2003, catalog: 'seed-film-10', date: ago(97), rating: 4, notes: 'Immer noch so warmherzig. Die Spreewaldgurken!', fields: { where: 'Disc', with: 'Familie' } },
	{ category: 'book', title: 'Der Name der Rose', creator: 'Umberto Eco', year: 1980, catalog: 'seed-book-07', date: ago(115), rating: 3, notes: 'Die ersten hundert Seiten sind zäh, danach kann man nicht mehr aufhören.', fields: { format: 'Print', pages: 656 } },
	{ category: 'theater', title: 'Hamlet', creator: 'William Shakespeare', date: ago(131), rating: 4, notes: 'Lars Eidinger spielt wie im Fieber. Erde überall.', fields: { venue: 'Schaubühne', city: 'Berlin', director: 'Thomas Ostermeier', cast: 'Lars Eidinger' } },
	{ category: 'series', title: 'Fleabag', creator: 'Phoebe Waller-Bridge', year: 2016, catalog: 'seed-series-05', date: ago(150), rating: 5, fields: { season: 2, status: 'abgeschlossen' } },
	{ category: 'concert', title: 'Sommerkonzert', creator: 'Berliner Philharmoniker', date: ago(166), rating: 5, notes: 'Open Air in der Waldbühne, Picknick, Wunderkerzen bei der Zugabe.', fields: { location: 'Waldbühne', city: 'Berlin', with: 'Mara' } },
	{ category: 'film', title: 'Everything Everywhere All at Once', creator: 'Daniel Kwan & Daniel Scheinert', year: 2022, catalog: 'seed-film-09', date: ago(183), rating: 5, notes: 'Die Steine-Szene. Ich habe im Kino geweint wegen zwei Steinen.', fields: { where: 'Streaming' } },
	{ category: 'book', title: 'Das Parfum', creator: 'Patrick Süskind', year: 1985, catalog: 'seed-book-04', date: ago(201), fields: { format: 'Print' } },
	{ category: 'music', title: 'Rumours', creator: 'Fleetwood Mac', year: 1977, catalog: 'seed-music-06', date: ago(219), rating: 4 },
	{ category: 'museum', title: 'Neue Nationalgalerie', date: ago(236), rating: 4, fields: { museum: 'Neue Nationalgalerie', city: 'Berlin', favorite: 'Kirchner – Potsdamer Platz' } },
	{ category: 'film', title: 'Der Pate', creator: 'Francis Ford Coppola', year: 1972, catalog: 'seed-film-05', date: ago(255), rating: 4, notes: 'Endlich gesehen. Die Hochzeitsszene am Anfang ist ein Meisterwerk der Exposition.' },
	{ category: 'series', title: 'Breaking Bad', creator: 'Vince Gilligan', year: 2008, catalog: 'seed-series-01', date: ago(272), rating: 5, fields: { season: 5, status: 'abgeschlossen' } },
	{ category: 'opera', title: 'Die Zauberflöte', creator: 'Wolfgang Amadeus Mozart', date: ago(290), rating: 4, notes: 'Die Königin der Nacht hat den ganzen Saal festgenagelt.', fields: { house: 'Staatsoper Unter den Linden' } },
	{ category: 'book', title: '1984', creator: 'George Orwell', year: 1949, catalog: 'seed-book-05', date: ago(312), rating: 5, notes: 'Krieg ist Frieden. Beim Wiederlesen noch beklemmender.' },
	{ category: 'film', title: 'Chihiros Reise ins Zauberland', creator: 'Hayao Miyazaki', year: 2001, catalog: 'seed-film-07', date: ago(331), rating: 5, fields: { where: 'Kino', venue: 'Babylon', version: 'OmU' } },
	{ category: 'music', title: 'Die Mensch-Maschine', creator: 'Kraftwerk', year: 1978, catalog: 'seed-music-10', date: ago(349) },
	{ category: 'theater', title: 'Die Dreigroschenoper', creator: 'Bertolt Brecht', date: ago(371), rating: 4, fields: { venue: 'Berliner Ensemble', city: 'Berlin' } },
	{ category: 'concert', title: 'Unplugged', creator: 'AnnenMayKantereit', date: ago(393), rating: 4, notes: 'Henning Mays Stimme live ist noch rauer als auf Platte.' },
	{ category: 'book', title: 'Unterleuten', creator: 'Juli Zeh', year: 2016, catalog: 'seed-book-08', date: ago(412), rating: 4, notes: 'Brandenburg als Mikrokosmos. Jede Figur hat recht – und keine.', visibility: 'private' }
];

const ANNA_ENTRIES: SeedEntry[] = [
	{ category: 'film', title: 'Die fabelhafte Welt der Amélie', creator: 'Jean-Pierre Jeunet', year: 2001, catalog: 'seed-film-04', date: ago(0), rating: 5, notes: 'Zum zehnten Mal gesehen und immer noch verliebt in jede Crème brûlée.' },
	{ category: 'podcast', title: 'Zeit Verbrechen – Folge 210', date: ago(2), rating: 4, notes: 'Unglaublich gut recherchiert, ich musste danach kurz durchatmen.', fields: { host: 'Sabine Rückert', minutes: 58 } },
	{ category: 'book', title: 'Stolz und Vorurteil', creator: 'Jane Austen', year: 1813, catalog: 'seed-book-11', date: ago(6), rating: 5, notes: 'Mr. Darcys zweiter Antrag! Ich habe das Buch an die Brust gedrückt.', fields: { format: 'E-Book' } },
	{ category: 'concert', title: 'Abschlusskonzert', creator: 'Bundesjugendorchester', date: lastWeekDay(3), rating: 4, fields: { location: 'Konzerthaus', city: 'Berlin' } },
	{ category: 'series', title: 'Babylon Berlin', creator: 'Tom Tykwer, Achim von Borries & Henk Handloegten', year: 2017, catalog: 'seed-series-03', date: ago(14), rating: 5, notes: 'Die Tanzszene im Moka Efti ist das Beste, was das deutsche Fernsehen je gemacht hat.' },
	{ category: 'museum', title: 'Pergamonmuseum – Panorama', date: ago(27), rating: 3, fields: { city: 'Berlin' } },
	{ category: 'podcast', title: 'Lage der Nation – Folge 400', date: ago(39), fields: { host: 'Philip Banse & Ulf Buermeyer', minutes: 92 } },
	{ category: 'film', title: 'Perfect Days', creator: 'Wim Wenders', year: 2023, catalog: 'seed-film-12', date: ago(45), rating: 4, notes: 'Ich will jetzt auch Kassetten hören und Bäume fotografieren.' },
	{ category: 'book', title: 'Hundert Jahre Einsamkeit', creator: 'Gabriel García Márquez', year: 1967, catalog: 'seed-book-06', date: ago(80), rating: 5, visibility: 'private', notes: 'Privat: Die Stelle mit den gelben Schmetterlingen habe ich mir abfotografiert.' },
	{ category: 'theater', title: 'Faust', creator: 'Johann Wolfgang von Goethe', date: ago(120), rating: 3, notes: 'Vier Stunden, aber der zweite Teil hatte großartige Bilder.' },
	{ category: 'music', title: 'Mensch', creator: 'Herbert Grönemeyer', year: 2002, catalog: 'seed-music-07', date: ago(365), rating: 5, notes: 'Mein Trostalbum. Läuft immer, wenn es regnet.' }
];

const BEN_ENTRIES: SeedEntry[] = [
	{ category: 'film', title: 'Pulp Fiction', creator: 'Quentin Tarantino', year: 1994, catalog: 'seed-film-11', date: ago(3), rating: 5, notes: 'Dialoge zum Mitsprechen.' },
	{ category: 'music', title: 'To Pimp a Butterfly', creator: 'Kendrick Lamar', year: 2015, catalog: 'seed-music-08', date: ago(10), rating: 5 },
	{ category: 'series', title: 'The Wire', creator: 'David Simon', year: 2002, catalog: 'seed-series-04', date: ago(30), rating: 5, notes: 'Staffel 4 bricht mir das Herz.' },
	{ category: 'book', title: 'Sapiens', creator: 'Yuval Noah Harari', year: 2011, catalog: 'seed-book-10', date: ago(90), rating: 3 }
];

async function main() {
	if (!(await databaseIsReady(db))) {
		console.error('❌ Tabellen fehlen. Bitte zuerst `npm run db:push` ausführen.');
		process.exit(1);
	}

	console.log('🧹 Lösche bestehende Daten …');
	await db.delete(sessions);
	await db.delete(entries);
	await db.delete(friendships);
	const customCategoryIds = db
		.select({ id: categories.id })
		.from(categories)
		.where(isNotNull(categories.ownerId));
	await db.delete(categoryFields).where(inArray(categoryFields.categoryId, customCategoryIds));
	await db.delete(categories).where(isNotNull(categories.ownerId));
	await db.delete(users);
	await db.delete(catalogItems);

	console.log('📚 Lege eingebaute Kategorien und Bibliothek an …');
	await ensureBuiltins(db);

	console.log('👤 Lege Demo-Accounts an …');
	const passwordHash = await hashPassword(DEMO_PASSWORD);
	const demo = { id: randomUUID(), username: 'demo', displayName: 'Demo', passwordHash };
	const anna = { id: randomUUID(), username: 'anna', displayName: 'Anna', passwordHash };
	const ben = { id: randomUUID(), username: 'ben', displayName: 'Ben', passwordHash };
	// Die Rückblicke des Demo-Accounts gelten als ungesehen, damit der Hinweis auf Home erscheint.
	await db.insert(users).values([demo, anna, ben]);

	await db.insert(friendships).values([
		{ requesterId: anna.id, addresseeId: demo.id, status: 'accepted' },
		{ requesterId: ben.id, addresseeId: demo.id, status: 'pending' }
	]);

	console.log('🏷️  Lege eigene Kategorien an …');
	await db.insert(categories).values([
		{ id: 'demo-videogame', ownerId: demo.id, name: 'Videospiel', slug: 'videospiel', emoji: '🎮', color: '#0d9488', sortOrder: 100 },
		{ id: 'anna-podcast', ownerId: anna.id, name: 'Podcast', slug: 'podcast', emoji: '🎙️', color: '#65a30d', sortOrder: 100 }
	]);
	await db.insert(categoryFields).values([
		{ id: randomUUID(), categoryId: 'demo-videogame', key: 'platform', label: 'Plattform', type: 'select', options: ['PC', 'PlayStation', 'Switch', 'Xbox', 'Mobil'], sortOrder: 0 },
		{ id: randomUUID(), categoryId: 'demo-videogame', key: 'hours', label: 'Spielzeit (Std.)', type: 'number', sortOrder: 1 },
		{ id: randomUUID(), categoryId: 'demo-videogame', key: 'finished', label: 'Durchgespielt', type: 'boolean', sortOrder: 2 },
		{ id: randomUUID(), categoryId: 'anna-podcast', key: 'host', label: 'Host', type: 'people', sortOrder: 0 },
		{ id: randomUUID(), categoryId: 'anna-podcast', key: 'minutes', label: 'Länge (Min.)', type: 'number', sortOrder: 1 }
	]);

	const categoryIds: Record<string, string> = {
		videogame: 'demo-videogame',
		podcast: 'anna-podcast'
	};

	console.log('📝 Lege Einträge an …');
	const rows = [
		...DEMO_ENTRIES.map((e) => ({ e, userId: demo.id })),
		...ANNA_ENTRIES.map((e) => ({ e, userId: anna.id })),
		...BEN_ENTRIES.map((e) => ({ e, userId: ben.id }))
	].map(({ e, userId }, index) => {
		const [y, m, d] = e.date.split('-').map(Number);
		// Erstellt am Abend des Erlebnisses (gestaffelt, damit die Reihenfolge stabil ist)
		const created = new Date(y, m - 1, d, 20, index % 60);
		return {
			id: randomUUID(),
			userId,
			categoryId: categoryIds[e.category] ?? e.category,
			catalogItemId: e.catalog ?? null,
			title: e.title,
			creator: e.creator ?? null,
			year: e.year ?? null,
			experiencedAt: e.date,
			rating: e.rating ?? null,
			notes: e.notes ?? null,
			fieldValues: e.fields ?? {},
			extraFields: e.extra ?? [],
			visibility: e.visibility ?? ('friends' as const),
			createdAt: created,
			updatedAt: created
		};
	});
	await db.insert(entries).values(rows);

	console.log(`\n✅ Fertig! ${rows.length} Einträge für 3 Demo-Accounts angelegt.`);
	console.log(`   Login: demo / ${DEMO_PASSWORD}   (außerdem: anna, ben – gleiches Passwort)\n`);
}

main().catch((error) => {
	console.error('❌ Seed fehlgeschlagen:', error);
	process.exit(1);
});
