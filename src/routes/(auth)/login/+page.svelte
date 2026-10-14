<script lang="ts">
	import { enhance } from '$app/forms';
	import { dev } from '$app/env';
	import { page } from '$app/state';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);

	const registerHref = $derived.by(() => {
		const target = page.url.searchParams.get('redirectTo');
		return target ? `/register?redirectTo=${encodeURIComponent(target)}` : '/register';
	});
</script>

<svelte:head>
	<title>Anmelden · Journalify</title>
</svelte:head>

<form
	method="POST"
	class="card space-y-4 p-6"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<h1 class="text-2xl font-semibold">Willkommen zurück</h1>

	{#if form?.message}
		<p class="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">
			{form.message}
		</p>
	{/if}

	<div>
		<label class="label" for="username">Benutzername</label>
		<input
			class="input"
			id="username"
			name="username"
			autocomplete="username"
			autocapitalize="none"
			autocorrect="off"
			spellcheck="false"
			required
			value={form?.username ?? ''}
		/>
	</div>

	<div>
		<label class="label" for="password">Passwort</label>
		<PasswordInput id="password" name="password" autocomplete="current-password" />
	</div>

	<button class="btn btn-primary w-full" disabled={submitting}>
		{submitting ? 'Anmelden …' : 'Anmelden'}
	</button>

	<p class="text-center text-sm text-muted">
		Noch kein Konto? <a
			class="font-semibold text-ink underline underline-offset-4"
			href={registerHref}>Registrieren</a
		>
	</p>
</form>

{#if dev}
	<p class="mt-4 rounded-2xl bg-gold-soft px-4 py-3 text-center text-sm text-ink-soft">
		<strong>Demo:</strong> <code>demo</code> / <code>journalify</code>
		<span class="block text-xs text-muted">(auch <code>anna</code> und <code>ben</code>)</span>
	</p>
{/if}
