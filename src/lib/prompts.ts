// Schreibimpulse für das Notizfeld – passend zur Kategorie.

const PROMPTS: Record<string, string[]> = {
	film: [
		'Welche Szene ist dir hängen geblieben?',
		'Welches Bild aus dem Film hast du noch vor Augen?',
		'Wie hast du dich beim Abspann gefühlt?',
		'Welche Figur würdest du gern wiedersehen?',
		'Was hättest du anders inszeniert?'
	],
	series: [
		'Welche Folge war die stärkste – und warum?',
		'Welche Figur hat sich am meisten verändert?',
		'Was hat dich weiterschauen lassen?',
		'Welcher Moment kam völlig unerwartet?'
	],
	book: [
		'Welcher Satz aus dem Buch bleibt?',
		'Welche Figur würdest du gern treffen?',
		'Wo und wann hast du am liebsten darin gelesen?',
		'Hat das Buch deinen Blick auf etwas verändert?'
	],
	music: [
		'Welcher Song läuft seitdem in deinem Kopf?',
		'Zu welchem Moment passt diese Musik perfekt?',
		'Welche Zeile hat dich erwischt?',
		'Woran erinnert dich der Klang?'
	],
	concert: [
		'Wie war die Stimmung im Saal?',
		'Welcher Song war der Höhepunkt?',
		'Gab es einen Moment, in dem alle still wurden?',
		'Was hat die Band zwischen den Songs erzählt?'
	],
	theater: [
		'Wie war die Stimmung im Saal?',
		'Welches Bild auf der Bühne bleibt dir?',
		'Welche Schauspielerin, welcher Schauspieler hat dich gepackt?',
		'Worüber habt ihr in der Pause gesprochen?'
	],
	opera: [
		'Welche Arie hat dich berührt?',
		'Wie hat die Inszenierung die Geschichte erzählt?',
		'Welche Stimme klingt noch nach?',
		'Wie war der Moment, als der Vorhang fiel?'
	],
	museum: [
		'Vor welchem Werk bist du am längsten stehen geblieben?',
		'Was hat dich überrascht?',
		'Welches Werk würdest du gern zu Hause aufhängen?',
		'Welche Farbe, welches Detail bleibt dir in Erinnerung?'
	]
};

const GENERIC = [
	'Was ist dir besonders in Erinnerung geblieben?',
	'Wie hast du dich dabei gefühlt?',
	'Was würdest du einer Freundin oder einem Freund davon erzählen?',
	'Welcher Moment war der beste?',
	'Was möchtest du in einem Jahr noch darüber wissen?'
];

export function promptsFor(slug: string | undefined): string[] {
	return (slug && PROMPTS[slug]) || GENERIC;
}

/** Zufälliger Impuls, möglichst nicht derselbe wie der vorige. */
export function randomPrompt(slug: string | undefined, previous?: string): string {
	const list = promptsFor(slug);
	const candidates = list.length > 1 ? list.filter((p) => p !== previous) : list;
	return candidates[Math.floor(Math.random() * candidates.length)];
}
