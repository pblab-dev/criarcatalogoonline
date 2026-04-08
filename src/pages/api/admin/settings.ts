import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";
import { getSiteSettings, upsertSiteSettings } from "../../../lib/models/site-settings";

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
		const settings = await getSiteSettings();
		return new Response(JSON.stringify({ ok: true, settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao buscar settings", error);
		return new Response(JSON.stringify({ ok: false, message: "Erro ao buscar settings." }), {
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
		const body = (await request.json()) as {
			siteTitle?: string;
			siteDescription?: string;
			homeHeaderTitle?: string;
			homeHeaderDescription?: string;
			primaryColor?: string;
			secondaryColor?: string;
			socialLinks?: {
				instagram?: string;
				youtube?: string;
				linkedin?: string;
				facebook?: string;
				tiktok?: string;
				x?: string;
			};
		};

		const settings = await upsertSiteSettings({
			siteTitle: body.siteTitle,
			siteDescription: body.siteDescription,
			homeHeaderTitle: body.homeHeaderTitle,
			homeHeaderDescription: body.homeHeaderDescription,
			primaryColor: body.primaryColor,
			secondaryColor: body.secondaryColor,
			socialLinks: {
				instagram: body.socialLinks?.instagram,
				youtube: body.socialLinks?.youtube,
				linkedin: body.socialLinks?.linkedin,
				facebook: body.socialLinks?.facebook,
				tiktok: body.socialLinks?.tiktok,
				x: body.socialLinks?.x,
			},
		});

		return new Response(JSON.stringify({ ok: true, settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao salvar settings", error);
		return new Response(JSON.stringify({ ok: false, message: "Erro ao salvar settings." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

