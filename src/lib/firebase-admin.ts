import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

type ServiceAccountLike = admin.ServiceAccount;

function readServiceAccount(): ServiceAccountLike {
	const json = import.meta.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (json && typeof json === "string") {
		return JSON.parse(json) as ServiceAccountLike;
	}

	const p = import.meta.env.FIREBASE_SERVICE_ACCOUNT_PATH;
	if (p && typeof p === "string") {
		const raw = fs.readFileSync(p, "utf8");
		return JSON.parse(raw) as ServiceAccountLike;
	}

	try {
		const defaultPath = path.resolve(process.cwd(), "src/lib/firebase-service.json");
		if (fs.existsSync(defaultPath)) {
			const raw = fs.readFileSync(defaultPath, "utf8");
			return JSON.parse(raw) as ServiceAccountLike;
		}
	} catch {
		// ignore
	}

	throw new Error(
		"Firebase service account não configurado. Defina FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH ou use src/lib/firebase-service.json.",
	);
}

export function getFirebaseBucket(): admin.storage.Bucket {
	const serviceAccount = readServiceAccount();
	const sa = serviceAccount as { project_id?: string };

	const bucketName =
		(import.meta.env.FIREBASE_STORAGE_BUCKET && String(import.meta.env.FIREBASE_STORAGE_BUCKET)) ||
		(sa?.project_id ? `${sa.project_id}.firebasestorage.app` : "");

	if (!bucketName) {
		throw new Error(
			"Bucket não configurado. Defina FIREBASE_STORAGE_BUCKET (ex: app-tasks-295f3.firebasestorage.app).",
		);
	}

	const storageBucket = bucketName.startsWith("gs://") ? bucketName : `gs://${bucketName}`;

	if (!admin.apps.length) {
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
			storageBucket,
		});
	}

	return admin.storage().bucket();
}
