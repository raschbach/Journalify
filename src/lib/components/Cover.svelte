<script lang="ts">
	interface Props {
		entry: { coverUrl: string | null; title: string };
		category: { emoji: string; color: string };
		size?: 'sm' | 'md' | 'lg' | 'fill';
		class?: string;
	}

	let { entry, category, size = 'md', class: className = '' }: Props = $props();
	let failed = $state(false);

	const sizes = {
		sm: 'size-11 rounded-xl text-xl',
		md: 'size-14 rounded-xl text-2xl',
		lg: 'h-32 w-24 rounded-2xl text-5xl',
		fill: 'aspect-[4/3] w-full rounded-t-2xl text-5xl'
	};

	$effect(() => {
		// Bei neuer URL erneut versuchen
		void entry.coverUrl;
		failed = false;
	});
</script>

<div
	class={['cat-tint relative flex shrink-0 items-center justify-center overflow-hidden', sizes[size], className]}
	style:--cat={category.color}
>
	{#if entry.coverUrl && !failed}
		<img
			src={entry.coverUrl}
			alt="Cover: {entry.title}"
			class="absolute inset-0 size-full object-cover"
			loading="lazy"
			referrerpolicy="no-referrer"
			onerror={() => (failed = true)}
		/>
	{:else}
		<span class="leading-none" aria-hidden="true">{category.emoji}</span>
	{/if}
</div>
