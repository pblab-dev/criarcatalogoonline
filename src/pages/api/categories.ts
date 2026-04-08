import type { APIRoute } from 'astro';
import { getCategoriesWithCounts } from '../../lib/models/post';

export const GET: APIRoute = async () => {
	try {
		const categories = await getCategoriesWithCounts();

		return new Response(JSON.stringify({ ok: true, categories }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);

		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Erro ao buscar categorias.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

