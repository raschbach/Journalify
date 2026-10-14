# 📓 Journalify

Dein persönliches **Logbuch für Kultur-Erlebnisse**: Filme, Serien, Bücher, Musik, Konzerte, Theater, Oper,
Museen und Ausstellungen – mit Datum, Bewertung und Notizen. Schnell eingetragen, übersichtlich dargestellt
und gezielt wieder in Erinnerung gerufen.

> Version 1 (MVP), lokal lauffähig unter Windows, macOS und Linux, am Handy im selben WLAN testbar.

---

## Schnellstart

Voraussetzung: **Node.js 22.17+ oder 24 LTS** (keine weiteren Build-Tools nötig).

```bash
npm install
npm run db:push     # legt die SQLite-Datenbank local.db an
npm run db:seed     # Demodaten (setzt alles zurück!)
npm run dev
```

Dann <http://localhost:5173> öffnen.

### Demo-Logins

| Benutzername | Passwort     | Rolle                                                 |
| ------------ | ------------ | ----------------------------------------------------- |
| `demo`       | `journalify` | Haupt-Account mit ~40 Einträgen über 14 Monate        |
| `anna`       | `journalify` | mit `demo` befreundet, teilt Einträge (inkl. Podcast) |
| `ben`        | `journalify` | hat `demo` eine offene Freundschaftsanfrage geschickt |

Die Demodaten werden **relativ zum heutigen Datum** erzeugt – „An diesem Tag“, Kalender sowie Wochen- und
Monatsrückblick haben also sofort Inhalte. `npm run db:seed` kann beliebig oft ausgeführt werden.

### Am Handy testen (gleiches WLAN)

```bash
npm run dev -- --host
```

Vite zeigt eine **Network**-Adresse an, z. B. `http://192.168.178.23:5173` – diese am Handy öffnen.
Unter Windows fragt die Firewall beim ersten Start nach – Zugriff im **privaten Netzwerk** erlauben.

Zum Home-Bildschirm hinzufügen: im Browser-Menü „Zum Startbildschirm hinzufügen“ (Android/Chrome) bzw.
Teilen → „Zum Home-Bildschirm“ (iOS/Safari). Die App startet dann im Vollbild mit eigenem Icon.

---

## Funktionen

| Bereich           | Was es kann                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home** (`/`)    | Großer „Erlebnis festhalten“-Button, Level-Fortschritt, Hinweis auf neue Wochen-/Monatsrückblicke, Feed mit Tabs **Ich** (nach Monaten gruppiert) und **Freunde**, „Mehr laden“.                                       |
| **Neuer Eintrag** | Kategorie-Raster (zuletzt genutzte zuerst) → Titel mit Autovervollständigung aus der Bibliothek → Datum (Heute/Gestern), Sterne, Notiz mit Schreibimpuls, Details, Sichtbarkeit. Live-XP-Vorschau, Level-Up-Animation. |
| **Eintrag**       | Alle Infos, Bearbeiten, Löschen mit Bestätigung. Fehlt die Notiz: „Notiz ergänzen (+20 XP)“ direkt auf der Seite. Einträge von Freund:innen sind nur lesbar.                                                           |
| **Erinnern**      | „An diesem Tag“ (Fallback: gleiche Kalenderwoche), zufällige Erinnerung mit Kategorie-Filter und „Noch eine“, Wochen- und Monatsrückblicke mit Vor/Zurück.                                                             |
| **Kalender**      | Monatsansicht mit farbigen Punkten (mobil) bzw. Chips (Desktop), Legende als Filter, Vor/Zurück, „Heute“, Wischen zum Monatswechsel, Tagesliste mit „Eintragen“ für genau diesen Tag.                                  |
| **Stöbern**       | Kategorie-Chips, Sortierung (Datum, Bewertung, Name, zuletzt hinzugefügt – auf/absteigend), Suche in Titeln, Notizen und Feldern, Mindestbewertung, Jahr, „nur mit Notiz“, Liste/Raster. Alles steht in der URL.       |
| **Profil**        | Level, XP, Fortschrittsbalken, Einträge gesamt und pro Kategorie, Ø-Bewertung, Anteil mit Notiz. Profile von Freund:innen unter `/u/[benutzername]`.                                                                   |
| **Freunde**       | Hinzufügen per exaktem Benutzernamen, Anfragen annehmen/ablehnen, eigene zurückziehen, Freund:innen entfernen.                                                                                                         |
| **Kategorien**    | Eigene Kategorien mit Name, Emoji, Farbe und Feld-Editor (hinzufügen, umbenennen, Typ wählen, sortieren, löschen).                                                                                                     |

