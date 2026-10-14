<script lang="ts">
	interface Props {
		name: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { name, size = 'md', class: className = '' }: Props = $props();

	const PALETTE = [
		'#e11d48',
		'#7c3aed',
		'#d97706',
		'#059669',
		'#ea580c',
		'#c026d3',
		'#4f46e5',
		'#0284c7',
		'#0d9488'
	];

	const color = $derived.by(() => {
		let hash = 0;
		for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
		return PALETTE[hash % PALETTE.length];
	});
	const initial = $derived(Array.from(name.trim())[0]?.toUpperCase() ?? '?');
	const sizes = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-16 text-2xl' };
</script>

<span
	class={[
		'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
		sizes[size],
		className
	]}
	style:background-color={color}
	aria-hidden="true">{initial}</span
>
