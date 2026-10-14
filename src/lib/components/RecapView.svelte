<script lang="ts">
	import { formatMonth, formatRange, isoWeek } from '../dates';
	import type { Period, Recap } from '../recap';
	import type { CategoryInfo, EntrySummary } from '../types';
	import { noteLength } from '../xp';
	import EmptyState from './EmptyState.svelte';
	import EntryCard from './EntryCard.svelte';
	import Icon from './Icon.svelte';
	import PageHeader from './PageHeader.svelte';
	import Stars from './Stars.svelte';

	interface Props {
		data: {
			period: Period;
			recap: Recap<EntrySummary & { categoryId: string }>;
			categories: CategoryInfo[];
			prev: Period | null;
			next: Period | null;
			completed: boolean;
		};
	}

	let { data }: Props = $props();

	const isWeek = $derived(data.period.type === 'week');
	const recap = $derived(data.recap);
	const title = $derived(
		isWeek ? `KW ${isoWeek(data.period.start).week}` : formatMonth(data.period.key)
	);
	const subtitle = $derived(
		isWeek ? formatRange(data.period.start, data.period.end) : 'Monatsrückblick'
	);

	function label(p: Period) {
		return p.type === 'week' ? `KW ${isoWeek(p.start).week}` : formatMonth(p.key).split(' ')[0];
	}

	function href(p: Period) {
		return `/remember/${p.type}/${p.key}`;
	}

	const maxCount = $derived(Math.max(1, ...recap.byCategory.map((c) => c.count)));
	const categoryOf = (id: string) => {
		const fromList = data.categories.find((c) => c.id === id);
		if (fromList) return fromList;
		const entry = recap.entries.find((e) => e.categoryId === id);
		return entry?.category;
	};

	const avg = $derived(
		recap.averageRating === null
			? '–'
			: recap.averageRating.toLocaleString('de-DE', { maximumFractionDigits: 1 })
	);
	const notesCount = $derived(recap.entries.filter((e) => noteLength(e.notes) > 0).length);
</script>

<svelte:head>
	<title>{isWeek ? 'Wochenrückblick' : 'Monatsrückblick'} {title} · Journalify</title>
</svelte:head>

<PageHeader {title} {subtitle} back="/remember" backLabel="Zurück zu Erinnern" />

<nav class="-mt-2 mb-6 flex items-center justify-between gap-2" aria-label="Zeitraum wechseln">
	{#if data.prev}
		<a href={href(data.prev)} class="btn btn-secondary" data-sveltekit-replacestate>
			<Icon name="chevron-left" size={18} /> {label(data.prev)}
		</a>
	{:else}
		<span></span>
	{/if}
	<span class="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
		{isWeek ? 'Woche' : 'Monat'}{data.completed ? '' : ' läuft noch'}
	</span>
	{#if data.next}
		<a href={href(data.next)} class="btn btn-secondary" data-sveltekit-replacestate>
			{label(data.next)} <Icon name="chevron-right" size={18} />
		</a>
	{:else}
		<span></span>
	{/if}
</nav>

{#if recap.count === 0}
	<EmptyState emoji="🌙" title={isWeek ? 'Eine ruhige Woche' : 'Ein ruhiger Monat'}>
		In diesem Zeitraum hast du nichts eingetragen.
		{#snippet actions()}
			<a href="/new?date={data.period.start}" class="btn btn-primary">Nachtragen</a>
		{/snippet}
	</EmptyState>
{:else}
	<!-- Kennzahlen -->
	<div class="grid grid-cols-3 gap-2.5">
		<div class="card p-3.5 text-center">
			<p class="font-display text-3xl font-semibold">{recap.count}</p>
			<p class="text-xs text-muted">{recap.count === 1 ? 'Erlebnis' : 'Erlebnisse'}</p>
		</div>
		<div class="card p-3.5 text-center">
			<p class="font-display text-3xl font-semibold">{avg}<span class="text-xl text-gold"> ★</span></p>
			<p class="text-xs text-muted">Ø Bewertung</p>
		</div>
		<div class="card p-3.5 text-center">
			<p class="font-display text-3xl font-semibold text-gold">{recap.xp}</p>
			<p class="text-xs text-muted">XP gesammelt</p>
		</div>
	</div>

	<!-- Pro Kategorie -->
	<section class="card mt-4 p-4" aria-labelledby="per-category">
		<h2 id="per-category" class="mb-3 font-sans text-sm font-bold text-ink-soft">Nach Kategorie</h2>
		<ul class="space-y-2.5">
			{#each recap.byCategory as row (row.categoryId)}
				{@const cat = categoryOf(row.categoryId)}
				{#if cat}
					<li class="flex items-center gap-3 text-sm">
						<span class="w-32 shrink-0 truncate sm:w-40"><span aria-hidden="true">{cat.emoji}</span> {cat.name}</span>
						<span class="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
							<span
								class="block h-full rounded-full"
								style:width="{(row.count / maxCount) * 100}%"
								style:background-color={cat.color}
							></span>
						</span>
						<span class="w-6 text-right font-semibold tabular-nums">{row.count}</span>
					</li>
				{/if}
			{/each}
		</ul>
	</section>

	<!-- Highlights -->
	{#if recap.topRated || recap.longestNote}
		<div class="mt-4 grid gap-3 sm:grid-cols-2">
			{#if recap.topRated}
				<a href="/entries/{recap.topRated.id}" class="card block p-4 transition hover:shadow-float">
					<p class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gold uppercase">
						<Icon name="trophy" size={15} /> Bestbewertet
					</p>
					<p class="mt-1.5 font-semibold">
						<span aria-hidden="true">{recap.topRated.category.emoji}</span>
						{recap.topRated.title}
					</p>
					<Stars rating={recap.topRated.rating} size="sm" class="mt-1" />
				</a>
			{/if}
			{#if recap.longestNote}
				<a href="/entries/{recap.longestNote.entry.id}" class="card block p-4 transition hover:shadow-float">
					<p class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted uppercase">
						<Icon name="note" size={15} /> Längste Notiz · {recap.longestNote.length} Zeichen
					</p>
					<p class="mt-1.5 font-semibold">
						<span aria-hidden="true">{recap.longestNote.entry.category.emoji}</span>
						{recap.longestNote.entry.title}
					</p>
					<p class="mt-1 line-clamp-2 text-sm text-ink-soft">{recap.longestNote.entry.notes}</p>
				</a>
			{/if}
		</div>
	{/if}

	{#if notesCount < recap.count}
		<p class="mt-4 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink-soft">
			✍️ {recap.count - notesCount} {recap.count - notesCount === 1 ? 'Eintrag hat' : 'Einträge haben'} noch keine
			Notiz – jede bringt dir +20 XP.
		</p>
	{/if}

	<!-- Alle Einträge -->
	<section class="mt-8" aria-labelledby="all-entries">
		<h2 id="all-entries" class="section-title mb-3">Alle Einträge</h2>
		<ul class="space-y-3">
			{#each recap.entries as entry (entry.id)}
				<li><EntryCard {entry} /></li>
			{/each}
		</ul>
	</section>
{/if}

