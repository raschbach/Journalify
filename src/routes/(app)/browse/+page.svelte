<script lang="ts">
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import Cover from '#lib/components/Cover.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EntryCard from '#lib/components/EntryCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import {
		browseQuery,
		DEFAULT_DIR,
		SORT_FIELDS,
		SORT_LABELS,
		type BrowseParams,
		type SortField
	} from '#lib/browse.ts';
	import { formatDate } from '#lib/dates.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const p = $derived(data.params);
	// svelte-ignore state_referenced_locally
	let q = $state(data.params.q);
	let searchFocused = $state(false);
	// svelte-ignore state_referenced_locally
	let filtersOpen = $state(!!(data.params.minRating || data.params.year || data.params.withNotes));
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Suchfeld synchron halten (z. B. bei Zurück-Navigation), solange nicht getippt wird
	$effect(() => {
		const value = data.params.q;
		if (!searchFocused) q = value;
	});

	const activeFilters = $derived((p.minRating ? 1 : 0) + (p.year ? 1 : 0) + (p.withNotes ? 1 : 0));

	function apply(change: Partial<BrowseParams>) {
		const next = { ...p, q, ...change };
		goto(`/browse${browseQuery(next)}`, { replace: true, reset: false });
	}

	function onSearchInput() {
		clearTimeout(timer);
		timer = setTimeout(() => apply({ q }), 300);
	}

	function moreHref() {
		const query = browseQuery(p);
		return `/browse${query}${query ? '&' : '?'}n=${data.limit + data.pageSize}`;
	}
</script>

<svelte:head>
	<title>Stöbern · Journalify</title>
</svelte:head>

<header class="mb-4">
	<h1 class="text-[1.7rem] leading-tight font-semibold">Stöbern</h1>
	<p class="text-sm text-muted">
		{data.total}
		{data.total === 1 ? 'Eintrag' : 'Einträge'}{p.q || activeFilters || p.category ? ' gefunden' : ' in deinem Logbuch'}
	</p>
</header>

<form
	role="search"
	class="relative mb-3"
	onsubmit={(e) => {
		e.preventDefault();
		clearTimeout(timer);
		apply({ q });
	}}
