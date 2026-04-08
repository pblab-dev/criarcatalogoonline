import type { APIRoute } from 'astro';
import { getPostBySlug, incrementPostViews } from '../../../lib/models/post';

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;

	if (!slug || Array.isArray(slug)) {
		return new Response(
			JSON.stringify({ ok: false, message: 'Slug inválido.' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	try {
		const post = await getPostBySlug(slug);

		if (!post) {
			return new Response(
				JSON.stringify({ ok: false, message: 'Post não encontrado.' }),
				{
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		await incrementPostViews(slug);

		return new Response(JSON.stringify({ ok: true, post }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);

		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Erro ao buscar post.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

