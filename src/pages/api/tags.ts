import type { APIRoute } from 'astro';
import { getTagsWithCounts } from '../../lib/models/post';

export const GET: APIRoute = async () => {
	try {
		const tags = await getTagsWithCounts();

		return new Response(JSON.stringify({ ok: true, tags }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);

		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Erro ao buscar tags.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

