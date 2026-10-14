<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<main
	class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10"
>
	<div class="mb-8 text-center">
		<div
			class="mx-auto mb-4 flex size-16 items-center justify-center rounded-[1.4rem] bg-primary text-3xl shadow-float"
			aria-hidden="true"
		>
			📓
		</div>
		<p class="font-display text-3xl font-semibold tracking-tight">Journalify</p>
		<p class="mt-1 text-muted">Dein Logbuch für Kultur-Erlebnisse</p>
	</div>
	{@render children()}
</main>
