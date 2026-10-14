// Globale, clientseitige Benachrichtigungen (Toasts) und die Level-Up-Feier.

export interface Toast {
	id: string;
	message: string;
	tone: 'success' | 'info' | 'error';
	xp?: number;
}

class ToastState {
	items = $state<Toast[]>([]);
	celebration = $state<{ level: number; title: string } | null>(null);
	#seen = new Set<string>();

	show(message: string, options: { tone?: Toast['tone']; xp?: number; id?: string } = {}) {
		const id = options.id ?? crypto.randomUUID();
		if (this.#seen.has(id)) return;
		this.#seen.add(id);
		this.items = [...this.items, { id, message, tone: options.tone ?? 'success', xp: options.xp }];
		setTimeout(() => this.dismiss(id), options.xp ? 4500 : 3500);
	}

	dismiss(id: string) {
		this.items = this.items.filter((t) => t.id !== id);
	}

	celebrate(level: number, title: string) {
		this.celebration = { level, title };
	}
}

export const toasts = new ToastState();
