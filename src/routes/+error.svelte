<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Nicht gefunden' : 'Fehler'} · Journalify</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
	<div class="mb-4 text-6xl" aria-hidden="true">{page.status === 404 ? '🧭' : '🎭'}</div>
	<h1 class="text-3xl font-semibold">
		{page.status === 404 ? 'Hier ist nichts.' : 'Da ist etwas schiefgelaufen.'}
	</h1>
	<p class="mt-2 text-muted">
		{#if page.status === 404}
			Die Seite oder der Eintrag existiert nicht – oder ist nicht für dich freigegeben.
		{:else}
			{page.error?.message ?? 'Unbekannter Fehler'} – bitte versuche es noch einmal.
		{/if}
	</p>
	<a href="/" class="btn btn-primary mt-6">Zur Startseite</a>
</main>
