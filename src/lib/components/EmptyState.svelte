<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		emoji?: string;
		title: string;
		children?: Snippet;
		actions?: Snippet;
		class?: string;
	}

	let { emoji = '🌱', title, children, actions, class: className = '' }: Props = $props();
</script>

<div
	class={[
		'flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center',
		className
	]}
>
	<div class="mb-3 text-4xl" aria-hidden="true">{emoji}</div>
	<p class="font-display text-lg font-semibold">{title}</p>
	{#if children}
		<div class="mt-1 max-w-sm text-sm text-pretty text-muted">{@render children()}</div>
	{/if}
	{#if actions}
		<div class="mt-5 flex flex-wrap justify-center gap-2">{@render actions()}</div>
	{/if}
</div>
