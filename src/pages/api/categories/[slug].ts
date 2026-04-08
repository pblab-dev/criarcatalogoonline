import type { APIRoute } from "astro";
import { getPosts } from "../../../lib/models/post";

export const GET: APIRoute = async ({ params, request }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response(
			JSON.stringify({ ok: false, message: "Slug da categoria é obrigatório." }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const url = new URL(request.url);
		const limit = Number(url.searchParams.get("limit") ?? "50");
		const posts = await getPosts({
			categorySlug: slug,
			status: "published",
			limit,
		});

		return new Response(JSON.stringify({ ok: true, slug, posts }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Erro ao buscar posts por categoria", error);
		return new Response(
			JSON.stringify({ ok: false, message: "Erro ao buscar posts da categoria." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};

