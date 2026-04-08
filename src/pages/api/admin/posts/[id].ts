import type { APIRoute } from 'astro';
import { deletePost, getPostById, updatePost, type UpdatePostInput } from '../../../../lib/models/post';

export const prerender = false;

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const GET: APIRoute = async ({ params }) => {
	const id = params.id;

	if (!id || Array.isArray(id)) {
		return new Response(JSON.stringify({ ok: false, message: 'ID inválido.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const post = await getPostById(id);

		if (!post) {
			return new Response(JSON.stringify({ ok: false, message: 'Post não encontrado.' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ ok: true, post }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ ok: false, message: 'Erro ao buscar post.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

export const PUT: APIRoute = async ({ params, request }) => {
	const id = params.id;

	if (!id || Array.isArray(id)) {
	 return new Response(JSON.stringify({ ok: false, message: 'ID inválido.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = (await request.json()) as Partial<UpdatePostInput>;

		if (typeof body.slug === 'string') {
			body.slug = slugify(body.slug);
		}
		if (body.image !== undefined && !body.image?.url?.trim()) {
			return new Response(
				JSON.stringify({
					ok: false,
					message: 'Imagem do artigo é obrigatória (URL ou upload).',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}
		const updated = await updatePost(id, body);

		if (!updated) {
			return new Response(JSON.stringify({ ok: false, message: 'Post não encontrado.' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ ok: true, post: updated }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ ok: false, message: 'Erro ao atualizar post.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const id = params.id;

	if (!id || Array.isArray(id)) {
		return new Response(JSON.stringify({ ok: false, message: 'ID inválido.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const success = await deletePost(id, true);

		if (!success) {
			return new Response(JSON.stringify({ ok: false, message: 'Post não encontrado.' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ ok: false, message: 'Erro ao excluir post.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

