<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import CategoryPill from '#lib/components/CategoryPill.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Cover from '#lib/components/Cover.svelte';
	import FieldList from '#lib/components/FieldList.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import { formatDate, formatDateLong, relativeLabel, toISODate } from '#lib/dates.ts';
	import { randomPrompt } from '#lib/prompts.ts';
	import {
		describeXp,
		entryXp,
		LONG_NOTE_MIN_LENGTH,
		NOTE_MIN_LENGTH,
		noteLength,
		XP_RULES
	} from '#lib/xp.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const entry = $derived(data.entry);
	const category = $derived(data.category);
	const xp = $derived(entryXp(entry));
	const length = $derived(noteLength(entry.notes));

	let confirmDelete = $state(false);
	let noteDraft = $state('');
	let savingNote = $state(false);
	// svelte-ignore state_referenced_locally
	let notePrompt = $state(randomPrompt(data.category.slug));

	const draftLength = $derived(noteLength(noteDraft));
	const subtitle = $derived([entry.creator, entry.year].filter(Boolean).join(' · '));
	const edited = $derived(entry.updatedAt - entry.createdAt > 60_000);
</script>

<svelte:head>
	<title>{entry.title} · Journalify</title>
</svelte:head>

<PageHeader back="/" historyBack>
	{#snippet actions()}
		{#if data.isOwner}
			<a href="/entries/{entry.id}/edit" class="btn btn-secondary" data-sveltekit-replacestate>
				<Icon name="pencil" size={17} /> Bearbeiten
			</a>
			<button
				type="button"
				class="btn-icon text-danger hover:bg-danger-soft hover:text-danger"
				aria-label="Eintrag löschen"
				title="Löschen"
				onclick={() => (confirmDelete = true)}
			>
				<Icon name="trash" />
			</button>
		{/if}
	{/snippet}
</PageHeader>

<article class="-mt-3">
	<div class="flex gap-4">
		<Cover {entry} {category} size="lg" />
		<div class="min-w-0 flex-1 pt-1">
			<CategoryPill emoji={category.emoji} name={category.name} color={category.color} />
			<h1 class="mt-2 text-[1.75rem] leading-[1.15] font-semibold break-words">{entry.title}</h1>
			{#if subtitle}<p class="mt-1 text-ink-soft">{subtitle}</p>{/if}
		</div>
	</div>

	<div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
		<span class="flex items-center gap-1.5 text-ink-soft">
			<Icon name="calendar" size={16} />
			<span>
				{formatDateLong(entry.experiencedAt)}
				<span class="text-muted">· {relativeLabel(entry.experiencedAt, data.today)}</span>
			</span>
		</span>
		{#if entry.rating}
			<Stars rating={entry.rating} size="md" />
		{/if}
		{#if data.isOwner}
			<span class="flex items-center gap-1.5 text-muted">
				<Icon name={entry.visibility === 'private' ? 'lock' : 'users'} size={15} />
				{entry.visibility === 'private' ? 'Privat' : 'Für Freunde sichtbar'}
			</span>
		{/if}
	</div>

	{#if !data.isOwner}
		<a
			href="/u/{data.author.username}"
			class="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-2 py-1 pr-3.5 pl-1 text-sm font-semibold hover:bg-surface-3"
		>
			<Avatar name={data.author.displayName} size="sm" />
			Eintrag von {data.author.displayName}
		</a>
	{/if}

	<!-- Notiz -->
	{#if entry.notes}
		<section class="card mt-6 p-5" aria-label="Notiz">
			<p class="text-[1.05rem] leading-relaxed break-words whitespace-pre-line text-ink">
				{entry.notes}
			</p>
		</section>
	{:else if data.isOwner}
		<section class="mt-6 rounded-2xl border-2 border-dashed border-gold/50 bg-gold-soft/50 p-5">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<Icon name="pencil" size={18} class="text-gold" /> Notiz ergänzen
				<span
					class="ml-auto rounded-full bg-gold px-2.5 py-0.5 font-sans text-sm font-bold text-[#1f1b16]"
					>+{XP_RULES.note} XP</span
				>
			</h2>
			<p class="mt-1 text-sm text-ink-soft">Halte fest, was dir in Erinnerung bleiben soll.</p>
			<form
				method="POST"
				action="?/addNote"
				class="mt-3"
				use:enhance={() => {
					savingNote = true;
					return async ({ update }) => {
						await update();
						savingNote = false;
					};
				}}
			>
				<label class="sr-only" for="note-draft">Notiz</label>
				<textarea
					id="note-draft"
					name="notes"
					class="input min-h-28 bg-surface"
					rows="4"
					placeholder={notePrompt}
					bind:value={noteDraft}
					aria-invalid={form?.noteError ? 'true' : undefined}></textarea>
				<div class="mt-2 flex flex-wrap items-center justify-between gap-2">
					<p class="text-sm text-muted">
						{#if form?.noteError}
							<span class="font-medium text-danger">{form.noteError}</span>
						{:else if draftLength < NOTE_MIN_LENGTH}
							Noch {NOTE_MIN_LENGTH - draftLength} Zeichen bis +{XP_RULES.note} XP
						{:else}
							<span class="font-semibold text-success">+{XP_RULES.note} XP gesichert ✓</span>
						{/if}
					</p>
					<div class="flex gap-1">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => (notePrompt = randomPrompt(category.slug, notePrompt))}
						>
							<Icon name="shuffle" size={16} /> Impuls
						</button>
						<button class="btn btn-primary" disabled={savingNote || !noteDraft.trim()}>
							{savingNote ? 'Speichern …' : 'Speichern'}
						</button>
					</div>
				</div>
			</form>
		</section>
	{/if}

	<!-- Details -->
	<FieldList {category} fieldValues={entry.fieldValues} extraFields={entry.extraFields} />

	<!-- XP -->
	{#if data.isOwner}
		<section class="mt-6 flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
			<span
				class="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-lg text-gold"
				>✦</span
			>
			<div class="text-sm">
				<p class="font-semibold">Dieser Eintrag bringt {xp.total} XP</p>
				<p class="text-muted">{describeXp(xp)}</p>
				{#if length >= NOTE_MIN_LENGTH && length < LONG_NOTE_MIN_LENGTH}
					<p class="mt-1 text-ink-soft">
						Noch {LONG_NOTE_MIN_LENGTH - length} Zeichen für +{XP_RULES.longNote} XP –
						<a
							class="font-semibold underline underline-offset-4"
							href="/entries/{entry.id}/edit"
							data-sveltekit-replacestate>Notiz erweitern</a
						>
					</p>
				{:else if !entry.rating}
					<p class="mt-1 text-ink-soft">
						Eine Bewertung bringt +{XP_RULES.rating} XP –
						<a
							class="font-semibold underline underline-offset-4"
							href="/entries/{entry.id}/edit"
							data-sveltekit-replacestate>jetzt bewerten</a
						>
					</p>
				{/if}
			</div>
		</section>
	{/if}

	<p class="mt-6 text-center text-xs text-muted">
		Eingetragen am {formatDate(toISODate(new Date(entry.createdAt)))}{#if edited}
			· bearbeitet am {formatDate(toISODate(new Date(entry.updatedAt)))}{/if}
	</p>
</article>

{#if data.isOwner}
	<ConfirmDialog
		bind:open={confirmDelete}
		title="Eintrag löschen?"
		confirmLabel="Löschen"
		danger
		action="?/delete"
	>
		„{entry.title}“ wird endgültig gelöscht. Die {xp.total} XP dieses Eintrags werden abgezogen.
	</ConfirmDialog>
{/if}
