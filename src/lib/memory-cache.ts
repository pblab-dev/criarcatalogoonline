type CacheEntry = { expiresAt: number; value: unknown };

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function resolveDefaultTtlMs(): number {
	const raw = import.meta.env.MEMORY_CACHE_TTL_MS;
	if (typeof raw === 'string' && raw !== '') {
		const parsed = parseInt(raw, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	// 7 dias — ajuste via MEMORY_CACHE_TTL_MS (milissegundos)
	return 7 * 24 * 60 * 60 * 1000;
}

/** Stale-while-revalidate: com entrada expirada, devolve o valor antigo na hora e atualiza em background. */
function isStaleWhileRevalidateEnabled(): boolean {
	const raw = import.meta.env.MEMORY_CACHE_STALE_WHILE_REVALIDATE;
	if (raw === 'false' || raw === '0') {
		return false;
	}
	return true;
}

function scheduleBackgroundRefresh<T>(
	key: string,
	ttl: number,
	fetcher: () => Promise<T>,
): void {
	if (inflight.has(key)) {
		return;
	}
	const pending = (async () => {
		try {
			const value = await fetcher();
			store.set(key, { expiresAt: Date.now() + ttl, value });
		} finally {
			inflight.delete(key);
		}
	})();
	inflight.set(key, pending);
}

/** TTL padrão do cache em memória (milissegundos). */
export function getMemoryCacheTtlMs(): number {
	return resolveDefaultTtlMs();
}

/**
 * Retorna o valor em cache ou executa `fetcher`, com deduplicação de requisições
 * concorrentes para a mesma chave.
 *
 * Com stale-while-revalidate (ativado por defeito): se existir entrada **expirada**,
 * devolve esse valor de imediato e revalida no Mongo em segundo plano — o `Map.set`
 * é síncrono; o que bloqueia é sempre o `await fetcher()` em cache vazio ou com SWR desligado.
 *
 * Nota: `localStorage` só existe no browser; este código corre no servidor (SSR), por isso
 * não é utilizável aqui.
 */
export async function memoryCached<T>(
	key: string,
	ttlMs: number | undefined,
	fetcher: () => Promise<T>,
): Promise<T> {
	const ttl = ttlMs ?? resolveDefaultTtlMs();
	const now = Date.now();
	const hit = store.get(key);
	if (hit && hit.expiresAt > now) {
		return hit.value as T;
	}

	if (hit && hit.expiresAt <= now && isStaleWhileRevalidateEnabled()) {
		scheduleBackgroundRefresh(key, ttl, fetcher);
		return hit.value as T;
	}

	let pending = inflight.get(key) as Promise<T> | undefined;
	if (!pending) {
		pending = (async () => {
			try {
				const value = await fetcher();
				store.set(key, { expiresAt: Date.now() + ttl, value });
				return value;
			} finally {
				inflight.delete(key);
			}
		})();
		inflight.set(key, pending);
	}
	return pending;
}

export function invalidateMemoryCacheKey(key: string): void {
	store.delete(key);
	inflight.delete(key);
}

/** Remove todas as entradas cuja chave começa com `prefix`. */
export function invalidateMemoryCachePrefix(prefix: string): void {
	for (const key of store.keys()) {
		if (key.startsWith(prefix)) {
			store.delete(key);
		}
	}
	for (const key of inflight.keys()) {
		if (key.startsWith(prefix)) {
			inflight.delete(key);
		}
	}
}
