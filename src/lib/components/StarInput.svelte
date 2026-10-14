<script lang="ts">
	interface Props {
		value: number | null;
		name?: string;
	}

	let { value = $bindable(null), name = 'rating' }: Props = $props();

	const LABELS = ['', 'Naja', 'Ganz okay', 'Gut', 'Sehr gut', 'Großartig'];

	function choose(star: number) {
		// Erneutes Tippen auf die aktuelle Bewertung entfernt sie wieder
		value = value === star ? null : star;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			value = Math.min(5, (value ?? 0) + 1);
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			const next = (value ?? 0) - 1;
			value = next >= 1 ? next : null;
		} else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
			event.preventDefault();
			value = null;
		} else if (/^[1-5]$/.test(event.key)) {
			event.preventDefault();
			value = Number(event.key);
		}
	}
</script>

<input type="hidden" {name} value={value ?? ''} />
<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
	<div
		class="-ml-1.5 flex"
		role="radiogroup"
		aria-label="Bewertung"
		tabindex="0"
		{onkeydown}
	>
		{#each [1, 2, 3, 4, 5] as star (star)}
			<button
				type="button"
				role="radio"
				aria-checked={value === star}
				aria-label="{star} {star === 1 ? 'Stern' : 'Sterne'}"
				tabindex="-1"
				class="group flex size-12 cursor-pointer items-center justify-center rounded-xl transition hover:bg-surface-2 active:scale-90"
				onclick={() => choose(star)}
			>
				<svg
					width="34"
					height="34"
					viewBox="0 0 24 24"
					aria-hidden="true"
					class={[
						'transition-transform duration-150',
						value !== null && star <= value ? 'scale-100 text-gold' : 'scale-90 text-surface-3'
					]}
				>
					<path
						fill="currentColor"
						stroke={value !== null && star <= value ? 'none' : 'var(--muted)'}
						stroke-opacity="0.35"
						stroke-width="1"
						d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"
					/>
				</svg>
			</button>
		{/each}
	</div>
	<p class="text-sm text-muted" aria-live="polite">
		{#if value}
			<span class="font-semibold text-ink-soft">{LABELS[value]}</span> · nochmal tippen zum Entfernen
		{:else}
			Optional – antippen zum Bewerten
		{/if}
	</p>
</div>
