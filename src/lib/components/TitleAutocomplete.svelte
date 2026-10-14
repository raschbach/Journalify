<script lang="ts">
	import type { CatalogResult } from '../types';
	import Icon from './Icon.svelte';

	interface Props {
		categoryId: string;
		/** Hat die Kategorie überhaupt eine Bibliothek? Sonst wird nicht gesucht. */
		searchable: boolean;
		value: string;
		linked: { id: string; label: string } | null;
		invalid?: boolean;
		autofocus?: boolean;
		onpick: (item: CatalogResult) => void;
		onunlink: () => void;
	}

	let {
		categoryId,
		searchable,
		value = $bindable(''),
		linked,
		invalid = false,
		autofocus = false,
		onpick,
		onunlink
	}: Props = $props();

	let results = $state<CatalogResult[]>([]);
	let open = $state(false);
	let active = $state(-1);
	let searched = $state(false);
	let input: HTMLInputElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;

	const listId = 'title-suggestions';

	$effect(() => {
		if (autofocus) input?.focus({ preventScroll: true });
	});

	function search(query: string) {
		clearTimeout(timer);
		controller?.abort();
		if (!searchable || query.trim().length < 2) {
			results = [];
			searched = false;
			open = false;
			return;
		}
		timer = setTimeout(async () => {
			controller = new AbortController();
			try {
				const params = new URLSearchParams({ category: categoryId, q: query });
				const res = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
				if (!res.ok) throw new Error(String(res.status));
				results = await res.json();
				searched = true;
				active = -1;
				open = document.activeElement === input && results.length > 0;
			} catch (e) {
				if ((e as Error).name !== 'AbortError') {
					results = [];
					open = false;
				}
			}
		}, 150);
	}

	function pick(item: CatalogResult) {
		onpick(item);
		open = false;
		results = [];
		searched = false;
	}

	function onkeydown(event: KeyboardEvent) {
		if (!open || !results.length) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = (active + 1) % results.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = active <= 0 ? results.length - 1 : active - 1;
		} else if (event.key === 'Enter' && active >= 0) {
			event.preventDefault();
			pick(results[active]);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
	}
</script>

<div class="relative">
	<input
		bind:this={input}
		bind:value
		class="input text-lg font-semibold"
		id="title"
		name="title"
		type="text"
		required
		maxlength="200"
		autocomplete="off"
		autocapitalize="sentences"
		enterkeyhint="done"
		placeholder={searchable ? 'Titel eingeben oder suchen …' : 'Titel'}
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={open}
		aria-controls={listId}
		aria-activedescendant={open && active >= 0 ? `title-option-${active}` : undefined}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby="title-hint"
		oninput={() => {
			if (linked) onunlink();
			search(value);
		}}
		onfocus={() => (open = results.length > 0)}
		onblur={() => setTimeout(() => (open = false), 120)}
		{onkeydown}
	/>

	{#if open}
		<ul
			id={listId}
			role="listbox"
			aria-label="Vorschläge aus der Bibliothek"
			class="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-auto rounded-2xl border border-line bg-surface p-1.5 shadow-float"
		>
			{#each results as item, i (item.id)}
				<!-- Tastaturbedienung läuft über das Combobox-Eingabefeld (Pfeiltasten + Enter) -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					id="title-option-{i}"
					role="option"
					aria-selected={i === active}
					class={[
						'flex min-h-12 cursor-pointer flex-col justify-center rounded-xl px-3 py-2',
						i === active ? 'bg-surface-2' : 'hover:bg-surface-2'
					]}
					onpointerdown={(e) => e.preventDefault()}
					onclick={() => pick(item)}
				>
					<span class="font-semibold">{item.title}</span>
					<span class="text-sm text-muted">
						{[item.creator, item.year].filter(Boolean).join(' · ')}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<div id="title-hint" class="mt-1.5 min-h-5 text-sm">
	{#if linked}
		<span
			class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-2 py-0.5 pr-0.5 pl-2.5 text-ink-soft"
		>
			<Icon name="link" size={14} />
			<span class="truncate">Aus der Bibliothek: {linked.label}</span>
			<button
				type="button"
				class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-surface-3"
				aria-label="Verknüpfung mit der Bibliothek lösen"
				onclick={onunlink}
			>
				<Icon name="x" size={14} />
			</button>
		</span>
	{:else if searched && !results.length && value.trim().length >= 2}
		<span class="text-muted">Kein Treffer in der Bibliothek – einfach frei eingeben.</span>
	{/if}
</div>
