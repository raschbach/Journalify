<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let adding = $state(false);
	let pending = $state<string | null>(null);
	let removeTarget = $state<{ username: string; displayName: string } | null>(null);
	let confirmOpen = $state(false);

	/** Ladezustand pro Zeile, damit Buttons nicht doppelt ausgelöst werden */
	function rowEnhance(key: string) {
		return () => {
			pending = key;
			return async ({ update }: { update: () => Promise<void> }) => {
				await update();
				pending = null;
			};
		};
	}
</script>

<svelte:head>
	<title>Freunde · Journalify</title>
</svelte:head>

<PageHeader title="Freunde" subtitle="Geteilt wird nur mit bestätigten Freund:innen." back="/profile" backLabel="Zum Profil" />

<section class="card mb-6 p-4">
	<form
		method="POST"
		action="?/add"
		use:enhance={() => {
			adding = true;
			return async ({ result, update }) => {
				await update({ reset: result.type === 'success' });
				adding = false;
			};
		}}
	>
		<label for="friend-username" class="label">Freund:in hinzufügen</label>
		<div class="flex gap-2">
			<div class="relative min-w-0 flex-1">
				<span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">@</span>
				<input
					id="friend-username"
					name="username"
					class="input pl-8"
					placeholder="benutzername"
					autocomplete="off"
					autocapitalize="none"
					autocorrect="off"
					spellcheck="false"
					value={form?.username ?? ''}
					aria-invalid={form?.addError ? 'true' : undefined}
					aria-describedby="friend-hint"
				/>
			</div>
			<button class="btn btn-primary" disabled={adding}>
				<Icon name="user-plus" size={18} />
				<span class="hidden sm:inline">{adding ? 'Sende …' : 'Anfrage senden'}</span>
				<span class="sm:hidden">{adding ? '…' : 'Senden'}</span>
			</button>
		</div>
		{#if form?.addError}
			<p class="field-error" id="friend-hint">{form.addError}</p>
		{:else}
			<p class="mt-1.5 text-sm text-muted" id="friend-hint">
				Gib den <strong>exakten</strong> Benutzernamen ein – eine öffentliche Suche gibt es bewusst nicht. Dein eigener
				Name: <strong class="text-ink">@{data.me.username}</strong>
			</p>
		{/if}
	</form>
</section>

{#if data.incoming.length}
	<section class="mb-6" aria-labelledby="incoming">
		<h2 id="incoming" class="section-title mb-3 flex items-center gap-2">
			Anfragen <span class="rounded-full bg-danger px-2 py-0.5 font-sans text-xs font-bold text-white">{data.incoming.length}</span>
		</h2>
		<ul class="card divide-y divide-line overflow-hidden">
			{#each data.incoming as user (user.id)}
				<li class="flex flex-wrap items-center gap-3 p-3.5">
					<Avatar name={user.displayName} />
					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold">{user.displayName}</p>
						<p class="truncate text-sm text-muted">@{user.username} möchte mit dir befreundet sein</p>
					</div>
					<div class="flex w-full gap-2 sm:w-auto">
						<form method="POST" action="?/decline" class="flex-1 sm:flex-none" use:enhance={rowEnhance(`decline-${user.id}`)}>
							<input type="hidden" name="username" value={user.username} />
							<button class="btn btn-secondary w-full" disabled={pending !== null}>Ablehnen</button>
						</form>
						<form method="POST" action="?/accept" class="flex-1 sm:flex-none" use:enhance={rowEnhance(`accept-${user.id}`)}>
							<input type="hidden" name="username" value={user.username} />
							<button class="btn btn-primary w-full" disabled={pending !== null}>
								<Icon name="check" size={18} /> Annehmen
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mb-6" aria-labelledby="friends-list">
	<h2 id="friends-list" class="section-title mb-3">Freund:innen <span class="font-sans text-base font-normal text-muted">{data.friends.length}</span></h2>
	{#if data.friends.length}
		<ul class="card divide-y divide-line overflow-hidden">
			{#each data.friends as user (user.id)}
				<li class="flex items-center gap-1 pr-2">
					<a href="/u/{user.username}" class="flex min-w-0 flex-1 items-center gap-3 p-3.5 hover:bg-surface-2">
						<Avatar name={user.displayName} />
						<span class="min-w-0">
							<span class="block truncate font-semibold">{user.displayName}</span>
							<span class="block truncate text-sm text-muted">@{user.username}</span>
						</span>
					</a>
					<button
						type="button"
						class="btn btn-ghost px-3 text-sm text-muted hover:text-danger"
						onclick={() => {
							removeTarget = user;
							confirmOpen = true;
						}}
					>
						Entfernen
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState emoji="👋" title="Noch keine Freund:innen">
			Schick jemandem eine Anfrage über den Benutzernamen. Sobald sie angenommen ist, seht ihr gegenseitig eure geteilten
			Einträge.
		</EmptyState>
	{/if}
</section>

{#if data.outgoing.length}
	<section aria-labelledby="outgoing">
		<h2 id="outgoing" class="section-title mb-3">Gesendete Anfragen</h2>
		<ul class="card divide-y divide-line overflow-hidden">
			{#each data.outgoing as user (user.id)}
				<li class="flex items-center gap-3 p-3.5">
					<Avatar name={user.displayName} />
					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold">{user.displayName}</p>
						<p class="truncate text-sm text-muted">@{user.username} · wartet auf Antwort</p>
					</div>
					<form method="POST" action="?/withdraw" use:enhance={rowEnhance(`withdraw-${user.id}`)}>
						<input type="hidden" name="username" value={user.username} />
						<button class="btn btn-secondary text-sm" disabled={pending !== null}>Zurückziehen</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<ConfirmDialog
	bind:open={confirmOpen}
	title="{removeTarget?.displayName ?? ''} entfernen?"
	confirmLabel="Entfernen"
	danger
	action="?/remove"
>
	Ihr seht danach gegenseitig keine geteilten Einträge mehr. Du kannst später erneut eine Anfrage schicken.
	{#snippet fields()}
		<input type="hidden" name="username" value={removeTarget?.username ?? ''} />
	{/snippet}
</ConfirmDialog>
