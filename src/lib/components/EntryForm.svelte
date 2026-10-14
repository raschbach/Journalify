<script lang="ts">
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { beforeNavigate, goto } from '$app/navigation';
	import { addDays } from '../dates';
	import { randomPrompt } from '../prompts';
	import { toasts } from '../toast.svelte';
	import type { CatalogResult, EntryFormValues, ExtraField, FormCategory } from '../types';
	import {
		entryXp,
		LONG_NOTE_MIN_LENGTH,
		NOTE_MIN_LENGTH,
		noteLength,
		XP_RULES
	} from '../xp';
	import CategoryIcon from './CategoryIcon.svelte';
	import Icon from './Icon.svelte';
	import StarInput from './StarInput.svelte';
	import TitleAutocomplete from './TitleAutocomplete.svelte';

	interface Props {
		categories: FormCategory[];
		initial: EntryFormValues;
		mode: 'create' | 'edit';
		today: string;
		errors?: Record<string, string> | null;
		/** XP des Eintrags vor dem Bearbeiten */
		originalXp?: number;
	}

	let { categories, initial, mode, today, errors = null, originalXp = 0 }: Props = $props();

	// Das Formular arbeitet auf einer lokalen Kopie der Startwerte.
	// svelte-ignore state_referenced_locally
	let v = $state<EntryFormValues>(structuredClone($state.snapshot(initial)));
	// svelte-ignore state_referenced_locally
	const initialJson = JSON.stringify(initial);

	const category = $derived(categories.find((c) => c.id === v.categoryId) ?? categories[0]);

	// svelte-ignore state_referenced_locally
	let prompt = $state(randomPrompt(initial.categoryId ? categories.find((c) => c.id === initial.categoryId)?.slug : undefined));
	let submitting = $state(false);
	let saved = false;
	let detailsOpen = $state(false);

	const xp = $derived(entryXp({ rating: v.rating, notes: v.notes }));
	const length = $derived(noteLength(v.notes));
	const dirty = $derived(JSON.stringify(v) !== initialJson);

	const detailCount = $derived(
		[v.creator, v.year, v.coverUrl].filter((x) => x.trim()).length +
			Object.values(v.fieldValues).filter((x) => (typeof x === 'string' ? x.trim() : x)).length +
			v.extraFields.filter((f) => f.label.trim() || f.value.trim()).length
	);

	// svelte-ignore state_referenced_locally
	if (mode === 'edit' && detailCount > 0) detailsOpen = true;

	$effect(() => {
		// Fehler in den Details sichtbar machen
		if (errors && Object.keys(errors).some((k) => k.startsWith('f.') || k.startsWith('extra') || ['creator', 'year', 'coverUrl'].includes(k))) {
			detailsOpen = true;
		}
	});

	const noteHint = $derived.by(() => {
		if (length === 0) return `Eine Notiz ab ${NOTE_MIN_LENGTH} Zeichen bringt +${XP_RULES.note} XP.`;
		if (length < NOTE_MIN_LENGTH) return `Noch ${NOTE_MIN_LENGTH - length} Zeichen bis +${XP_RULES.note} XP.`;
		if (length < LONG_NOTE_MIN_LENGTH)
			return `Noch ${LONG_NOTE_MIN_LENGTH - length} Zeichen bis +${XP_RULES.longNote} XP für eine ausführliche Notiz.`;
		return 'Ausführliche Notiz – volle XP! ✨';
	});

	beforeNavigate((navigation) => {
		if (!dirty || submitting || saved) return;
		if (navigation.type === 'leave') {
			navigation.cancel();
			return;
		}
		if (!confirm('Ungespeicherte Änderungen verwerfen?')) navigation.cancel();
	});

	function changeCategory(id: string) {
		const next = categories.find((c) => c.id === id);
		if (!next || next.id === category.id) return;

		// Werte von Feldern, die es in der neuen Kategorie nicht gibt, als eigene Felder behalten
		const moved: ExtraField[] = [];
		const kept: Record<string, string | boolean> = {};
		for (const field of category.fields) {
			const value = v.fieldValues[field.key];
			if (value === undefined || value === '' || value === false) continue;
			const target = next.fields.find((f) => f.key === field.key && f.type === field.type);
			const compatible =
				target && (target.type !== 'select' || target.options?.includes(String(value)));
			if (compatible) kept[field.key] = value;
			else moved.push({ label: field.label, value: value === true ? 'Ja' : String(value) });
		}
		v.fieldValues = kept;
		if (moved.length) {
			v.extraFields = [...v.extraFields, ...moved];
			detailsOpen = true;
			toasts.show(`${moved.length === 1 ? 'Ein Feld wurde' : `${moved.length} Felder wurden`} als eigenes Feld übernommen.`, { tone: 'info' });
		}
		v.catalogItemId = null;
		v.catalogLabel = null;
		v.categoryId = next.id;
		prompt = randomPrompt(next.slug, prompt);
	}

	function pickCatalog(item: CatalogResult) {
		v.title = item.title;
		v.catalogItemId = item.id;
		v.catalogLabel = [item.creator, item.year].filter(Boolean).join(' · ') || item.title;
		if (item.creator) v.creator = item.creator;
		if (item.year) v.year = String(item.year);
		// Genre o. Ä. in passende Felder übernehmen, wenn sie leer sind
		for (const [key, value] of Object.entries(item.metadata ?? {})) {
			const field = category.fields.find((f) => f.key === key);
			if (field && !v.fieldValues[key]) v.fieldValues[key] = value;
		}
	}

	async function addExtraField() {
		v.extraFields = [...v.extraFields, { label: '', value: '' }];
		detailsOpen = true;
		await tick();
		document.getElementById(`extra-label-${v.extraFields.length - 1}`)?.focus();
	}

	function removeExtraField(index: number) {
		v.extraFields = v.extraFields.filter((_, i) => i !== index);
	}

	async function focusFirstError() {
		await tick();
		const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		el?.focus({ preventScroll: true });
	}

	const err = (key: string) => errors?.[key];

	const VISIBILITY_OPTIONS = [
		{ value: 'friends', label: 'Freunde', icon: 'users' },
		{ value: 'private', label: 'Privat', icon: 'lock' }
	] as const;
