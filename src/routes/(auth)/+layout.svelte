<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<main
	class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10"
>
	<div class="mb-8 text-center">
		<img
			src="/icon.svg"
			alt=""
			class="mx-auto mb-4 size-16 rounded-[1.1rem] shadow-float"
			width="64"
			height="64"
		/>
		<p class="font-display text-3xl font-semibold tracking-tight">Journalify</p>
		<p class="mt-1 text-muted">Dein Logbuch für Kultur-Erlebnisse</p>
	</div>
	{@render children()}
</main>
