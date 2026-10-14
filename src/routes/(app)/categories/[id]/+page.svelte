<script lang="ts">
	import CategoryEditor from '#lib/components/CategoryEditor.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let confirmOpen = $state(false);
	let confirmEntries = $state(false);
</script>

<svelte:head>
	<title>{data.category.name} bearbeiten · Journalify</title>
</svelte:head>

<PageHeader title="Kategorie bearbeiten" back="/categories" backLabel="Abbrechen" historyBack>
	{#snippet actions()}
		<button
			type="button"
			class="btn-icon text-danger hover:bg-danger-soft hover:text-danger"
			aria-label="Kategorie löschen"
			title="Löschen"
			onclick={() => {
				confirmEntries = false;
				confirmOpen = true;
			}}
		>
			<Icon name="trash" />
		</button>
	{/snippet}
</PageHeader>

{#key data.category.id}
	<CategoryEditor
		initial={data.initial}
		colors={data.colors}
		errors={form?.errors}
		submitLabel="Änderungen speichern"
	/>
{/key}

<ConfirmDialog
	bind:open={confirmOpen}
	title="„{data.category.name}“ löschen?"
	confirmLabel="Endgültig löschen"
	danger
	action="?/delete"
	disabled={data.entryCount > 0 && !confirmEntries}
>
	{#if data.entryCount > 0}
		In dieser Kategorie {data.entryCount === 1
			? 'gibt es 1 Eintrag'
			: `gibt es ${data.entryCount} Einträge`}. Sie werden ebenfalls gelöscht – das kann nicht
		rückgängig gemacht werden.
	{:else}
		Die Kategorie hat keine Einträge und kann gefahrlos gelöscht werden.
	{/if}
	{#snippet fields()}
		{#if data.entryCount > 0}
			<label
				class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-danger-soft p-3 text-sm text-ink"
			>
				<input
					type="checkbox"
					name="confirmEntries"
					class="mt-0.5 size-5 accent-[var(--danger)]"
					bind:checked={confirmEntries}
				/>
				<span
					>Ja, auch {data.entryCount === 1 ? 'den Eintrag' : `alle ${data.entryCount} Einträge`} löschen.</span
				>
			</label>
		{/if}
		{#if form?.deleteError}<p class="field-error">{form.deleteError}</p>{/if}
	{/snippet}
</ConfirmDialog>
