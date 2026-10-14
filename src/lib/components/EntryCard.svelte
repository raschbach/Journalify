<script lang="ts">
	import { formatDateWithWeekday } from '../dates';
	import type { EntrySummary } from '../types';
	import Avatar from './Avatar.svelte';
	import Cover from './Cover.svelte';
	import Icon from './Icon.svelte';
	import Stars from './Stars.svelte';

	interface Props {
		entry: EntrySummary;
		showAuthor?: boolean;
		/** Notiz-Auszug anzeigen */
		excerpt?: boolean;
	}

	let { entry, showAuthor = false, excerpt = true }: Props = $props();
	const subtitle = $derived([entry.creator, entry.year].filter(Boolean).join(' · '));
</script>

<a
	href="/entries/{entry.id}"
	class="card group block p-3.5 transition hover:border-surface-3 hover:shadow-float active:scale-[0.99]"
>
	{#if showAuthor && entry.author}
		<div class="mb-2.5 flex items-center gap-2 text-sm">
			<Avatar name={entry.author.displayName} size="sm" />
			<span class="font-semibold">{entry.author.displayName}</span>
			<span class="text-muted">hat {entry.category.emoji} {entry.category.name} eingetragen</span>
		</div>
	{/if}
	<div class="flex gap-3.5">
		<Cover {entry} category={entry.category} size="md" />
		<div class="min-w-0 flex-1">
			<h3 class="line-clamp-2 font-sans text-[1.02rem] leading-snug font-semibold tracking-normal break-words">
				{entry.title}
			</h3>
			{#if subtitle}
				<p class="truncate text-sm text-muted">{subtitle}</p>
			{/if}
			<div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
				<span class="text-ink-soft">{formatDateWithWeekday(entry.experiencedAt)}</span>
				<Stars rating={entry.rating} />
				{#if entry.visibility === 'private' && !showAuthor}
					<span class="text-muted" title="Privat"><Icon name="lock" size={14} /><span class="sr-only">Privat</span></span>
				{/if}
			</div>
		</div>
	</div>
	{#if excerpt && entry.notes}
		<p class="mt-2.5 line-clamp-2 border-l-2 pl-3 text-sm leading-relaxed text-ink-soft" style:border-color={entry.category.color}>
			{entry.notes}
		</p>
	{/if}
</a>
