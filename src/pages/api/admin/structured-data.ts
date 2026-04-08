import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";
import {
	getStructuredDataSettings,
	upsertStructuredDataSettings,
} from "../../../lib/models/structured-data-settings";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE_NAME)?.value;
	const user = await verifySessionToken(token);

	if (!user) {
		return new Response(JSON.stringify({ ok: false, message: "Não autorizado." }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const settings = await getStructuredDataSettings();
		return new Response(JSON.stringify({ ok: true, settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao buscar dados estruturados", error);
		return new Response(JSON.stringify({ ok: false, message: "Erro ao buscar dados." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const PUT: APIRoute = async ({ request, cookies }) => {
	const token = cookies.get(SESSION_COOKIE_NAME)?.value;
	const user = await verifySessionToken(token);

	if (!user) {
		return new Response(JSON.stringify({ ok: false, message: "Não autorizado." }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const body = (await request.json()) as Partial<import("../../../lib/models/structured-data-settings").StructuredDataSettingsInput>;

		const settings = await upsertStructuredDataSettings(body);

		return new Response(JSON.stringify({ ok: true, settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao salvar dados estruturados", error);
		return new Response(JSON.stringify({ ok: false, message: "Erro ao salvar dados." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

