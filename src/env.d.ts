/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly MONGODB_URI: string;
	readonly MONGODB_DB_NAME: string;
	readonly ADMIN_SESSION_SECRET: string;
	readonly FIREBASE_STORAGE_BUCKET?: string;
	readonly UPLOADS_PUBLIC_BASE_URL?: string;
	/** TTL do cache em memória (ms). */
	readonly MEMORY_CACHE_TTL_MS?: string;
	/** `false` / `0` desativa stale-while-revalidate (esperar Mongo quando o TTL expirar). */
	readonly MEMORY_CACHE_STALE_WHILE_REVALIDATE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

