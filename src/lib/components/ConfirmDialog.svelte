<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		open: boolean;
		title: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		/** Formular-Action, die beim Bestätigen per POST aufgerufen wird (sonst onconfirm) */
		action?: string;
		/** Bestätigen deaktivieren (z. B. bis eine Checkbox gesetzt ist) */
		disabled?: boolean;
		children?: Snippet;
		/** Zusätzliche Formularfelder (hidden inputs, Checkboxen) */
		fields?: Snippet;
		onconfirm?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		danger = false,
		action,
		disabled = false,
		children,
		fields,
		onconfirm
	}: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let submitting = $state(false);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			submitting = false;
			dialog.showModal();
		} else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
	aria-labelledby="confirm-title"
	onclose={() => (open = false)}
	onclick={(e) => {
		// Klick auf den Hintergrund schließt den Dialog
		if (e.target === dialog) open = false;
	}}
>
	{#snippet body()}
		<h2 id="confirm-title" class="text-xl font-semibold">{title}</h2>
		{#if children}
			<div class="mt-2 text-sm text-pretty text-muted">{@render children()}</div>
		{/if}
		{@render fields?.()}
	{/snippet}

	{#if action}
		<form
			method="POST"
			{action}
			class="p-6"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						open = false;
						await goto(result.location, { replace: true, refreshAll: true });
						return;
					}
					await update();
					submitting = false;
					open = false;
				};
			}}
		>
			{@render body()}
			<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button type="button" class="btn btn-secondary" onclick={() => (open = false)}>
					{cancelLabel}
				</button>
				<button
					type="submit"
					class={['btn', danger ? 'btn-danger' : 'btn-primary']}
					disabled={disabled || submitting}
				>
					{submitting ? 'Einen Moment …' : confirmLabel}
				</button>
			</div>
		</form>
	{:else}
		<div class="p-6">
			{@render body()}
			<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button type="button" class="btn btn-secondary" onclick={() => (open = false)}>
					{cancelLabel}
				</button>
				<button
					type="button"
					class={['btn', danger ? 'btn-danger' : 'btn-primary']}
					{disabled}
					onclick={() => {
						onconfirm?.();
						open = false;
					}}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	{/if}
</dialog>
