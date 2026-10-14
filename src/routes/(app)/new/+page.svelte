<script lang="ts">
	import EntryForm from '#lib/components/EntryForm.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import { formatDate } from '#lib/dates.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function categoryHref(slug: string) {
		const params = new URLSearchParams({ category: slug });
		if (data.date !== data.today) params.set('date', data.date);
		return `?${params}`;
	}
</script>

<svelte:head>
	<title>Neuer Eintrag · Journalify</title>
</svelte:head>

{#if data.selected}
	<PageHeader
		title="Neuer Eintrag"
		back={data.date !== data.today ? `/new?date=${data.date}` : '/new'}
		backLabel="Andere Kategorie wählen"
		replace
	/>
	{#key data.selected}
		<EntryForm
			categories={data.categories}
			initial={data.initial}
			mode="create"
			today={data.today}
			errors={form?.errors}
		/>
	{/key}
{:else}
	<PageHeader
		title="Was hast du erlebt?"
		subtitle={data.date !== data.today
			? `Für den ${formatDate(data.date)}`
			: 'Wähle eine Kategorie'}
		back="/"
		backLabel="Abbrechen"
	/>

	<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each data.categories as category (category.id)}
			<li>
				<a
					href={categoryHref(category.slug)}
					data-sveltekit-replacestate
					class="cat-tint flex min-h-28 flex-col justify-between rounded-2xl border border-transparent p-4 transition hover:border-line active:scale-[0.98]"
					style:--cat={category.color}
				>
					<span class="text-4xl leading-none" aria-hidden="true">{category.emoji}</span>
					<span class="cat-text mt-3 font-display text-lg leading-tight font-semibold"
						>{category.name}</span
					>
				</a>
			</li>
		{/each}
		<li>
			<a
				href="/categories/new"
				class="flex min-h-28 flex-col justify-between rounded-2xl border border-dashed border-line p-4 text-muted transition hover:bg-surface-2 hover:text-ink"
			>
				<span
					class="flex size-10 items-center justify-center rounded-full bg-surface-2 text-2xl"
					aria-hidden="true">+</span
				>
				<span class="mt-3 text-sm leading-tight font-semibold">Eigene Kategorie anlegen</span>
			</a>
		</li>
	</ul>
	<p class="mt-4 text-center text-sm text-muted">Zuletzt genutzte Kategorien stehen oben.</p>
{/if}
