<script lang="ts">
	interface Props {
		emoji: string;
		name: string;
		color: string;
		class?: string;
	}

	let { emoji, name, color, class: className = '' }: Props = $props();
</script>

<span
	class={[
		'cat-tint cat-text inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
		className
	]}
	style:--cat={color}
>
	<span aria-hidden="true">{emoji}</span>{name}
</span>
