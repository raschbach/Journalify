<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EntryCard from '#lib/components/EntryCard.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ProfileStats from '#lib/components/ProfileStats.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.user.displayName} · Journalify</title>
</svelte:head>

<PageHeader back="/friends" backLabel="Zurück" historyBack />

<header class="-mt-3 mb-6 flex items-center gap-4">
	<Avatar name={data.user.displayName} size="lg" />
	<div class="min-w-0">
		<h1 class="truncate text-[1.7rem] leading-tight font-semibold">{data.user.displayName}</h1>
		<p class="text-muted">@{data.user.username} · befreundet</p>
	</div>
</header>

<ProfileStats level={data.level} stats={data.stats} categories={data.categories} />
<p class="mt-2 text-center text-xs text-muted">Level und Statistiken basieren auf den geteilten Einträgen.</p>

<section class="mt-8" aria-labelledby="recent">
	<h2 id="recent" class="section-title mb-3">Zuletzt geteilt</h2>
	{#if data.recent.length}
		<ul class="space-y-3">
			{#each data.recent as entry (entry.id)}
				<li><EntryCard {entry} /></li>
			{/each}
		</ul>
	{:else}
		<EmptyState emoji="🍃" title="Noch nichts geteilt">{data.user.displayName} hat noch keine Einträge für Freunde freigegeben.</EmptyState>
	{/if}
</section>
