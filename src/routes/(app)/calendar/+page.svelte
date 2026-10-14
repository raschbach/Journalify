<script lang="ts">
	import { goto } from '$app/navigation';
	import { SvelteSet } from 'svelte/reactivity';
	import { slide } from 'svelte/transition';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import EntryCard from '#lib/components/EntryCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import {
		addDays,
		addMonths,
		daysBetween,
		formatDateLong,
		formatMonth,
		monthKey,
		WEEKDAYS_SHORT
	} from '#lib/dates.ts';
	import type { CategoryInfo, EntrySummary } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const hidden = new SvelteSet<string>();
	let selectedOverride = $state<string | null>(null);
	let dayPanel: HTMLElement | undefined = $state();

	// Beim Monatswechsel Auswahl zurücksetzen
	let lastMonth = $state('');
	$effect(() => {
		if (data.month !== lastMonth) {
			lastMonth = data.month;
			selectedOverride = null;
		}
	});

	const selected = $derived(
		selectedOverride ?? data.selected ?? (monthKey(data.today) === data.month ? data.today : null)
	);

	const days = $derived.by(() => {
		const count = daysBetween(data.gridStart, data.gridEnd) + 1;
		return Array.from({ length: count }, (_, i) => addDays(data.gridStart, i));
	});

	const visible = $derived(data.entries.filter((e) => !hidden.has(e.category.id)));

	const byDay = $derived.by(() => {
		const map = new Map<string, EntrySummary[]>();
		for (const entry of visible) {
			const list = map.get(entry.experiencedAt) ?? [];
			list.push(entry);
			map.set(entry.experiencedAt, list);
		}
		return map;
	});

	/** Kategorien, die in diesem Monat vorkommen (für Legende & Filter) */
	const legend = $derived.by(() => {
		const map = new Map<string, { category: CategoryInfo; count: number }>();
		for (const entry of data.entries) {
			if (monthKey(entry.experiencedAt) !== data.month) continue;
			const item = map.get(entry.category.id) ?? { category: entry.category, count: 0 };
			item.count++;
			map.set(entry.category.id, item);
		}
		return [...map.values()].sort((a, b) => b.count - a.count);
	});

	const monthCount = $derived(
		visible.filter((e) => monthKey(e.experiencedAt) === data.month).length
	);
	const selectedEntries = $derived(selected ? (byDay.get(selected) ?? []) : []);

	const prevHref = $derived(`?m=${addMonths(data.month, -1)}`);
	const nextHref = $derived(`?m=${addMonths(data.month, 1)}`);
	const isCurrentMonth = $derived(monthKey(data.today) === data.month);

	function selectDay(day: string) {
		if (monthKey(day) !== data.month) {
			goto(`?m=${monthKey(day)}&d=${day}`, { replace: true, reset: false });
			return;
		}
		selectedOverride = day;
		// Am Handy die Tagesliste ins Bild holen
		requestAnimationFrame(() => {
			if (!dayPanel) return;
			const rect = dayPanel.getBoundingClientRect();
			if (rect.top > window.innerHeight - 160) {
				dayPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	}

	function toggleCategory(id: string) {
		if (hidden.has(id)) hidden.delete(id);
		else hidden.add(id);
	}

	// Wischen zum Monatswechsel
	let touchStart: { x: number; y: number } | null = null;
	function ontouchstart(e: TouchEvent) {
		touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	}
	function ontouchend(e: TouchEvent) {
		if (!touchStart) return;
		const dx = e.changedTouches[0].clientX - touchStart.x;
		const dy = e.changedTouches[0].clientY - touchStart.y;
		touchStart = null;
		if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
			goto(dx < 0 ? nextHref : prevHref, { replace: true, reset: false });
		}
	}

	function dayLabel(day: string, list: EntrySummary[]) {
		const base = formatDateLong(day);
		if (!list.length) return base;
		return `${base}: ${list.length} ${list.length === 1 ? 'Eintrag' : 'Einträge'} – ${list.map((e) => e.title).join(', ')}`;
	}
</script>

<svelte:head>
	<title>Kalender · {formatMonth(data.month)} · Journalify</title>
</svelte:head>

<header class="mb-4 flex items-center gap-1">
	<div class="min-w-0 flex-1">
		<h1 class="text-[1.7rem] leading-tight font-semibold">{formatMonth(data.month)}</h1>
		<p class="text-sm text-muted">
			{monthCount}
			{monthCount === 1 ? 'Erlebnis' : 'Erlebnisse'}{hidden.size ? ' (gefiltert)' : ''}
		</p>
	</div>
	{#if !isCurrentMonth}
		<a
			href="/calendar"
			class="btn btn-secondary mr-1 h-10 min-h-10 px-3 text-sm"
			data-sveltekit-replacestate
			data-sveltekit-reset="false"
		>
			Heute
		</a>
	{/if}
	<a
		href={prevHref}
		class="btn-icon"
		aria-label="Vorheriger Monat"
		data-sveltekit-replacestate
		data-sveltekit-reset="false"
	>
		<Icon name="chevron-left" size={22} />
	</a>
	<a
		href={nextHref}
		class="btn-icon"
		aria-label="Nächster Monat"
		data-sveltekit-replacestate
		data-sveltekit-reset="false"
	>
		<Icon name="chevron-right" size={22} />
	</a>
</header>

{#if legend.length}
	<div
		class="-mx-4 mb-3 flex scrollbar-none gap-2 overflow-x-auto px-4 pb-1"
		role="group"
		aria-label="Kategorien ein- und ausblenden"
	>
		{#each legend as item (item.category.id)}
			{@const off = hidden.has(item.category.id)}
			<button
				type="button"
				class={['chip', off && 'opacity-50']}
				aria-pressed={!off}
				onclick={() => toggleCategory(item.category.id)}
			>
				<span
					class="size-2.5 rounded-full"
					style:background-color={off ? 'transparent' : item.category.color}
					style:box-shadow="inset 0 0 0 2px {item.category.color}"
				></span>
				<span class={off ? 'line-through' : ''}>{item.category.emoji} {item.category.name}</span>
				<span class="text-muted">{item.count}</span>
			</button>
		{/each}
		{#if hidden.size}
			<button type="button" class="chip" onclick={() => hidden.clear()}>Alle zeigen</button>
		{/if}
	</div>
{/if}

<div
	class="card p-1.5 select-none sm:p-2"
	role="group"
	aria-label="Monatsansicht {formatMonth(data.month)}"
	{ontouchstart}
	{ontouchend}
>
	<div class="grid grid-cols-7 pb-1" aria-hidden="true">
		{#each WEEKDAYS_SHORT as wd (wd)}
			<div class="py-1.5 text-center text-xs font-semibold text-muted">{wd}</div>
		{/each}
	</div>
	<div class="grid grid-cols-7 gap-0.5 sm:gap-1">
		{#each days as day (day)}
			{@const list = byDay.get(day) ?? []}
			{@const inMonth = monthKey(day) === data.month}
			{@const isToday = day === data.today}
			{@const isSelected = day === selected}
			<button
				type="button"
				class={[
					'flex min-h-14 cursor-pointer flex-col items-center rounded-xl px-0.5 pt-1 pb-1.5 transition sm:min-h-24 sm:items-stretch sm:px-1',
					isSelected ? 'bg-primary text-primary-ink' : 'hover:bg-surface-2',
					!inMonth && !isSelected && 'opacity-40'
				]}
				aria-label={dayLabel(day, list)}
				aria-pressed={isSelected}
				onclick={() => selectDay(day)}
			>
				<span
					class={[
						'flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
						isToday && !isSelected && 'bg-gold font-bold text-[#1f1b16]',
						isToday && isSelected && 'font-bold underline underline-offset-2'
					]}>{Number(day.slice(8))}</span
				>
				<!-- Mobil: Punkte -->
				<span class="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
					{#each list.slice(0, 4) as entry (entry.id)}
						<span
							class={['size-2 rounded-full', isSelected && 'ring-1 ring-primary-ink']}
							style:background-color={entry.category.color}
						></span>
					{/each}
					{#if list.length > 4}
						<span class="text-[0.6rem] leading-2 font-bold">+</span>
					{/if}
				</span>
				<!-- Desktop: Chips -->
				<span class="mt-1 hidden min-w-0 flex-col gap-0.5 sm:flex">
					{#each list.slice(0, 2) as entry (entry.id)}
						<span
							class="cat-tint truncate rounded-md px-1 py-px text-left text-[0.7rem] font-medium text-ink"
							style:--cat={entry.category.color}
						>
							{entry.category.emoji}
							{entry.title}
						</span>
					{/each}
					{#if list.length > 2}
						<span class="px-1 text-left text-[0.7rem] font-semibold opacity-70"
							>+{list.length - 2} weitere</span
						>
					{/if}
				</span>
			</button>
		{/each}
	</div>
</div>
<p class="mt-2 text-center text-xs text-muted sm:hidden">Tipp: Wischen wechselt den Monat.</p>

<section bind:this={dayPanel} class="mt-6 scroll-mt-20" aria-live="polite">
	{#if selected}
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="section-title">{formatDateLong(selected)}</h2>
			<a href="/new?date={selected}" class="btn btn-secondary h-10 min-h-10 px-3 text-sm">
				<Icon name="plus" size={16} /> Eintragen
			</a>
		</div>
		{#if selectedEntries.length}
			<ul class="space-y-3">
				{#each selectedEntries as entry (entry.id)}
					<li transition:slide={{ duration: 150 }}><EntryCard {entry} /></li>
				{/each}
			</ul>
		{:else}
			<EmptyState emoji="🗓️" title="Nichts eingetragen"
				>An diesem Tag ist noch nichts verzeichnet.</EmptyState
			>
		{/if}
	{:else}
		<p class="rounded-2xl bg-surface-2 px-4 py-6 text-center text-sm text-muted">
			Tippe auf einen Tag, um seine Einträge zu sehen.
		</p>
	{/if}
</section>
