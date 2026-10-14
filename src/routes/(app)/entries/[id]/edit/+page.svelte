<script lang="ts">
	import EntryForm from '#lib/components/EntryForm.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Bearbeiten: {data.title} · Journalify</title>
</svelte:head>

<PageHeader
	title="Eintrag bearbeiten"
	back="/entries/{data.entryId}"
	backLabel="Abbrechen"
	replace
/>

{#key data.entryId}
	<EntryForm
		categories={data.categories}
		initial={data.initial}
		mode="edit"
		today={data.today}
		errors={form?.errors}
		originalXp={data.originalXp}
	/>
{/key}
