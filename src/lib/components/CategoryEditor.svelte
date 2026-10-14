<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { beforeNavigate, goto } from '$app/navigation';
	import { toasts } from '../toast.svelte';
	import { FIELD_TYPE_LABELS, FIELD_TYPES, type EditorField } from '../types';
	import Icon from './Icon.svelte';

	interface Props {
		initial: { name: string; emoji: string; color: string; fields: EditorField[] };
		colors: string[];
		errors?: Record<string, string> | null;
		submitLabel: string;
	}

	let { initial, colors, errors = null, submitLabel }: Props = $props();

	// svelte-ignore state_referenced_locally
	let v = $state(structuredClone($state.snapshot(initial)));
	// svelte-ignore state_referenced_locally
	const initialJson = JSON.stringify(initial);
	let submitting = $state(false);
	let saved = false;

	const dirty = $derived(JSON.stringify(v) !== initialJson);
	// svelte-ignore state_referenced_locally
	const existingIds = new Set(initial.fields.map((f) => f.id).filter(Boolean));
	const removedCount = $derived(
		[...existingIds].filter((id) => !v.fields.some((f) => f.id === id)).length
	);

	const EMOJIS = [
		'🎮',
		'🎙️',
		'🍽️',
		'✈️',
		'🎨',
		'🏟️',
		'📰',
		'🎲',
		'🧩',
		'🍷',
		'🏛️',
		'🎪',
		'💃',
		'🎻',
		'📷',
		'🌳',
		'⛰️',
		'🧘',
		'📻',
		'🎠'
	];

	const serializedFields = $derived(
		JSON.stringify(
			v.fields.map((f) => ({
				id: f.id,
				label: f.label,
				type: f.type,
				options: f.options
					.split(',')
					.map((o) => o.trim())
					.filter(Boolean),
				placeholder: f.placeholder
			}))
		)
	);

	beforeNavigate((navigation) => {
		if (!dirty || submitting || saved) return;
		if (navigation.type === 'leave') {
			navigation.cancel();
			return;
		}
		if (!confirm('Ungespeicherte Änderungen verwerfen?')) navigation.cancel();
	});

	async function addField() {
		v.fields = [
			...v.fields,
			{ id: null, uid: crypto.randomUUID(), label: '', type: 'text', options: '', placeholder: '' }
		];
		await tick();
		document.getElementById(`field-label-${v.fields.length - 1}`)?.focus();
	}

	function move(index: number, delta: number) {
		const target = index + delta;
		if (target < 0 || target >= v.fields.length) return;
		const next = [...v.fields];
		[next[index], next[target]] = [next[target], next[index]];
		v.fields = next;
	}

	function remove(index: number) {
		v.fields = v.fields.filter((_, i) => i !== index);
	}

	const err = (key: string) => errors?.[key];
</script>

<form
	method="POST"
	action="?/save"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				saved = true;
				await goto(result.location, { replace: true, refreshAll: true });
				return;
			}
			await update({ reset: false });
			submitting = false;
			if (result.type === 'failure') {
				toasts.show('Bitte prüfe die markierten Felder.', { tone: 'error' });
				await tick();
				document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			}
		};
	}}