>
	<Icon name="search" size={19} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
	<label for="browse-search" class="sr-only">Suche in Titeln, Notizen und Feldern</label>
	<input
		id="browse-search"
		type="search"
		class="input pr-11 pl-11"
		placeholder="Titel, Notizen, Personen …"
		enterkeyhint="search"
		bind:value={q}
		oninput={onSearchInput}
		onfocus={() => (searchFocused = true)}
		onblur={() => (searchFocused = false)}
	/>
	{#if q}
		<button
			type="button"
			class="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-2"
			aria-label="Suche leeren"
			onclick={() => {
				q = '';
				apply({ q: '' });
			}}
		>
			<Icon name="x" size={17} />
		</button>
	{/if}
</form>

<div class="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Kategorie">
	<button type="button" class="chip" aria-pressed={!p.category} onclick={() => apply({ category: null })}>Alle</button>
	{#each data.categories as category (category.id)}
		<button
			type="button"
			class="chip"
			aria-pressed={p.category === category.slug}
			onclick={() => apply({ category: p.category === category.slug ? null : category.slug })}
		>
			<span aria-hidden="true">{category.emoji}</span>
			{category.name}
		</button>
	{/each}
</div>

<div class="mb-3 flex items-center gap-2">
	<label for="sort" class="sr-only">Sortieren nach</label>
	<select
		id="sort"
		class="input h-11 w-auto min-w-0 flex-1 py-0 text-sm font-semibold sm:flex-none"
		value={p.sort}
		onchange={(e) => {
			const sort = e.currentTarget.value as SortField;
			apply({ sort, dir: DEFAULT_DIR[sort] });
		}}
	>
		{#each SORT_FIELDS as field (field)}
			<option value={field}>{SORT_LABELS[field]}</option>
		{/each}
	</select>
	<button
		type="button"
		class="btn btn-secondary px-3"
		aria-label={p.dir === 'asc' ? 'Aufsteigend sortiert – umkehren' : 'Absteigend sortiert – umkehren'}
		title={p.dir === 'asc' ? 'Aufsteigend' : 'Absteigend'}
		onclick={() => apply({ dir: p.dir === 'asc' ? 'desc' : 'asc' })}
	>
		<Icon name={p.dir === 'asc' ? 'arrow-up' : 'arrow-down'} size={18} />
		<span class="hidden sm:inline">{p.dir === 'asc' ? 'Aufsteigend' : 'Absteigend'}</span>
	</button>
	<button
		type="button"
		class={['btn px-3', activeFilters ? 'btn-primary' : 'btn-secondary']}
		aria-expanded={filtersOpen}
		aria-controls="filter-panel"
		onclick={() => (filtersOpen = !filtersOpen)}
	>
		<Icon name="sliders" size={18} />
		<span>Filter{activeFilters ? ` (${activeFilters})` : ''}</span>
	</button>
	<div class="ml-auto flex rounded-xl bg-surface-2 p-0.5" role="group" aria-label="Ansicht">
		<button
			type="button"
			class={['flex size-10 cursor-pointer items-center justify-center rounded-[0.6rem]', p.view === 'list' ? 'bg-surface shadow-card' : 'text-muted']}
			aria-label="Listenansicht"
			aria-pressed={p.view === 'list'}
			onclick={() => apply({ view: 'list' })}
		>
			<Icon name="list" size={18} />
		</button>
		<button
			type="button"
			class={['flex size-10 cursor-pointer items-center justify-center rounded-[0.6rem]', p.view === 'grid' ? 'bg-surface shadow-card' : 'text-muted']}
			aria-label="Rasteransicht"
			aria-pressed={p.view === 'grid'}
			onclick={() => apply({ view: 'grid' })}
		>
			<Icon name="grid" size={18} />
		</button>
	</div>
</div>

{#if filtersOpen}
	<div id="filter-panel" class="card mb-4 space-y-4 p-4" transition:slide={{ duration: 180 }}>
		<fieldset>
			<legend class="label">Mindestbewertung</legend>
			<div class="flex flex-wrap gap-2">
				<button type="button" class="chip" aria-pressed={!p.minRating} onclick={() => apply({ minRating: null })}>
					Alle
				</button>
				{#each [1, 2, 3, 4, 5] as stars (stars)}
					<button
						type="button"
						class="chip"
						aria-pressed={p.minRating === stars}
						aria-label="Mindestens {stars} {stars === 1 ? 'Stern' : 'Sterne'}"
						onclick={() => apply({ minRating: p.minRating === stars ? null : stars })}
					>
						{stars}<span class="text-gold">★</span>{stars < 5 ? '+' : ''}
					</button>
				{/each}
			</div>
		</fieldset>
		<div class="flex flex-wrap items-end gap-4">
			<div>
				<label for="year" class="label">Jahr</label>
				<select
					id="year"
					class="input w-36"
					value={p.year ? String(p.year) : ''}
					onchange={(e) => apply({ year: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
				>
					<option value="">Alle Jahre</option>
					{#each data.years as year (year)}
						<option value={String(year)}>{year}</option>
					{/each}
				</select>
			</div>
			<label class="flex min-h-11 cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					class="size-5 accent-[var(--ink)]"
					checked={p.withNotes}
					onchange={(e) => apply({ withNotes: e.currentTarget.checked })}
				/>
				<span class="font-medium">Nur mit Notiz</span>
			</label>
		</div>
		{#if activeFilters}
			<button
				type="button"
				class="btn btn-ghost -ml-2 px-2 text-sm"
				onclick={() => apply({ minRating: null, year: null, withNotes: false })}
			>
				<Icon name="x" size={16} /> Filter zurücksetzen
			</button>
		{/if}
	</div>
{/if}

{#if data.results.length === 0}
	<EmptyState emoji="🔍" title="Nichts gefunden">
		{p.q ? `Keine Treffer für „${p.q}“.` : 'Keine Einträge passen zu diesen Filtern.'}
		{#snippet actions()}
			{#if p.q || activeFilters || p.category}
				<a href="/browse" class="btn btn-secondary" data-sveltekit-replacestate>Alles zurücksetzen</a>
			{:else}
				<a href="/new" class="btn btn-primary">Ersten Eintrag anlegen</a>
			{/if}
		{/snippet}
	</EmptyState>
{:else if p.view === 'grid'}
	<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each data.results as entry (entry.id)}
			<li>
				<a href="/entries/{entry.id}" class="card block h-full overflow-hidden transition hover:shadow-float">
					<Cover {entry} category={entry.category} size="fill" />
					<div class="p-3">
						<h2 class="line-clamp-2 font-sans text-sm leading-snug font-semibold tracking-normal">{entry.title}</h2>
						<p class="mt-0.5 text-xs text-muted">{formatDate(entry.experiencedAt)}</p>
						<Stars rating={entry.rating} class="mt-1" />
					</div>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<ul class="space-y-3">
		{#each data.results as entry (entry.id)}
			<li><EntryCard {entry} /></li>
		{/each}
	</ul>
{/if}

{#if data.results.length < data.total}
	<div class="mt-5 flex justify-center">
		<a href={moreHref()} class="btn btn-secondary" data-sveltekit-reset="false" data-sveltekit-replacestate>
			Mehr laden ({data.total - data.results.length} weitere)
		</a>
	</div>
{/if}