### XP & Level

| Aktion                              | XP           |
| ----------------------------------- | ------------ |
| Eintrag erstellt                    | +10          |
| Bewertung vergeben                  | +5           |
| Notiz (ab 20 Zeichen)               | +20          |
| Ausführliche Notiz (ab 280 Zeichen) | +15 zusätzl. |

Level = ⌊√(XP / 50)⌋ + 1. XP werden **nie gespeichert**, sondern immer aus dem aktuellen Inhalt aller Einträge
berechnet – nachträgliche Notizen bringen XP, Löschen zieht sie ab, mehrfaches Speichern bringt nichts extra.
Level-Titel: Zuschauer:in → Entdecker:in → Kulturgänger:in → Stammgast → Kenner:in → Chronist:in →
Kritiker:in → Feuilletonist:in → Kulturikone (ab Level 10).

---

## Skripte

| Befehl              | Zweck                                                      |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Entwicklungsserver (`-- --host` für Zugriff im WLAN)       |
| `npm run db:push`   | Datenbankschema anlegen/aktualisieren (drizzle-kit)        |
| `npm run db:seed`   | Datenbank auf Demodaten zurücksetzen (**nur Entwicklung**) |
| `npm run db:studio` | Datenbank im Browser ansehen (Drizzle Studio)              |
| `npm run check`     | TypeScript- und Svelte-Prüfung                             |
| `npm run test`      | Unit-Tests (Vitest)                                        |
| `npm run lint`      | Prettier + ESLint                                          |
| `npm run format`    | Code formatieren                                           |

Die Datenbank liegt standardmäßig in `local.db` im Projektordner. Ein anderer Pfad lässt sich über die
Umgebungsvariable `DATABASE_URL` setzen (siehe `.env.example`) – eine `.env`-Datei ist **nicht** nötig.

---

## Projektstruktur

```
scripts/seed.ts                 Demodaten (relativ zum heutigen Datum)
src/
  app.html                      HTML-Gerüst, Manifest, Theme-Farben
  hooks.server.ts               Session-Prüfung, Login-Schutz, Datenbank-Vorbereitung
  env.ts                        Umgebungsvariablen (DATABASE_URL mit Standardwert)
  lib/
    xp.ts                       XP- und Level-Logik (rein, getestet)
    recap.ts                    Rückblicke & „An diesem Tag“ (rein, getestet)
    dates.ts                    Datumsrechnung & deutsche Formate (rein, getestet)
    browse.ts                   Filter & Sortierung für „Stöbern“ (rein, getestet)
    stats.ts                    Profil-Statistiken (rein, getestet)
    field-migration.ts          Werte retten, wenn Felder gelöscht/geändert werden (getestet)
    catalog-search.ts           Ranking der Titelsuche, akzentunabhängig (getestet)
    prompts.ts                  Schreibimpulse pro Kategorie
    types.ts                    gemeinsame Typen
    components/                 UI-Bausteine (EntryForm, EntryCard, StarInput, Toaster, …)
    server/
      db/schema.ts              Drizzle-Schema
      db/client.ts, index.ts    Datenbankverbindung (libsql)
      auth/                     Passwort-Hashing (scrypt) & Sessions
      builtins.ts               eingebaute Kategorien & Felder
      catalog/                  CatalogProvider-Interface + lokale Bibliothek
      data.ts                   Datenzugriff inkl. Berechtigungsprüfungen
      entry-form.ts             Validierung des Eintragsformulars
      categories.ts             eigene Kategorien inkl. Feld-Editor
  routes/
    (auth)/login, register      Anmeldung & Registrierung
    (app)/                      alle geschützten Seiten (Home, new, entries, remember,
                                calendar, browse, profile, u, friends, categories, logout)
    api/catalog                 JSON-Endpunkt für die Titelsuche
static/                         Icons & Web-App-Manifest
```

