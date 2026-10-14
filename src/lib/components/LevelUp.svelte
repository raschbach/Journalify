<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	interface Props {
		level: number;
		title: string;
		onclose: () => void;
	}

	let { level, title, onclose }: Props = $props();

	const PARTICLES = ['🎉', '⭐', '✨', '🎬', '📚', '🎭', '🎧', '🎼', '🖼️', '🎤', '📺', '💫'];
	const particles = Array.from({ length: 24 }, (_, i) => ({
		emoji: PARTICLES[i % PARTICLES.length],
		angle: (i / 24) * Math.PI * 2 + (i % 3) * 0.2,
		distance: 120 + ((i * 37) % 90),
		delay: (i % 6) * 40,
		rotate: ((i * 53) % 120) - 60
	}));

	let button: HTMLButtonElement | undefined = $state();

	$effect(() => {
		button?.focus();
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
	class="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
	role="dialog"
	aria-modal="true"
	aria-labelledby="levelup-title"
>
	<div class="relative">
		<div class="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
			{#each particles as p, i (i)}
				<span
					class="particle absolute text-2xl"
					style:--x="{Math.cos(p.angle) * p.distance}px"
					style:--y="{Math.sin(p.angle) * p.distance}px"
					style:--r="{p.rotate}deg"
					style:animation-delay="{p.delay}ms">{p.emoji}</span
				>
			{/each}
		</div>
		<div
			class="relative w-full max-w-xs rounded-3xl bg-surface p-7 text-center shadow-float"
			in:scale={{ start: 0.6, duration: 450, easing: backOut }}
		>
			<div
				class="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-gold-soft font-display text-5xl font-bold text-gold ring-8 ring-gold/15"
			>
				{level}
			</div>
			<p class="text-sm font-semibold tracking-wide text-gold uppercase">Level-Up!</p>
			<h2 id="levelup-title" class="mt-1 text-2xl font-semibold">Du bist jetzt {title}</h2>
			<p class="mt-2 text-sm text-muted">
				Deine Erinnerungen wachsen – weiter so. Jede Notiz bringt dich dem nächsten Level näher.
			</p>
			<button bind:this={button} type="button" class="btn btn-primary mt-6 w-full" onclick={onclose}>
				Weiter
			</button>
		</div>
	</div>
</div>

<style>
	.particle {
		transform: translate(-50%, -50%) scale(0.2);
		opacity: 0;
		animation: burst 1.4s cubic-bezier(0.15, 0.7, 0.3, 1) forwards;
	}

	@keyframes burst {
		0% {
			transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(var(--r));
			opacity: 0;
		}
	}
</style>
