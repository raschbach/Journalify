// Kleine lokale Bibliothek mit bekannten Titeln (v1). Später ersetzbar durch
// externe Provider (TMDB, Open Library, MusicBrainz).

export interface CatalogSeedItem {
	id: string;
	categoryId: string;
	title: string;
	creator: string | null;
	year: number | null;
	metadata: Record<string, string> | null;
}

type Row = [title: string, creator: string, year: number, genre: string];

const FILMS: Row[] = [
	['Inception', 'Christopher Nolan', 2010, 'Science-Fiction'],
	['Das Leben der Anderen', 'Florian Henckel von Donnersmarck', 2006, 'Drama'],
	['Parasite', 'Bong Joon-ho', 2019, 'Thriller'],
	['Die fabelhafte Welt der Amélie', 'Jean-Pierre Jeunet', 2001, 'Komödie'],
	['Der Pate', 'Francis Ford Coppola', 1972, 'Krimi'],
	['Lola rennt', 'Tom Tykwer', 1998, 'Thriller'],
	['Chihiros Reise ins Zauberland', 'Hayao Miyazaki', 2001, 'Animation'],
	['Oppenheimer', 'Christopher Nolan', 2023, 'Drama'],
	['Everything Everywhere All at Once', 'Daniel Kwan & Daniel Scheinert', 2022, 'Science-Fiction'],
	['Good Bye, Lenin!', 'Wolfgang Becker', 2003, 'Tragikomödie'],
	['Pulp Fiction', 'Quentin Tarantino', 1994, 'Krimi'],
	['Perfect Days', 'Wim Wenders', 2023, 'Drama']
];

const SERIES: Row[] = [
	['Breaking Bad', 'Vince Gilligan', 2008, 'Drama'],
	['Dark', 'Baran bo Odar & Jantje Friese', 2017, 'Mystery'],
	['Babylon Berlin', 'Tom Tykwer, Achim von Borries & Henk Handloegten', 2017, 'Krimi'],
	['The Wire', 'David Simon', 2002, 'Krimi'],
	['Fleabag', 'Phoebe Waller-Bridge', 2016, 'Comedy'],
	['Succession', 'Jesse Armstrong', 2018, 'Drama'],
	['Severance', 'Dan Erickson', 2022, 'Science-Fiction'],
	['The Bear', 'Christopher Storer', 2022, 'Drama'],
	['Stranger Things', 'Matt & Ross Duffer', 2016, 'Mystery'],
	['Haus des Geldes', 'Álex Pina', 2017, 'Thriller'],
	['Der Tatortreiniger', 'Mizzi Meyer', 2011, 'Comedy']
];

const BOOKS: Row[] = [
	['Der Vorleser', 'Bernhard Schlink', 1995, 'Roman'],
	['Die Verwandlung', 'Franz Kafka', 1915, 'Erzählung'],
	['Tschick', 'Wolfgang Herrndorf', 2010, 'Jugendroman'],
	['Das Parfum', 'Patrick Süskind', 1985, 'Roman'],
	['1984', 'George Orwell', 1949, 'Dystopie'],
	['Hundert Jahre Einsamkeit', 'Gabriel García Márquez', 1967, 'Roman'],
	['Der Name der Rose', 'Umberto Eco', 1980, 'Krimi'],
	['Unterleuten', 'Juli Zeh', 2016, 'Roman'],
	['Die Vermessung der Welt', 'Daniel Kehlmann', 2005, 'Roman'],
	['Sapiens', 'Yuval Noah Harari', 2011, 'Sachbuch'],
	['Stolz und Vorurteil', 'Jane Austen', 1813, 'Klassiker'],
	['Kairos', 'Jenny Erpenbeck', 2021, 'Roman']
];

const MUSIC: Row[] = [
	['Abbey Road', 'The Beatles', 1969, 'Rock'],
	['OK Computer', 'Radiohead', 1997, 'Alternative'],
	['Thriller', 'Michael Jackson', 1982, 'Pop'],
	['Kind of Blue', 'Miles Davis', 1959, 'Jazz'],
	['Random Access Memories', 'Daft Punk', 2013, 'Electronic'],
	['Rumours', 'Fleetwood Mac', 1977, 'Rock'],
	['Mensch', 'Herbert Grönemeyer', 2002, 'Pop'],
	['To Pimp a Butterfly', 'Kendrick Lamar', 2015, 'Hip-Hop'],
	['Blond', 'Frank Ocean', 2016, 'R&B'],
	['Die Mensch-Maschine', 'Kraftwerk', 1978, 'Electronic'],
	['Bohemian Rhapsody', 'Queen', 1975, 'Rock'],
	['Goldberg-Variationen', 'Glenn Gould (Johann Sebastian Bach)', 1981, 'Klassik']
];

function toItems(categoryId: string, rows: Row[]): CatalogSeedItem[] {
	return rows.map(([title, creator, year, genre], index) => ({
		id: `seed-${categoryId}-${String(index + 1).padStart(2, '0')}`,
		categoryId,
		title,
		creator,
		year,
		metadata: { genre }
	}));
}

export const CATALOG_SEED: CatalogSeedItem[] = [
	...toItems('film', FILMS),
	...toItems('series', SERIES),
	...toItems('book', BOOKS),
	...toItems('music', MUSIC)
];
