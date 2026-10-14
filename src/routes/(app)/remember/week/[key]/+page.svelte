<script lang="ts">
	import RecapView from '#lib/components/RecapView.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<RecapView {data} />
