<script lang="ts">
	interface Props {
		rating: number | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { rating, size = 'sm', class: className = '' }: Props = $props();
	const px = $derived(size === 'lg' ? 22 : size === 'md' ? 17 : 14);
</script>

{#if rating}
	<span
		class={['inline-flex items-center gap-px text-gold', className]}
		role="img"
		aria-label="{rating} von 5 Sternen"
	>
		{#each [1, 2, 3, 4, 5] as star (star)}
			<svg
				width={px}
				height={px}
				viewBox="0 0 24 24"
				aria-hidden="true"
				class={star <= rating ? '' : 'opacity-25'}
			>
				<path
					fill="currentColor"
					d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"
				/>
			</svg>
		{/each}
	</span>
{/if}
