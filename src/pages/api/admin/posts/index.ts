import type { APIRoute } from 'astro';
import { createPost, getPosts, type PostInput } from '../../../../lib/models/post';

export const prerender = false;

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '20');
	const skip = (page - 1) * limit;

	try {
		const posts = await getPosts({
			limit,
			skip,
			// admin: retorna todos os status (draft, published, archived, etc.)
			status: undefined,
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
				message: 'Erro ao buscar posts (admin).',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const POST: APIRoute = async ({ request, redirect }) => {
	try {
		const contentType = request.headers.get('content-type') || '';
		let body: Partial<PostInput & {
			categoryName?: string;
			categorySlug?: string;
			tags?: string;
			readTime?: string | number;
			status?: string;
			imageUrl?: string;
			imageAlt?: string;
			imageCaption?: string;
			imageCredits?: string;
		}> = {};

		if (contentType.includes('application/json')) {
			body = (await request.json()) as Partial<PostInput> & {
				imageUrl?: string;
				imageAlt?: string;
				imageCaption?: string;
				imageCredits?: string;
			};

			if (!body.image && body.imageUrl) {
				body.image = {
					url: body.imageUrl,
					alt: body.imageAlt,
					caption: body.imageCaption,
					credits: body.imageCredits,
				};
			}
		} else if (
			contentType.includes('application/x-www-form-urlencoded') ||
			contentType.includes('multipart/form-data')
		) {
			const form = await request.formData();
			const imageUrl = String(form.get('imageUrl') ?? '');
			const imageAlt = String(form.get('imageAlt') ?? '');
			const imageCaption = String(form.get('imageCaption') ?? '');
			const imageCredits = String(form.get('imageCredits') ?? '');

			body = {
				title: String(form.get('title') ?? ''),
				slug: String(form.get('slug') ?? ''),
				excerpt: String(form.get('excerpt') ?? ''),
				content: String(form.get('content') ?? ''),
				category: {
					name: String(form.get('categoryName') ?? ''),
					slug: String(form.get('categorySlug') ?? ''),
				},
				tags: String(form.get('tags') ?? '')
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				author: {
					name: 'Admin',
				},
				status: (form.get('status') as string) ?? 'draft',
				readTime: Number(form.get('readTime') ?? '1'),
				image: imageUrl
					? {
							url: imageUrl,
							alt: imageAlt || undefined,
							caption: imageCaption || undefined,
							credits: imageCredits || undefined,
						}
					: undefined,
			};
		} else {
			return new Response(
				JSON.stringify({
					ok: false,
					message: 'Content-Type não suportado.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// Garante que o slug seja sempre normalizado.
		// Se o usuário enviou um slug explícito, usamos ele como base.
		// Caso contrário, caímos para o título.
		const rawSlugSource =
			(typeof body.slug === 'string' && body.slug.trim().length > 0
				? body.slug
				: body.title) ?? '';
		body.slug = slugify(rawSlugSource.toString());

		if (!body.title || !body.slug || !body.excerpt || !body.content) {
			return new Response(
				JSON.stringify({
					ok: false,
					message: 'Campos obrigatórios: title, slug, excerpt, content.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		if (!body.category || !body.category.name || !body.category.slug) {
			return new Response(
				JSON.stringify({
					ok: false,
					message: 'Categoria com name e slug é obrigatória.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		if (!body.image?.url?.trim()) {
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

		if (!body.author || !body.author.name) {
			return new Response(
				JSON.stringify({
					ok: false,
					message: 'Autor com name é obrigatório.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		const input: PostInput = {
			title: body.title,
			slug: body.slug,
			excerpt: body.excerpt,
			content: body.content,
			category: body.category,
			tags: body.tags ?? [],
			author: body.author,
			image: body.image,
			status: body.status ?? 'draft',
			publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
			readTime: body.readTime ?? 1,
			meta: body.meta,
			featured: body.featured ?? false,
		};

		const post = await createPost(input);

		if (contentType.includes('application/json')) {
			return new Response(JSON.stringify({ ok: true, post }), {
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return redirect('/admin-blg/post s', 303);
	} catch (error) {
		console.error(error);
		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Erro ao criar post.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

