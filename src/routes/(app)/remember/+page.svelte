<script lang="ts">
	import { slide } from 'svelte/transition';
	import Cover from '#lib/components/Cover.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EntryCard from '#lib/components/EntryCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import {
		formatDateLong,
		formatDayMonth,
		formatMonth,
		formatRange,
		isoWeek,
		relativeLabel,
		yearsAgoLabel
	} from '#lib/dates.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const random = $derived(data.random);

	function randomHref(slug: string | null, after?: string) {
		const params = new URLSearchParams();
		if (slug) params.set('category', slug);
		if (after) params.set('after', after);
		const query = params.toString();
		return query ? `?${query}` : '/remember';
	}

	const avg = (value: number | null) =>
		value === null ? '–' : value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
</script>

<svelte:head>
	<title>Erinnern · Journalify</title>
</svelte:head>

<PageHeader title="Erinnern" subtitle="Hol deine Erlebnisse zurück ins Gedächtnis." />

<!-- An diesem Tag -->
<section class="mb-9" aria-labelledby="on-this-day">
	<div class="mb-3 flex items-baseline justify-between gap-3">
		<h2 id="on-this-day" class="section-title">An diesem Tag</h2>
		<span class="text-sm text-muted">{formatDayMonth(data.today)}</span>
	</div>

	{#if data.memories.mode === 'none'}
		<EmptyState emoji="🕰️" title="Noch keine Erinnerungen an diesem Tag">
			Was du heute einträgst, taucht hier in einem Jahr wieder auf.
		</EmptyState>
	{:else}
		{#if data.memories.mode === 'week'}
			<p class="mb-3 text-sm text-muted">
				Am {formatDayMonth(data.today)} gab es nichts – aber in dieser Kalenderwoche (KW {isoWeek(data.today).week}) früherer
				Jahre:
			</p>
		{/if}
		<div class="space-y-5">
			{#each data.memories.groups as group (group.yearsAgo)}
				<div>
					<h3 class="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-ink-soft">
						<span class="rounded-full bg-gold-soft px-2.5 py-0.5 text-gold">{yearsAgoLabel(group.yearsAgo)}</span>
						<span class="font-normal text-muted">{group.year}</span>
					</h3>
					<ul class="space-y-3">
						{#each group.entries as entry (entry.id)}
							<li><EntryCard {entry} /></li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- Zufällige Erinnerung -->
<section class="mb-9" aria-labelledby="random-memory">
	<h2 id="random-memory" class="section-title mb-3">Zufällige Erinnerung</h2>

	<div class="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Nach Kategorie filtern">
		<a
			href={randomHref(null)}
			class="chip"
			aria-current={data.filter === null ? 'true' : undefined}
			data-sveltekit-reset="false"
			data-sveltekit-replacestate>Alle</a
		>
		{#each data.categories as category (category.id)}
			<a
				href={randomHref(category.slug)}
				class="chip"
				aria-current={data.filter === category.slug ? 'true' : undefined}
				data-sveltekit-reset="false"
				data-sveltekit-replacestate
			>
				<span aria-hidden="true">{category.emoji}</span>
				{category.name}
			</a>
		{/each}
	</div>

	{#if random}
		{#key random.id}
			<article
				class="card overflow-hidden"
				in:slide={{ duration: 250 }}
			>
				<div class="cat-tint relative px-5 pt-5 pb-4" style:--cat={random.category.color}>
					<div class="flex items-start gap-4">
						<Cover entry={random} category={random.category} size="lg" class="shadow-card" />
						<div class="min-w-0 flex-1">
							<p class="cat-text text-sm font-semibold">
								{random.category.emoji}
								{random.category.name} · {relativeLabel(random.experiencedAt, data.today)}
							</p>
							<h3 class="mt-1 text-2xl leading-tight font-semibold break-words">{random.title}</h3>
							{#if random.creator || random.year}
								<p class="mt-0.5 text-sm text-ink-soft">{[random.creator, random.year].filter(Boolean).join(' · ')}</p>
							{/if}
							<p class="mt-2 text-sm text-ink-soft">{formatDateLong(random.experiencedAt)}</p>
							<Stars rating={random.rating} size="md" class="mt-1" />
						</div>
					</div>
				</div>
				{#if random.notes}
					<blockquote class="px-5 pt-4 text-[1.05rem] leading-relaxed whitespace-pre-line text-ink">
						<span class="line-clamp-6">„{random.notes}“</span>
					</blockquote>
				{:else}
					<p class="px-5 pt-4 text-sm text-muted">
						Zu diesem Erlebnis gibt es noch keine Notiz. Weißt du noch, wie es war?
					</p>
				{/if}
				<div class="flex gap-2 p-4">
					<a
						href={randomHref(data.filter, random.id)}
						class="btn btn-primary flex-1"
						data-sveltekit-reset="false"
						data-sveltekit-replacestate
					>
						<Icon name="shuffle" size={18} /> Noch eine
					</a>
					<a href="/entries/{random.id}" class="btn btn-secondary flex-1">
						{random.notes ? 'Ansehen' : 'Notiz ergänzen'}
					</a>
				</div>
			</article>
		{/key}
	{:else}
		<EmptyState emoji="🎲" title={data.filter ? 'Keine Einträge in dieser Kategorie' : 'Noch keine Einträge'}>
			{data.filter ? 'Wähle eine andere Kategorie.' : 'Sobald du Erlebnisse einträgst, ziehen wir hier zufällig eins.'}
		</EmptyState>
	{/if}
</section>

<!-- Rückblicke -->
<section aria-labelledby="recaps">
	<h2 id="recaps" class="section-title mb-3">Rückblicke</h2>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each [{ p: data.week, title: 'Wochenrückblick', label: formatRange(data.week.start, data.week.end), href: `/remember/week/${data.week.key}` }, { p: data.month, title: 'Monatsrückblick', label: formatMonth(data.month.key), href: `/remember/month/${data.month.key}` }] as item (item.href)}
			<a href={item.href} class="card group flex flex-col p-4 transition hover:shadow-float">
				<span class="text-xs font-bold tracking-wider text-muted uppercase">{item.title}</span>
				<span class="mt-0.5 font-display text-lg font-semibold">{item.label}</span>
				<span class="mt-3 flex items-center gap-3 text-sm text-ink-soft">
					<span><strong class="text-ink">{item.p.count}</strong> {item.p.count === 1 ? 'Erlebnis' : 'Erlebnisse'}</span>
					<span>Ø <strong class="text-ink">{avg(item.p.averageRating)}</strong> ★</span>
					<span><strong class="text-ink">{item.p.xp}</strong> XP</span>
				</span>
				<span class="mt-3 flex items-center justify-between">
					<span class="text-xl tracking-widest" aria-hidden="true">{item.p.emojis.join('')}</span>
					<Icon name="chevron-right" class="text-muted transition group-hover:translate-x-0.5" />
				</span>
			</a>
		{/each}
	</div>
</section>
