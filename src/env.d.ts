/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly MONGODB_URI: string;
	readonly MONGODB_DB_NAME: string;
	readonly ADMIN_SESSION_SECRET: string;
	readonly FIREBASE_STORAGE_BUCKET?: string;
	readonly UPLOADS_PUBLIC_BASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

