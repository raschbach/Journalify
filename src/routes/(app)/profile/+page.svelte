<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import ProfileStats from '#lib/components/ProfileStats.svelte';
	import { LONG_NOTE_MIN_LENGTH, NOTE_MIN_LENGTH, XP_RULES } from '#lib/xp.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Profil · Journalify</title>
</svelte:head>

<header class="mb-6 flex items-center gap-4">
	<Avatar name={data.me.displayName} size="lg" />
	<div class="min-w-0">
		<h1 class="truncate text-[1.7rem] leading-tight font-semibold">{data.me.displayName}</h1>
		<p class="text-muted">@{data.me.username}</p>
	</div>
</header>

<ProfileStats level={data.level} stats={data.stats} categories={data.categories} />

<details class="group card mt-4 overflow-hidden">
	<summary
		class="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden"
	>
		<span class="text-gold">✦</span>
		<span class="flex-1">So sammelst du XP</span>
		<Icon name="chevron-down" class="text-muted transition-transform group-open:rotate-180" />
	</summary>
	<ul class="space-y-2 border-t border-line px-4 py-4 text-sm">
		<li class="flex justify-between gap-4">
			<span>Eintrag erstellt</span><strong>+{XP_RULES.entry} XP</strong>
		</li>
		<li class="flex justify-between gap-4">
			<span>Bewertung vergeben</span><strong>+{XP_RULES.rating} XP</strong>
		</li>
		<li class="flex justify-between gap-4">
			<span>Notiz (ab {NOTE_MIN_LENGTH} Zeichen)</span><strong>+{XP_RULES.note} XP</strong>
		</li>
		<li class="flex justify-between gap-4">
			<span>Ausführliche Notiz (ab {LONG_NOTE_MIN_LENGTH} Zeichen)</span><strong
				>+{XP_RULES.longNote} XP</strong
			>
		</li>
		<li class="pt-1 text-muted">
			XP werden immer aus deinen aktuellen Einträgen berechnet: Ergänzt du später eine Notiz, gibt
			es die XP dazu. Löschst du einen Eintrag, werden seine XP abgezogen.
		</li>
	</ul>
</details>

<nav class="card mt-4 divide-y divide-line overflow-hidden" aria-label="Einstellungen">
	<a href="/friends" class="flex min-h-14 items-center gap-3 px-4 hover:bg-surface-2">
		<Icon name="users" class="text-muted" />
		<span class="flex-1 font-semibold">Freunde</span>
		{#if data.incomingRequests}
			<span class="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
				{data.incomingRequests} neu
			</span>
		{/if}
		<Icon name="chevron-right" class="text-muted" />
	</a>
	<a href="/categories" class="flex min-h-14 items-center gap-3 px-4 hover:bg-surface-2">
		<Icon name="tag" class="text-muted" />
		<span class="flex-1 font-semibold">Kategorien verwalten</span>
		<Icon name="chevron-right" class="text-muted" />
	</a>
	<form method="POST" action="/logout">
		<button
			class="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 text-left text-danger hover:bg-danger-soft"
		>
			<Icon name="logout" />
			<span class="flex-1 font-semibold">Abmelden</span>
		</button>
	</form>
</nav>
