import type { APIRoute } from "astro";
import sharp from "sharp";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";
import { getFirebaseBucket } from "../../../lib/firebase-admin";

export const prerender = false;

function sanitizeSlug(input: string): string {
	return String(input || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 120);
}

function pad2(n: number): string {
	return String(n).padStart(2, "0");
}

const ALLOWED_IMAGE_MIMES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/tiff",
	"image/bmp",
]);

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const token = cookies.get(SESSION_COOKIE_NAME)?.value;
		const user = await verifySessionToken(token);
		if (!user) {
			return new Response(JSON.stringify({ error: "Não autenticado." }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const formData = await request.formData();
		const file = formData.get("image") as File | null;
		const rawSlug = (formData.get("slug") as string | null) || "";
		const rawDate = (formData.get("date") as string | null) || "";

		if (!file) {
			return new Response(JSON.stringify({ error: "Nenhum arquivo foi enviado." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const inputMime = String(file.type || "").trim().toLowerCase();
		if (!inputMime.startsWith("image/")) {
			return new Response(JSON.stringify({ error: "Arquivo enviado não é uma imagem." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		if (!ALLOWED_IMAGE_MIMES.has(inputMime)) {
			return new Response(
				JSON.stringify({
					error: `Tipo de imagem não suportado: ${inputMime}. Use JPG, PNG, GIF, WebP, AVIF, TIFF ou BMP.`,
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const slug = sanitizeSlug(rawSlug || file.name.replace(/\.[^.]+$/, ""));
		if (!slug) {
			return new Response(JSON.stringify({ error: "Slug inválido." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const d = rawDate ? new Date(rawDate) : new Date();
		if (Number.isNaN(d.getTime())) {
			return new Response(JSON.stringify({ error: "Data inválida." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const yyyy = d.getUTCFullYear();
		const mm = pad2(d.getUTCMonth() + 1);
		const dd = pad2(d.getUTCDate());
		const fileName = `blog/uploads/${yyyy}/${mm}/${dd}/${slug}.webp`;

		const bucket = getFirebaseBucket();
		const fileUpload = bucket.file(fileName);

		const arrayBuffer = await file.arrayBuffer();
		const inputBuffer = Buffer.from(arrayBuffer);

		const maxSize = 10 * 1024 * 1024;
		if (inputBuffer.length > maxSize) {
			return new Response(
				JSON.stringify({
					error: `Imagem muito grande: ${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB (máximo 10MB)`,
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const webpBuffer = await sharp(inputBuffer, { animated: true, failOnError: false })
			.resize({
				width: 2000,
				height: 2000,
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: 82 })
			.toBuffer();

		await fileUpload.save(webpBuffer, {
			metadata: {
				contentType: "image/webp",
				cacheControl: "public, max-age=31536000, immutable",
				metadata: {
					originalName: file.name,
					originalType: inputMime,
					uploadedAt: new Date().toISOString(),
				},
			},
		});

		try {
			await fileUpload.makePublic();
		} catch {
			// bucket pode usar Uniform Bucket Level Access / CDN
		}

		const base = import.meta.env.UPLOADS_PUBLIC_BASE_URL;
		const publicUrl =
			base && typeof base === "string"
				? `${base.replace(/\/+$/, "")}/${fileName}`
				: `https://storage.googleapis.com/${bucket.name}/${fileName}`;

		return new Response(
			JSON.stringify({
				status: "success",
				data: {
					filename: fileName,
					originalName: file.name,
					size: webpBuffer.length,
					type: "image/webp",
					publicUrl,
				},
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Erro no upload:", error);
		return new Response(
			JSON.stringify({
				error: "Erro ao fazer upload da imagem",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
