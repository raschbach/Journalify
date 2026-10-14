<script lang="ts">
	interface Props {
		id: string;
		name: string;
		autocomplete: 'current-password' | 'new-password';
		invalid?: boolean;
		describedby?: string;
	}

	let { id, name, autocomplete, invalid = false, describedby }: Props = $props();
	let visible = $state(false);
</script>

<div class="relative">
	<input
		class="input pr-24"
		{id}
		{name}
		type={visible ? 'text' : 'password'}
		{autocomplete}
		autocapitalize="none"
		autocorrect="off"
		spellcheck="false"
		required
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedby}
	/>
	<button
		type="button"
		class="absolute inset-y-0 right-1 my-auto h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
		aria-pressed={visible}
		onclick={() => (visible = !visible)}
	>
		{visible ? 'Verbergen' : 'Anzeigen'}
	</button>
</div>
