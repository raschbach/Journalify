<script lang="ts">
	import { enhance } from '$app/forms';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	let username = $state('');

	$effect(() => {
		if (form?.values) username = form.values.username;
	});
</script>

<svelte:head>
	<title>Registrieren · Journalify</title>
</svelte:head>

<form
	method="POST"
	class="card space-y-4 p-6"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<h1 class="text-2xl font-semibold">Konto erstellen</h1>

	<div>
		<label class="label" for="displayName">Dein Name</label>
		<input
			class="input"
			id="displayName"
			name="displayName"
			autocomplete="nickname"
			maxlength="40"
			placeholder="So sehen dich deine Freund:innen"
			value={form?.values?.displayName ?? ''}
			aria-invalid={form?.errors?.displayName ? 'true' : undefined}
			aria-describedby={form?.errors?.displayName ? 'displayName-error' : undefined}
		/>
		{#if form?.errors?.displayName}
			<p class="field-error" id="displayName-error">{form.errors.displayName}</p>
		{/if}
	</div>

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
			maxlength="24"
			bind:value={username}
			oninput={() => (username = username.toLowerCase().replace(/\s/g, ''))}
			aria-invalid={form?.errors?.username ? 'true' : undefined}
			aria-describedby="username-hint"
		/>
		{#if form?.errors?.username}
			<p class="field-error" id="username-hint">{form.errors.username}</p>
		{:else}
			<p class="mt-1.5 text-xs text-muted" id="username-hint">
				Über diesen Namen können dich Freund:innen hinzufügen. Kleinbuchstaben, Ziffern, „.“ und
				„_“.
			</p>
		{/if}
	</div>

	<div>
		<label class="label" for="password">Passwort</label>
		<PasswordInput
			id="password"
			name="password"
			autocomplete="new-password"
			invalid={!!form?.errors?.password}
			describedby="password-hint"
		/>
		{#if form?.errors?.password}
			<p class="field-error" id="password-hint">{form.errors.password}</p>
		{:else}
			<p class="mt-1.5 text-xs text-muted" id="password-hint">Mindestens 8 Zeichen.</p>
		{/if}
	</div>

	<button class="btn btn-primary w-full" disabled={submitting}>
		{submitting ? 'Konto wird erstellt …' : 'Konto erstellen'}
	</button>

	<p class="text-center text-sm text-muted">
		Schon dabei? <a class="font-semibold text-ink underline underline-offset-4" href="/login"
			>Anmelden</a
		>
	</p>
</form>
