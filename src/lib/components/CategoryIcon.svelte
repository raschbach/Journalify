<script lang="ts">
	interface Props {
		emoji: string;
		color: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
	}

	let { emoji, color, size = 'md', class: className = '' }: Props = $props();

	const sizes = {
		sm: 'size-8 rounded-lg text-base',
		md: 'size-11 rounded-xl text-xl',
		lg: 'size-14 rounded-2xl text-3xl',
		xl: 'size-20 rounded-3xl text-5xl'
	};
</script>

<span
	class={['cat-tint inline-flex shrink-0 items-center justify-center leading-none', sizes[size], className]}
	style:--cat={color}
	aria-hidden="true">{emoji}</span
>
