import type { APIRoute } from "astro";
import { getSiteSettings } from "../../lib/models/site-settings";

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const settings = await getSiteSettings();
		return new Response(JSON.stringify({ ok: true, settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao buscar settings públicos", error);
		return new Response(JSON.stringify({ ok: false, message: "Erro ao buscar settings." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