</script>

<form
	method="POST"
	novalidate
	use:enhance={({ cancel }) => {
		if (!v.title.trim()) {
			cancel();
			errors = { ...(errors ?? {}), title: 'Bitte gib einen Titel ein.' };
			focusFirstError();
			return;
		}
		submitting = true;
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				// Formular im Verlauf ersetzen, damit „Zurück“ nicht wieder im Formular landet
				saved = true;
				await goto(result.location, { replace: true, refreshAll: true });
				return;
			}
			await update({ reset: false });
			submitting = false;
			if (result.type === 'failure') {
				toasts.show('Bitte prüfe die markierten Felder.', { tone: 'error' });
				focusFirstError();
			}
		};
	}}
>
	<input type="hidden" name="categoryId" value={category.id} />
	<input type="hidden" name="catalogItemId" value={v.catalogItemId ?? ''} />

	<div class="space-y-6">
		<!-- Kategorie -->
		<div class="flex items-center gap-3">
			<CategoryIcon emoji={category.emoji} color={category.color} size="lg" />
			<div class="min-w-0 flex-1">
				<label for="category" class="text-xs font-semibold tracking-wide text-muted uppercase">
					Kategorie
				</label>
				<div class="relative">
					<select
						id="category"
						class="-ml-1 w-full max-w-full cursor-pointer appearance-none truncate rounded-lg bg-transparent py-0.5 pr-8 pl-1 font-display text-xl font-semibold outline-none hover:bg-surface-2"
						value={category.id}
						onchange={(e) => changeCategory(e.currentTarget.value)}
					>
						{#each categories as c (c.id)}
							<option value={c.id}>{c.emoji} {c.name}</option>
						{/each}
					</select>
					<Icon
						name="chevron-down"
						size={18}
						class="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-muted"
					/>
				</div>
			</div>
		</div>

		<!-- Titel -->
		<div>
			<label class="label" for="title">Titel</label>
			<TitleAutocomplete
				categoryId={category.id}
				searchable={category.hasCatalog}
				bind:value={v.title}
				linked={v.catalogItemId ? { id: v.catalogItemId, label: v.catalogLabel ?? '' } : null}
				invalid={!!err('title')}
				autofocus={mode === 'create'}
				onpick={pickCatalog}
				onunlink={() => {
					v.catalogItemId = null;
					v.catalogLabel = null;
				}}
			/>
			{#if err('title')}<p class="field-error">{err('title')}</p>{/if}
		</div>

		<!-- Datum -->
		<div>
			<label class="label" for="experiencedAt">Datum</label>
			<div class="flex flex-wrap items-center gap-2">
				<input
					class="input w-auto min-w-0 flex-1 sm:max-w-52"
					id="experiencedAt"
					name="experiencedAt"
					type="date"
					required
					bind:value={v.experiencedAt}
					aria-invalid={err('experiencedAt') ? 'true' : undefined}
				/>
				<button
					type="button"
					class="chip h-11"
					aria-pressed={v.experiencedAt === today}
					onclick={() => (v.experiencedAt = today)}>Heute</button
				>
				<button
					type="button"
					class="chip h-11"
					aria-pressed={v.experiencedAt === addDays(today, -1)}
					onclick={() => (v.experiencedAt = addDays(today, -1))}>Gestern</button
				>
			</div>
			{#if err('experiencedAt')}<p class="field-error">{err('experiencedAt')}</p>{/if}
		</div>

		<!-- Bewertung -->
		<fieldset>
			<legend class="label">Bewertung</legend>
			<StarInput bind:value={v.rating} />
			{#if err('rating')}<p class="field-error">{err('rating')}</p>{/if}
		</fieldset>

		<!-- Notiz -->
		<div>
			<div class="mb-1.5 flex items-end justify-between gap-2">
				<label class="label mb-0" for="notes">Notiz</label>
				<button
					type="button"
					class="-mr-2 flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
					onclick={() => (prompt = randomPrompt(category.slug, prompt))}
				>
					<Icon name="shuffle" size={15} /> Anderer Impuls
				</button>
			</div>
			<textarea
				class="input notes min-h-36"
				id="notes"
				name="notes"
				rows="5"
				placeholder={prompt}
				bind:value={v.notes}
				aria-describedby="notes-hint"
				aria-invalid={err('notes') ? 'true' : undefined}
			></textarea>
			{#if err('notes')}
				<p class="field-error">{err('notes')}</p>
			{:else}
				<p id="notes-hint" class="mt-1.5 flex justify-between gap-3 text-sm text-muted">
					<span>{noteHint}</span>
					{#if length}<span class="shrink-0 tabular-nums">{length}</span>{/if}
				</p>
			{/if}
		</div>

		<!-- Details -->
		<details class="group card overflow-hidden" bind:open={detailsOpen}>
			<summary
				class="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 select-none [&::-webkit-details-marker]:hidden"
			>
				<span class="flex-1">
					<span class="font-semibold">Details</span>
					<span class="block text-sm text-muted">
						{#if detailCount}
							{detailCount} ausgefüllt
						{:else}
							{[category.creatorLabel, ...category.fields.slice(0, 3).map((f) => f.label)]
								.filter(Boolean)
								.slice(0, 3)
								.join(', ') || 'Eigene Felder'} …
						{/if}
					</span>
				</span>
				<Icon name="chevron-down" class="text-muted transition-transform group-open:rotate-180" />
			</summary>

			<div class="space-y-4 border-t border-line px-4 pt-4 pb-5">
				<p class="text-sm text-muted">Alles hier ist optional – füll aus, was dir wichtig ist.</p>

				<div class="grid gap-4 sm:grid-cols-2">
					{#if category.creatorLabel || v.creator}
						<div>
							<label class="label" for="creator">{category.creatorLabel ?? 'Ersteller:in'}</label>
							<input
								class="input"
								id="creator"
								name="creator"
								maxlength="200"
								bind:value={v.creator}
								aria-invalid={err('creator') ? 'true' : undefined}
							/>
						</div>
					{/if}
					{#if category.yearLabel || v.year}
						<div>
							<label class="label" for="year">{category.yearLabel ?? 'Jahr'}</label>
							<input
								class="input"
								id="year"
								name="year"
								type="number"
								inputmode="numeric"
								min="0"
								max="3000"
								bind:value={v.year}
								aria-invalid={err('year') ? 'true' : undefined}
							/>
							{#if err('year')}<p class="field-error">{err('year')}</p>{/if}
						</div>
					{/if}

					{#each category.fields as field (field.id)}
						{@const name = `f.${field.key}`}
						{@const id = `field-${field.key}`}
						<div class={field.type === 'longtext' ? 'sm:col-span-2' : ''}>
							{#if field.type === 'boolean'}
								<label class="flex min-h-11 cursor-pointer items-center gap-3 sm:mt-7">
									<input
										type="checkbox"
										{name}
										class="size-5 accent-[var(--ink)]"
										checked={v.fieldValues[field.key] === true}
										onchange={(e) => (v.fieldValues[field.key] = e.currentTarget.checked)}
									/>
									<span class="font-medium">{field.label}</span>
								</label>
							{:else}
								<label class="label" for={id}>{field.label}</label>
								{#if field.type === 'select'}
									<select
										class="input"
										{id}
										{name}
										value={String(v.fieldValues[field.key] ?? '')}
										onchange={(e) => (v.fieldValues[field.key] = e.currentTarget.value)}
										aria-invalid={err(name) ? 'true' : undefined}
									>
										<option value="">– keine Angabe –</option>
										{#each field.options ?? [] as option (option)}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else if field.type === 'longtext'}
									<textarea
										class="input"
										{id}
										{name}
										rows="3"
										placeholder={field.placeholder ?? ''}
										value={String(v.fieldValues[field.key] ?? '')}
										oninput={(e) => (v.fieldValues[field.key] = e.currentTarget.value)}
									></textarea>
								{:else}
									<input
										class="input"
										{id}
										{name}
										type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
										inputmode={field.type === 'number' ? 'decimal' : undefined}
										step={field.type === 'number' ? 'any' : undefined}
										placeholder={field.placeholder ?? (field.type === 'people' ? 'Namen mit Komma trennen' : '')}
										value={String(v.fieldValues[field.key] ?? '')}
										oninput={(e) => (v.fieldValues[field.key] = e.currentTarget.value)}
										aria-invalid={err(name) ? 'true' : undefined}
									/>
								{/if}
								{#if err(name)}<p class="field-error">{err(name)}</p>{/if}
							{/if}
						</div>
					{/each}
				</div>

				<!-- Eigene Felder -->
				{#if v.extraFields.length}
					<div class="space-y-2">
						<p class="label mb-0">Eigene Felder</p>
						{#each v.extraFields as extra, i (i)}
							<div class="flex items-start gap-2" transition:slide={{ duration: 150 }}>
								<div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
									<input
										class="input"
										id="extra-label-{i}"
										name="extraLabel"
										placeholder="Name, z. B. Snack"
										aria-label="Name des eigenen Feldes {i + 1}"
										maxlength="60"
										bind:value={extra.label}
										aria-invalid={err(`extra.${i}`) ? 'true' : undefined}
									/>
									<input
										class="input"
										name="extraValue"
										placeholder="Wert, z. B. Popcorn"
										aria-label="Wert des eigenen Feldes {i + 1}"
										bind:value={extra.value}
									/>
									{#if err(`extra.${i}`)}<p class="field-error -mt-1 sm:col-span-2">{err(`extra.${i}`)}</p>{/if}
								</div>
								<button
									type="button"
									class="btn-icon"
									aria-label="Eigenes Feld {i + 1} entfernen"
									onclick={() => removeExtraField(i)}
								>
									<Icon name="trash" size={18} />
								</button>
							</div>
						{/each}
					</div>
				{/if}
				<button type="button" class="btn btn-secondary w-full sm:w-auto" onclick={addExtraField}>
					<Icon name="plus" size={18} /> Feld hinzufügen
				</button>

				<div>
					<label class="label" for="coverUrl">Cover-URL</label>
					<input
						class="input"
						id="coverUrl"
						name="coverUrl"
						type="url"
						inputmode="url"
						placeholder="https://…"
						bind:value={v.coverUrl}
						aria-invalid={err('coverUrl') ? 'true' : undefined}
					/>
					{#if err('coverUrl')}
						<p class="field-error">{err('coverUrl')}</p>
					{:else}
						<p class="mt-1.5 text-xs text-muted">Optional – sonst zeigen wir das Emoji der Kategorie.</p>
					{/if}
				</div>
			</div>
		</details>

		<!-- Sichtbarkeit -->
		<fieldset>
			<legend class="label">Sichtbarkeit</legend>
			<div class="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
				{#each VISIBILITY_OPTIONS as option (option.value)}
					<label
						class={[
							'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]',
							v.visibility === option.value ? 'bg-surface text-ink shadow-card' : 'text-muted'
						]}
					>
						<input
							type="radio"
							name="visibility"
							value={option.value}
							class="sr-only"
							bind:group={v.visibility}
						/>
						<Icon name={option.icon} size={17} />
						{option.label}
					</label>
				{/each}
			</div>
			<p class="mt-1.5 text-sm text-muted">
				{v.visibility === 'friends'
					? 'Deine bestätigten Freund:innen sehen diesen Eintrag.'
					: 'Nur du siehst diesen Eintrag.'}
			</p>
		</fieldset>
	</div>

	<!-- Speichern-Leiste -->
	<div
		class="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div class="min-w-0 flex-1" aria-live="polite">
				<p class="flex flex-wrap gap-x-2 text-xs font-semibold">
					<span class="text-ink-soft">+{xp.entry} Eintrag</span>
					<span class={xp.rating ? 'text-ink-soft' : 'text-muted/50 line-through'}>+{XP_RULES.rating} Bewertung</span>
					<span class={xp.note ? 'text-ink-soft' : 'text-muted/50 line-through'}>+{XP_RULES.note} Notiz</span>
					{#if xp.note}
						<span class={xp.longNote ? 'text-ink-soft' : 'text-muted/50 line-through'}
							>+{XP_RULES.longNote} ausführlich</span
						>
					{/if}
				</p>
				<p class="font-display text-lg leading-tight font-semibold">
					<span class="text-gold">✦</span>
					{#if mode === 'edit'}
						{xp.total} XP
						{#if xp.total !== originalXp}
							<span class={['text-sm', xp.total > originalXp ? 'text-success' : 'text-danger']}>
								({xp.total > originalXp ? '+' : ''}{xp.total - originalXp})
							</span>
						{/if}
					{:else}
						+{xp.total} XP
					{/if}
				</p>
			</div>
			<button class="btn btn-primary min-w-32 px-6" disabled={submitting}>
				{#if submitting}
					<span class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
					Speichern …
				{:else}
					<Icon name="check" size={18} strokeWidth={2.5} /> Speichern
				{/if}
			</button>
		</div>
	</div>
</form>

<style>
	.notes {
		field-sizing: content;
		max-height: 60vh;
	}
</style>
