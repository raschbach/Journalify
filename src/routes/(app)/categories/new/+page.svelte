<script lang="ts">
	import CategoryEditor from '#lib/components/CategoryEditor.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Neue Kategorie · Journalify</title>
</svelte:head>

<PageHeader title="Neue Kategorie" back="/categories" backLabel="Abbrechen" historyBack />

<CategoryEditor
	initial={{ name: '', emoji: '🎮', color: data.colors[0], fields: [] }}
	colors={data.colors}
	errors={form?.errors}
	submitLabel="Kategorie anlegen"
/>
