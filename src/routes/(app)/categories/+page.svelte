<script lang="ts">
	import CategoryIcon from '#lib/components/CategoryIcon.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const countLabel = (n: number) => (n === 1 ? '1 Eintrag' : `${n} Einträge`);
</script>

<svelte:head>
	<title>Kategorien · Journalify</title>
</svelte:head>

<PageHeader title="Kategorien" subtitle="Lege eigene Kategorien mit passenden Feldern an." back="/profile" backLabel="Zum Profil">
	{#snippet actions()}
		<a href="/categories/new" class="btn btn-primary"><Icon name="plus" size={18} /> Neu</a>
	{/snippet}
</PageHeader>

<section class="mb-8" aria-labelledby="custom">
	<h2 id="custom" class="section-title mb-3">Eigene Kategorien</h2>
	{#if data.custom.length}
		<ul class="card divide-y divide-line overflow-hidden">
			{#each data.custom as category (category.id)}
				<li>
					<a href="/categories/{category.id}" class="flex items-center gap-3 p-3.5 hover:bg-surface-2">
						<CategoryIcon emoji={category.emoji} color={category.color} />
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold">{category.name}</span>
							<span class="block truncate text-sm text-muted">
								{category.fields.length
									? category.fields.map((f) => f.label).join(', ')
									: 'Keine zusätzlichen Felder'} · {countLabel(category.entryCount)}
							</span>
						</span>
						<Icon name="pencil" size={18} class="text-muted" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState emoji="🏷️" title="Noch keine eigenen Kategorien">
			Podcasts, Videospiele, Restaurants, Reisen … – leg an, was dir fehlt.
			{#snippet actions()}
				<a href="/categories/new" class="btn btn-primary"><Icon name="plus" size={18} /> Kategorie anlegen</a>
			{/snippet}
		</EmptyState>
	{/if}
</section>

<section aria-labelledby="builtin">
	<h2 id="builtin" class="section-title mb-1">Eingebaute Kategorien</h2>
	<p class="mb-3 text-sm text-muted">Diese Kategorien gibt es für alle. Ihre Felder sind feste Vorschläge.</p>
	<ul class="card divide-y divide-line overflow-hidden">
		{#each data.builtin as category (category.id)}
			<li class="flex items-center gap-3 p-3.5">
				<CategoryIcon emoji={category.emoji} color={category.color} />
				<span class="min-w-0 flex-1">
					<span class="block truncate font-semibold">{category.name}</span>
					<span class="block truncate text-sm text-muted">
						{[category.creatorLabel, ...category.fields.map((f) => f.label)].filter(Boolean).join(', ')}
					</span>
				</span>
				<span class="shrink-0 text-sm text-muted tabular-nums">{category.entryCount}</span>
			</li>
		{/each}
	</ul>
</section>