>
	<input type="hidden" name="fields" value={serializedFields} />
	<input type="hidden" name="emoji" value={v.emoji} />
	<input type="hidden" name="color" value={v.color} />

	<!-- Vorschau -->
	<div
		class="mb-6 flex items-center gap-4 rounded-3xl p-4 transition-colors"
		style:background-color="color-mix(in oklab, {v.color} 14%, var(--surface))"
	>
		<span
			class="flex size-16 items-center justify-center rounded-2xl bg-surface/60 text-4xl"
			aria-hidden="true">{v.emoji || '❔'}</span
		>
		<div class="min-w-0">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Vorschau</p>
			<p
				class="truncate font-display text-2xl font-semibold"
				style:color="color-mix(in oklab, {v.color} 80%, var(--ink))"
			>
				{v.name || 'Neue Kategorie'}
			</p>
		</div>
	</div>

	<div class="space-y-6">
		<div>
			<label class="label" for="name">Name</label>
			<input
				class="input"
				id="name"
				name="name"
				maxlength="40"
				placeholder="z. B. Podcast, Videospiel, Restaurant"
				bind:value={v.name}
				aria-invalid={err('name') ? 'true' : undefined}
			/>
			{#if err('name')}<p class="field-error">{err('name')}</p>{/if}
		</div>

		<fieldset>
			<legend class="label">Emoji</legend>
			<div class="flex flex-wrap gap-1.5">
				{#each EMOJIS as emoji (emoji)}
					<button
						type="button"
						class={[
							'flex size-11 cursor-pointer items-center justify-center rounded-xl text-2xl transition',
							v.emoji === emoji
								? 'bg-primary ring-2 ring-primary'
								: 'bg-surface-2 hover:bg-surface-3'
						]}
						aria-label="Emoji {emoji}"
						aria-pressed={v.emoji === emoji}
						onclick={() => (v.emoji = emoji)}>{emoji}</button
					>
				{/each}
			</div>
			<div class="mt-2 flex items-center gap-2">
				<label for="emoji-custom" class="text-sm text-muted">Oder eigenes:</label>
				<input
					id="emoji-custom"
					class="input w-20 text-center text-xl"
					maxlength="16"
					value={EMOJIS.includes(v.emoji) ? '' : v.emoji}
					oninput={(e) => (v.emoji = e.currentTarget.value.trim())}
					aria-invalid={err('emoji') ? 'true' : undefined}
				/>
			</div>
			{#if err('emoji')}<p class="field-error">{err('emoji')}</p>{/if}
		</fieldset>

		<fieldset>
			<legend class="label">Farbe</legend>
			<div class="flex flex-wrap gap-2">
				{#each colors as color (color)}
					<button
						type="button"
						class="flex size-11 cursor-pointer items-center justify-center rounded-full transition"
						style:background-color={color}
						style:box-shadow={v.color === color
							? `0 0 0 3px var(--bg), 0 0 0 5px ${color}`
							: 'none'}
						aria-label="Farbe {color}"
						aria-pressed={v.color === color}
						onclick={() => (v.color = color)}
					>
						{#if v.color === color}<Icon
								name="check"
								size={18}
								strokeWidth={3}
								class="text-white"
							/>{/if}
					</button>
				{/each}
			</div>
		</fieldset>

		<!-- Feld-Editor -->
		<section aria-labelledby="fields-title">
			<h2 id="fields-title" class="label mb-0">Felder</h2>
			<p class="mb-3 text-sm text-muted">
				Titel, Datum, Bewertung und Notiz gibt es immer. Hier legst du zusätzliche Vorschläge an –
				beim Eintragen sind alle optional.
			</p>

			{#if v.fields.length}
				<ul class="space-y-3">
					{#each v.fields as field, i (field.uid)}
						<li class="card p-3.5" animate:flip={{ duration: 200 }}>
							<div class="flex items-start gap-2">
								<div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
									<div>
										<label class="sr-only" for="field-label-{i}">Name von Feld {i + 1}</label>
										<input
											class="input"
											id="field-label-{i}"
											placeholder="Feldname, z. B. Plattform"
											maxlength="40"
											bind:value={field.label}
											aria-invalid={err(`fields.${i}.label`) ? 'true' : undefined}
										/>
										{#if err(`fields.${i}.label`)}<p class="field-error">
												{err(`fields.${i}.label`)}
											</p>{/if}
									</div>
									<div>
										<label class="sr-only" for="field-type-{i}">Typ von Feld {i + 1}</label>
										<select class="input" id="field-type-{i}" bind:value={field.type}>
											{#each FIELD_TYPES as type (type)}
												<option value={type}>{FIELD_TYPE_LABELS[type]}</option>
											{/each}
										</select>
									</div>
									{#if field.type === 'select'}
										<div class="sm:col-span-2">
											<label class="sr-only" for="field-options-{i}"
												>Optionen von Feld {i + 1}</label
											>
											<input
												class="input"
												id="field-options-{i}"
												placeholder="Optionen, mit Komma getrennt: PC, Switch, PlayStation"
												bind:value={field.options}
												aria-invalid={err(`fields.${i}.options`) ? 'true' : undefined}
											/>
											{#if err(`fields.${i}.options`)}
												<p class="field-error">{err(`fields.${i}.options`)}</p>
											{/if}
										</div>
									{:else if field.type !== 'boolean'}
										<div class="sm:col-span-2">
											<label class="sr-only" for="field-placeholder-{i}"
												>Platzhalter von Feld {i + 1}</label
											>
											<input
												class="input text-sm"
												id="field-placeholder-{i}"
												placeholder="Platzhalter (optional), z. B. „Wie lange?“"
												maxlength="80"
												bind:value={field.placeholder}
											/>
										</div>
									{/if}
								</div>
								<div class="flex shrink-0 flex-col">
									<button
										type="button"
										class="btn-icon size-9"
										aria-label="Feld {i + 1} nach oben"
										disabled={i === 0}
										onclick={() => move(i, -1)}
									>
										<Icon name="chevron-up" size={18} />
									</button>
									<button
										type="button"
										class="btn-icon size-9"
										aria-label="Feld {i + 1} nach unten"
										disabled={i === v.fields.length - 1}
										onclick={() => move(i, 1)}
									>
										<Icon name="chevron-down" size={18} />
									</button>
									<button
										type="button"
										class="btn-icon size-9 hover:bg-danger-soft hover:text-danger"
										aria-label="Feld {i + 1} löschen"
										onclick={() => remove(i)}
									>
										<Icon name="trash" size={17} />
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p
					class="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted"
				>
					Noch keine Felder. Du kannst auch ohne Felder starten.
				</p>
			{/if}

			{#if removedCount}
				<p class="mt-3 rounded-xl bg-gold-soft px-3.5 py-2.5 text-sm text-ink-soft">
					{removedCount === 1 ? '1 Feld wird' : `${removedCount} Felder werden`} entfernt. Bereits eingetragene
					Werte bleiben in den Einträgen als eigene Felder erhalten.
				</p>
			{/if}
			{#if err('fields')}<p class="field-error">{err('fields')}</p>{/if}

			<button type="button" class="btn btn-secondary mt-3 w-full sm:w-auto" onclick={addField}>
				<Icon name="plus" size={18} /> Feld hinzufügen
			</button>
		</section>
	</div>

	<div
		class="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
	>
		<button class="btn btn-primary w-full" disabled={submitting}>
			{submitting ? 'Speichern …' : submitLabel}
		</button>
	</div>
</form>
