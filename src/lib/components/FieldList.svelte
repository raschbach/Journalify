<script lang="ts">
	import { formatDate } from '../dates';
	import type { ExtraField, FieldDef, FieldValue } from '../types';

	interface Props {
		category: { fields: FieldDef[] };
		fieldValues: Record<string, FieldValue>;
		extraFields: ExtraField[];
	}

	let { category, fieldValues, extraFields }: Props = $props();

	interface Row {
		label: string;
		value: string;
		people?: string[];
	}

	const rows = $derived.by(() => {
		const list: Row[] = [];
		for (const field of category.fields) {
			const raw = fieldValues[field.key];
			if (raw === undefined || raw === '' || raw === false || raw === null) continue;
			if (field.type === 'boolean') list.push({ label: field.label, value: 'Ja' });
			else if (field.type === 'date')
				list.push({ label: field.label, value: formatDate(String(raw)) });
			else if (field.type === 'number')
				list.push({
					label: field.label,
					value: typeof raw === 'number' ? raw.toLocaleString('de-DE') : String(raw)
				});
			else if (field.type === 'people')
				list.push({
					label: field.label,
					value: String(raw),
					people: String(raw)
						.split(/[,;]/)
						.map((p) => p.trim())
						.filter(Boolean)
				});
			else list.push({ label: field.label, value: String(raw) });
		}
		for (const extra of extraFields) {
			if (extra.label || extra.value) list.push({ label: extra.label, value: extra.value || '–' });
		}
		return list;
	});
</script>

{#if rows.length}
	<section class="card mt-6 overflow-hidden" aria-label="Details">
		<dl class="divide-y divide-line">
			{#each rows as row, i (i)}
				<div class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-4 py-3">
					<dt class="text-sm text-muted">{row.label}</dt>
					<dd class="text-sm font-medium break-words">
						{#if row.people}
							<span class="flex flex-wrap gap-1.5">
								{#each row.people as person, j (j)}
									<span class="rounded-full bg-surface-2 px-2.5 py-0.5">{person}</span>
								{/each}
							</span>
						{:else}
							<span class="whitespace-pre-line">{row.value}</span>
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</section>
{/if}
