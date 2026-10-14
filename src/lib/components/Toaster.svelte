<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { toasts } from '../toast.svelte';
	import type { Flash } from '../types';
	import Icon from './Icon.svelte';
	import LevelUp from './LevelUp.svelte';

	// Flash-Meldungen vom Server (nach Redirects) in Toasts übersetzen
	$effect(() => {
		const flash = page.data.flash as Flash | null | undefined;
		if (!flash) return;
		toasts.show(flash.message, { id: flash.id, tone: flash.tone, xp: flash.xp });
		if (flash.levelUp) toasts.celebrate(flash.levelUp.level, flash.levelUp.title);
	});
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
	role="status"
	aria-live="polite"
>
	{#each toasts.items as toast (toast.id)}
		<div
			in:fly={{ y: -16, duration: 220 }}
			out:fly={{ y: -16, duration: 180 }}
			class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-primary py-2.5 pr-2 pl-4 text-primary-ink shadow-float"
		>
			<span
				class={[
					'flex size-7 shrink-0 items-center justify-center rounded-full',
					toast.tone === 'error' ? 'bg-danger text-white' : 'bg-primary-ink/15'
				]}
			>
				<Icon name={toast.tone === 'error' ? 'x' : toast.tone === 'info' ? 'info' : 'check'} size={16} strokeWidth={2.5} />
			</span>
			<p class="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
			{#if toast.xp}
				<span class="shrink-0 rounded-full bg-gold px-2.5 py-1 text-sm font-bold text-[#1f1b16]">
					+{toast.xp} XP
				</span>
			{/if}
			<button
				type="button"
				class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-70 hover:opacity-100"
				aria-label="Meldung schließen"
				onclick={() => toasts.dismiss(toast.id)}
			>
				<Icon name="x" size={16} />
			</button>
		</div>
	{/each}
</div>

{#if toasts.celebration}
	<LevelUp
		level={toasts.celebration.level}
		title={toasts.celebration.title}
		onclose={() => (toasts.celebration = null)}
	/>
{/if}
