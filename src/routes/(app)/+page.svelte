<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EntryCard from '#lib/components/EntryCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { formatMonth, formatRange, monthKey } from '#lib/dates.ts';
	import type { EntrySummary } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const level = $derived(data.level);
	const firstName = $derived(data.me.displayName.split(' ')[0]);

	/** Einträge nach Monat gruppieren (nur im eigenen Feed) */
	const groups = $derived.by(() => {
		if (data.tab !== 'me') return [{ key: '', label: '', items: data.feed }];
		const result: { key: string; label: string; items: EntrySummary[] }[] = [];
		for (const entry of data.feed) {
			const key = monthKey(entry.experiencedAt);
			let group = result.at(-1);
			if (!group || group.key !== key) {
				group = { key, label: formatMonth(key), items: [] };
				result.push(group);
			}
			group.items.push(entry);
		}
		return result;
	});

	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 5) return 'Gute Nacht';
		if (hour < 11) return 'Guten Morgen';
		if (hour < 18) return 'Hallo';
		return 'Guten Abend';
	});

	function moreHref() {
		const params = new URLSearchParams();
		if (data.tab === 'friends') params.set('feed', 'friends');
		params.set('n', String(data.limit + data.pageSize));
		return `?${params}`;
	}
</script>

<svelte:head>
	<title>Journalify</title>
</svelte:head>

<section class="mb-5">
	<h1 class="text-[1.9rem] leading-tight font-semibold">{greeting}, {firstName}!</h1>
	<a href="/profile" class="mt-2 flex items-center gap-3 rounded-xl py-1 text-sm" aria-label="Level {level.level}: {level.title}, {level.xp} XP – zum Profil">
		<span class="font-semibold whitespace-nowrap">
			<span class="text-gold">★</span> Level {level.level} · {level.title}
		</span>
		<span class="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-surface-3">
			<span class="block h-full rounded-full bg-gold" style:width="{Math.round(level.progress * 100)}%"></span>
		</span>
		<span class="whitespace-nowrap text-muted tabular-nums">{level.xpToNext} XP bis Lvl {level.level + 1}</span>
	</a>
</section>

<a
	href="/new"
	class="group mb-6 flex items-center gap-4 rounded-3xl bg-primary p-4 pr-5 text-primary-ink shadow-float transition active:scale-[0.99]"
>
	<span
		class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-[#1f1b16] transition group-hover:rotate-90"
	>
		<Icon name="plus" size={30} strokeWidth={2.6} />
	</span>
	<span class="min-w-0 flex-1">
		<span class="block font-display text-xl font-semibold">Erlebnis festhalten</span>
		<span class="block text-sm opacity-75">Film, Buch, Konzert … in Sekunden eingetragen</span>
	</span>
	<Icon name="chevron-right" class="opacity-60" />
</a>

{#if data.recaps.week || data.recaps.month}
	<div class="mb-6 space-y-3">
		{#each [data.recaps.week, data.recaps.month] as recap (recap?.type)}
			{#if recap}
				<div
					class="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft p-3 pl-4"
					transition:fade={{ duration: 150 }}
				>
					<span class="text-2xl" aria-hidden="true">{recap.type === 'week' ? '🗞️' : '📅'}</span>
					<a href="/remember/{recap.type}/{recap.key}" class="min-w-0 flex-1">
						<span class="block font-semibold">
							{recap.type === 'week' ? 'Dein Wochenrückblick ist da' : `Dein ${formatMonth(recap.key).split(' ')[0]}-Rückblick ist da`}
						</span>
						<span class="block text-sm text-ink-soft">
							{recap.type === 'week' ? formatRange(recap.start, recap.end) : formatMonth(recap.key)} ·
							{recap.count}
							{recap.count === 1 ? 'Erlebnis' : 'Erlebnisse'} – ansehen
						</span>
					</a>
					<form method="POST" action="?/dismissRecap" use:enhance>
						<input type="hidden" name="type" value={recap.type} />
						<button class="btn-icon" aria-label="Hinweis ausblenden"><Icon name="x" size={18} /></button>
					</form>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<div class="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 mb-4 bg-bg/90 px-4 py-2 backdrop-blur-md">
	<div class="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="Feed">
		{#each [{ id: 'me', label: 'Ich', href: '/' }, { id: 'friends', label: 'Freunde', href: '/?feed=friends' }] as tab (tab.id)}
			<a
				href={tab.href}
				role="tab"
				aria-selected={data.tab === tab.id}
				data-sveltekit-reset="false"
				data-sveltekit-replacestate
				class={[
					'flex min-h-10 items-center justify-center rounded-xl text-sm font-semibold transition',
					data.tab === tab.id ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
				]}
			>
				{tab.label}
			</a>
		{/each}
	</div>
</div>

<div role="tabpanel">
	{#if data.feed.length === 0}
		{#if data.tab === 'me'}
			<EmptyState emoji="📓" title="Dein Logbuch ist noch leer">
				Trag dein erstes Erlebnis ein – einen Film von gestern, das Buch auf deinem Nachttisch oder das letzte
				Konzert.
				{#snippet actions()}
					<a href="/new" class="btn btn-primary"><Icon name="plus" size={18} /> Ersten Eintrag anlegen</a>
				{/snippet}
			</EmptyState>
		{:else if data.friendCount === 0}
			<EmptyState emoji="👋" title="Noch keine Freund:innen">
				Füge Freund:innen über ihren Benutzernamen hinzu. Dann siehst du hier, was sie erleben.
				{#snippet actions()}
					<a href="/friends" class="btn btn-primary"><Icon name="user-plus" size={18} /> Freund:in hinzufügen</a>
				{/snippet}
			</EmptyState>
		{:else}
			<EmptyState emoji="🍿" title="Noch ruhig hier">
				Deine Freund:innen haben noch nichts geteilt.
			</EmptyState>
		{/if}
	{:else}
		{#each groups as group (group.key)}
			<section class="mb-6" aria-label={group.label || undefined}>
				{#if group.label}
					<h2 class="mb-2 px-1 font-sans text-xs font-bold tracking-wider text-muted uppercase">{group.label}</h2>
				{/if}
				<ul class="space-y-3">
					{#each group.items as entry (entry.id)}
						<li><EntryCard {entry} showAuthor={data.tab === 'friends'} /></li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if data.hasMore}
			<div class="flex justify-center">
				<a href={moreHref()} class="btn btn-secondary" data-sveltekit-reset="false" data-sveltekit-replacestate>
					Mehr laden
				</a>
			</div>
		{:else if data.feed.length > 5}
			<p class="py-4 text-center text-sm text-muted">
				{data.tab === 'me' ? `Das waren alle ${data.totalCount} Einträge. ✨` : 'Du bist auf dem neuesten Stand. ✨'}
			</p>
		{/if}
	{/if}
</div>