### Datenmodell

- **users**: id, username (eindeutig, klein geschrieben), displayName, passwordHash, recapSeenWeek/-Month, createdAt
- **sessions**: id (SHA-256 des Tokens), userId, expiresAt
- **friendships**: requesterId, addresseeId, status (`pending` | `accepted`), createdAt
- **categories**: id, ownerId (`null` = eingebaut), name, slug, emoji, color, creatorLabel, yearLabel, sortOrder
- **category_fields**: id, categoryId, key, label, type, options (JSON), placeholder, sortOrder
- **catalog_items**: id, categoryId, title, creator, year, metadata (JSON), source
- **entries**: id, userId, categoryId, catalogItemId, title, creator, year, coverUrl, experiencedAt
  (`YYYY-MM-DD`), rating, notes, fieldValues (JSON), extraFields (JSON), visibility, createdAt, updatedAt

---

## Getroffene Entscheidungen

**Technik**

- **SvelteKit 3 + Svelte 5 (Runes)**, TypeScript strict, Tailwind CSS 4, Drizzle ORM, Zod 4, Vitest.
  SvelteKit 3 ist seit Oktober 2026 die aktuelle Version. Die Konfiguration steckt in `vite.config.ts`,
  `$lib` heißt dort `#lib`.
- **`@libsql/client` statt `better-sqlite3`**: Es bringt fertige Binärdateien für Windows mit, braucht also
  keine Visual-Studio-Build-Tools – auch nicht bei neuen Node-Versionen.
- **`package-lock.json` ist eingecheckt.** Ohne Lockfile scheitert `npm install` mit npm 10 (Node 22) an
  einem npm-Bug („Cannot read properties of null (reading 'edgesOut')“). Mit Lockfile klappt es mit npm 10
  und 11.
- **Passwörter** mit `scrypt` aus `node:crypto`, **Sessions** als zufälliges Token im httpOnly-Cookie; in
  der Datenbank liegt nur dessen SHA-256-Hash. 30 Tage gültig, verlängert sich bei Nutzung.
- Das Session-Cookie ist nur bei HTTPS `secure` – sonst würde der Login am Handy über `http://192.168.…`
  nicht funktionieren.
- **Jede Route ist serverseitig geschützt**: `hooks.server.ts` leitet nicht angemeldete Nutzer:innen um,
  und jeder Datenzugriff prüft Besitz bzw. Freundschaft. Fremde private Einträge und Profile von
  Nicht-Freund:innen liefern 404 (verrät nicht, dass es sie gibt).
- Eingebaute Kategorien und die Bibliothek werden beim Serverstart automatisch angelegt bzw. aktualisiert
  (idempotent) – die App funktioniert also auch ohne Seed.
- Formulare funktionieren per _Progressive Enhancement_; mit JavaScript gibt es Ladezustände, Toasts und
  keine Seiten-Neuladungen. Meldungen nach Weiterleitungen laufen über ein kurzlebiges Flash-Cookie.

**Produkt & UX**

- **Eintragen in unter 20 Sekunden**: ➕ → Kategorie antippen → Titel tippen und Vorschlag wählen →
  Speichern. Datum ist vorausgefüllt, alle Details sind eingeklappt und optional.
- **„Ersteller:in“ und „Jahr“** sind eigene Spalten des Eintrags mit kategoriespezifischer Beschriftung
  (Film: „Regie“, Buch: „Autor:in“, Oper: „Komponist:in“ …). So landen Daten aus der Bibliothek einheitlich
  im Eintrag und erscheinen in Listen als Untertitel. Der Eintrag kopiert diese Daten (bleibt also
  vollständig, auch ohne Bibliothekseintrag).
