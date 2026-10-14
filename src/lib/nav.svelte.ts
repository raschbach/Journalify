// Merkt sich, ob es innerhalb der App eine vorherige Seite gibt. Dann kann
// „Zurück“ per history.back() zurückspringen (inkl. Scrollposition).

export const navHistory = $state({ internal: false });
