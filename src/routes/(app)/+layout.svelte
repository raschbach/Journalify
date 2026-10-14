<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	interface NavItem {
		href: string;
		label: string;
		icon: IconName;
	}

	const NAV: NavItem[] = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/remember', label: 'Erinnern', icon: 'history' },
		{ href: '/calendar', label: 'Kalender', icon: 'calendar' },
		{ href: '/browse', label: 'Stöbern', icon: 'library' }
	];

	const path = $derived(page.url.pathname);

	function isActive(href: string) {
		return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
	}

	/** Formularseiten: Bottom-Navigation ausblenden, damit die Speichern-Leiste Platz hat */
	const focusMode = $derived(
		page.route.id === '/(app)/new' ||
			page.route.id === '/(app)/entries/[id]/edit' ||
			page.route.id === '/(app)/categories/new' ||
			page.route.id === '/(app)/categories/[id]'
	);
</script>

<div class="min-h-dvh">
	<header
		class="sticky top-0 z-40 border-b border-line/70 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md"
	>
		<div class="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
			<a
				href="/"
				class="mr-auto flex items-center gap-2 rounded-lg py-1 pr-2"
				aria-label="Journalify – Startseite"
			>
				<img src="/icon.svg" alt="" class="size-8" width="32" height="32" />
				<span class="font-display text-xl font-semibold tracking-tight">Journalify</span>
			</a>

			<nav class="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
				{#each NAV as item (item.href)}
					<a
						href={item.href}
						class={[
							'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition',
							isActive(item.href)
								? 'bg-surface-2 text-ink'
								: 'text-muted hover:bg-surface-2 hover:text-ink'
						]}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<Icon name={item.icon} size={18} />
						{item.label}
					</a>
				{/each}
				<a href="/new" class="btn btn-primary ml-2 h-10 min-h-10 text-sm">
					<Icon name="plus" size={18} strokeWidth={2.5} /> Neuer Eintrag
				</a>
			</nav>

			<a
				href="/profile"
				class="flex h-10 items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-3 transition hover:bg-surface-2 md:ml-2"
				aria-label="Profil: Level {data.level.level}, {data.level.xp} XP{data.incomingRequests
					? `, ${data.incomingRequests} offene Freundschaftsanfrage${data.incomingRequests === 1 ? '' : 'n'}`
					: ''}"
			>
				<span class="text-xs font-bold tabular-nums">
					<span class="text-gold">★</span> Lvl {data.level.level}
				</span>
				<span class="relative">
					<Avatar name={data.me.displayName} size="sm" />
					{#if data.incomingRequests}
						<span
							class="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[0.65rem] font-bold text-white ring-2 ring-bg"
							>{data.incomingRequests}</span
						>
					{/if}
				</span>
			</a>
		</div>
	</header>

	<main
		class={[
			'mx-auto w-full max-w-2xl px-4 pt-5',
			focusMode ? 'pb-8' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12'
		]}
	>
		{@render children()}
	</main>

	{#if !focusMode}
		<nav
			class="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/90 backdrop-blur-md md:hidden"
			aria-label="Hauptnavigation"
		>
			<ul class="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
				{#each NAV.slice(0, 2) as item (item.href)}
					{@render navLink(item)}
				{/each}
				<li class="flex justify-center">
					<a
						href="/new"
						class="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-ink shadow-float ring-4 ring-bg transition active:scale-95"
						aria-label="Neuer Eintrag"
					>
						<Icon name="plus" size={28} strokeWidth={2.5} />
					</a>
				</li>
				{#each NAV.slice(2) as item (item.href)}
					{@render navLink(item)}
				{/each}
			</ul>
		</nav>
	{/if}
</div>

{#snippet navLink(item: NavItem)}
	<li>
		<a
			href={item.href}
			class={[
				'flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-semibold transition',
				isActive(item.href) ? 'text-ink' : 'text-muted'
			]}
			aria-current={isActive(item.href) ? 'page' : undefined}
		>
			<Icon name={item.icon} size={22} strokeWidth={isActive(item.href) ? 2.4 : 1.8} />
			{item.label}
		</a>
	</li>
{/snippet}
