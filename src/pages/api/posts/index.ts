import type { APIRoute } from 'astro';
import { getPosts } from '../../../lib/models/post';

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const tag = url.searchParams.get('tag') ?? undefined;
	const categorySlug = url.searchParams.get('category') ?? undefined;
	const search = url.searchParams.get('search') ?? undefined;
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');

	const skip = (page - 1) * limit;

	try {
		const posts = await getPosts({
			tag,
			categorySlug,
			search,
			limit,
			skip,
			status: 'published',
		});

		return new Response(JSON.stringify({ ok: true, posts }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);
		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Erro ao buscar posts.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

