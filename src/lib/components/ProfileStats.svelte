<script lang="ts">
	import type { ProfileStats } from '../stats';
	import type { CategoryInfo } from '../types';
	import type { LevelProgress } from '../xp';

	interface Props {
		level: LevelProgress;
		stats: ProfileStats;
		categories: CategoryInfo[];
	}

	let { level, stats, categories }: Props = $props();

	const maxCount = $derived(Math.max(1, ...stats.perCategory.map((c) => c.count)));
	const avg = $derived(
		stats.averageRating === null
			? '–'
			: stats.averageRating.toLocaleString('de-DE', { maximumFractionDigits: 1 })
	);
	const percent = (value: number) => `${Math.round(value * 100)} %`;
	const fmt = (n: number) => n.toLocaleString('de-DE');
</script>

<!-- Level -->
<section class="card overflow-hidden" aria-label="Level und XP">
	<div class="flex items-center gap-4 p-5">
		<div
			class="flex size-20 shrink-0 flex-col items-center justify-center rounded-full bg-gold-soft text-gold ring-4 ring-gold/15"
		>
			<span class="text-[0.65rem] font-bold tracking-wider uppercase">Level</span>
			<span class="font-display text-3xl leading-none font-bold">{level.level}</span>
		</div>
		<div class="min-w-0 flex-1">
			<p class="font-display text-xl font-semibold">{level.title}</p>
			<p class="text-sm text-muted"><strong class="text-ink">{fmt(level.xp)}</strong> XP gesamt</p>
		</div>
	</div>
	<div class="border-t border-line px-5 py-4">
		<div
			class="h-3 overflow-hidden rounded-full bg-surface-3"
			role="progressbar"
			aria-label="Fortschritt zu Level {level.level + 1}"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(level.progress * 100)}
		>
			<div
				class="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold transition-[width] duration-700"
				style:width="{Math.max(2, Math.round(level.progress * 100))}%"
			></div>
		</div>
		<p class="mt-2 flex justify-between gap-2 text-sm text-muted">
			<span class="tabular-nums">{fmt(level.xpIntoLevel)} / {fmt(level.nextLevelAt - level.levelStart)} XP</span>
			<span>noch <strong class="text-ink">{fmt(level.xpToNext)} XP</strong> bis Level {level.level + 1}</span>
		</p>
	</div>
</section>

<!-- Kennzahlen -->
<div class="mt-4 grid grid-cols-3 gap-2.5">
	<div class="card p-3.5 text-center">
		<p class="font-display text-3xl font-semibold">{fmt(stats.total)}</p>
		<p class="text-xs text-muted">Einträge</p>
	</div>
	<div class="card p-3.5 text-center">
		<p class="font-display text-3xl font-semibold">{avg}<span class="text-xl text-gold"> ★</span></p>
		<p class="text-xs text-muted">Ø Bewertung</p>
	</div>
	<div class="card p-3.5 text-center">
		<p class="font-display text-3xl font-semibold">{percent(stats.notesShare)}</p>
		<p class="text-xs text-muted">mit Notiz</p>
	</div>
</div>

{#if stats.perCategory.length}
	<section class="card mt-4 p-4" aria-labelledby="stats-per-category">
		<h2 id="stats-per-category" class="mb-3 font-sans text-sm font-bold text-ink-soft">Einträge pro Kategorie</h2>
		<ul class="space-y-2.5">
			{#each stats.perCategory as row (row.categoryId)}
				{@const cat = categories.find((c) => c.id === row.categoryId)}
				{#if cat}
					<li class="flex items-center gap-3 text-sm">
						<span class="w-32 shrink-0 truncate sm:w-44"><span aria-hidden="true">{cat.emoji}</span> {cat.name}</span>
						<span class="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
							<span
								class="block h-full rounded-full"
								style:width="{(row.count / maxCount) * 100}%"
								style:background-color={cat.color}
							></span>
						</span>
						<span class="w-8 text-right font-semibold tabular-nums">{row.count}</span>
					</li>
				{/if}
			{/each}
		</ul>
	</section>
{/if}