- **Kategorie nachträglich ändern** ist möglich. Werte, die in der neuen Kategorie kein passendes Feld
  haben, werden automatisch als eigene Felder behalten.
- **Felder einer eigenen Kategorie löschen oder umtypisieren** verliert keine Daten: Unpassende Werte
  wandern als eigene Felder in die betroffenen Einträge.
- **Feed „Ich“** ist nach Erlebnisdatum sortiert (und nach Monaten gruppiert). **Feed „Freunde“** ist nach
  Eintragszeitpunkt sortiert – so sieht man, was Freund:innen zuletzt eingetragen haben, auch wenn das
  Erlebnis länger zurückliegt.
- **Profile von Freund:innen** zeigen Level und Statistiken nur auf Basis **geteilter** Einträge (Privat zuerst:
  private Einträge verraten sich auch nicht über Zahlen).
- **Rückblick-Hinweis** auf Home erscheint, wenn die letzte abgeschlossene Woche bzw. der letzte Monat
  Einträge hat und der Rückblick noch nicht angesehen oder ausgeblendet wurde.
- **„An diesem Tag“** zeigt am 28.02. eines Nicht-Schaltjahres auch Einträge vom 29.02.; Wochen-Fallback
  nach ISO-Kalenderwoche.
- **Stöbern** filtert und sortiert serverseitig in JavaScript statt in SQL – so funktionieren deutsche
  Sortierung (Ä bei A) und akzentunabhängige Suche („amelie“ findet „Amélie“). Für ein persönliches
  Logbuch ist das auch bei Tausenden Einträgen schnell genug.
- **Zurück-Taste**: Formulare ersetzen ihren Verlaufseintrag. Nach dem Speichern führt „Zurück“ deshalb nicht
  wieder ins Formular. Ungespeicherte Änderungen werden vor dem Verlassen abgefragt.
- Mobile-first ab 360 px ohne horizontales Scrollen, Touch-Ziele ≥ 44 px, Eingabefelder mit 16 px
  (verhindert Auto-Zoom auf iOS), Safe-Area für iPhones, Dark Mode nach Systemeinstellung,
  `prefers-reduced-motion` wird respektiert.
- Kein Bild-Upload: optional „Cover-URL“, sonst farbige Kachel mit Emoji.

---

## Bekannte Grenzen

- **Produktions-Build** (`npm run build && node build`): Der Node-Adapter von SvelteKit 3 erwartet hinter
  `node build` HTTPS bzw. einen Reverse-Proxy (sonst lehnt der CSRF-Schutz Formulare ab). Für v1 bitte
  `npm run dev` verwenden; für ein Deployment einen HTTPS-Proxy davorschalten.
- Datumsfelder (`<input type="date">`) zeigen das Format des Geräts/Browsers an – auf deutschen Geräten
  TT.MM.JJJJ. In der App selbst werden Daten immer als TT.MM.JJJJ angezeigt.
- Das „heutige Datum“ richtet sich nach der Uhrzeit des Rechners, auf dem der Server läuft.

## Nächste Schritte

- Externe Bibliotheken anbinden (TMDB für Film/Serie, Open Library für Bücher, MusicBrainz für Musik) –
  das `CatalogProvider`-Interface ist vorbereitet (`src/lib/server/catalog/index.ts`).
- Cover-Bilder automatisch aus der Bibliothek übernehmen bzw. Bild-Upload.
- Passwort ändern, Anzeigename ändern, Konto löschen, Daten-Export (JSON/CSV).
- Likes/Kommentare unter Einträgen von Freund:innen.
- Offline-Modus (Service Worker) und Push-Erinnerungen für Rückblicke.
- Migrationen mit `drizzle-kit generate` statt `push`, sobald echte Daten geschützt werden müssen.
- End-to-End-Tests (Playwright) im Repository.
