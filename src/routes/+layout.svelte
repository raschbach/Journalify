<script lang="ts">
	import './layout.css';
	import '@fontsource-variable/fraunces';
	import favicon from '#lib/assets/favicon.svg';
	import Toaster from '#lib/components/Toaster.svelte';
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/state';
	import { navHistory } from '#lib/nav.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	afterNavigate(({ from, type }) => {
		if (from && type !== 'enter') navHistory.internal = true;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
	<title>Journalify</title>
</svelte:head>

{#if navigating.to}
	<div class="nav-progress fixed inset-x-0 top-0 z-[80] h-0.5 bg-gold" aria-hidden="true"></div>
{/if}

<Toaster />

{@render children()}

<style>
	.nav-progress {
		transform-origin: left;
		animation: progress 1.6s cubic-bezier(0.1, 0.6, 0.3, 1) forwards;
		animation-delay: 120ms;
		transform: scaleX(0);
	}

	@keyframes progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(0.9);
		}
	}
</style>
