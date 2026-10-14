<script lang="ts">
	import type { Snippet } from 'svelte';
	import { navHistory } from '../nav.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		back?: string;
		backLabel?: string;
		/** Wenn möglich per Browser-Verlauf zurück (erhält die Scrollposition) */
		historyBack?: boolean;
		/** Aktuellen Verlaufseintrag ersetzen (für Formular-Abläufe) */
		replace?: boolean;
		actions?: Snippet;
	}

	let {
		title,
		subtitle,
		back,
		backLabel = 'Zurück',
		historyBack = false,
		replace = false,
		actions
	}: Props = $props();
</script>

<header class="mb-5 flex items-start gap-2">
	{#if back}
		<a
			href={back}
			class="btn-icon -ml-2.5"
			aria-label={backLabel}
			title={backLabel}
			data-sveltekit-replacestate={replace ? '' : undefined}
			onclick={(e) => {
				if (historyBack && navHistory.internal) {
					e.preventDefault();
					history.back();
				}
			}}
		>
			<Icon name="arrow-left" size={22} />
		</a>
	{/if}
	<div class="min-w-0 flex-1 pt-1">
		{#if title}<h1 class="text-[1.7rem] leading-tight font-semibold">{title}</h1>{/if}
		{#if subtitle}
			<p class="mt-0.5 text-sm text-muted">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-1 pt-0.5">{@render actions()}</div>
	{/if}
</header>
