import {
	getPosts,
	getPostBySlug as getPostBySlugFromDb,
	type PostDTO,
} from './models/post';

// Clusters de tags copiados do projeto livenreviews
export const tagClusters = {
	pillars: {
		'Avaliações Google': {
			description: 'Conteúdo principal sobre avaliações no Google',
			relatedTags: [
				'Google Meu Negócio',
				'SEO Local',
				'Comprar Avaliação Google',
				'Reviews Online',
				'Reputação Online',
			],
		},
		'Google Meu Negócio': {
			description: 'Otimização e gestão de perfil no Google',
			relatedTags: [
				'Avaliações Google',
				'SEO Local',
				'Otimização de Perfil',
				'Gestão de Perfil',
				'Comprar Avaliação Google',
			],
		},
		'SEO Local': {
			description: 'Estratégias de SEO para negócios locais',
			relatedTags: [
				'Avaliações Google',
				'Google Meu Negócio',
				'Busca Local',
				'Geolocalização',
				'Google Maps',
			],
		},
		'Comprar Avaliação Google': {
			description: 'Estratégias para aquisição de avaliações',
			relatedTags: [
				'Avaliações Google',
				'Reputação Online',
				'Google Meu Negócio',
				'Gestão de Reputação',
				'Prova Social',
			],
		},
	},
	supporting: {
		'Reputação Online': {
			relatedTags: [
				'Avaliações Google',
				'Gestão de Reputação',
				'Comprar Avaliação Google',
				'Prova Social',
				'Autoridade de Marca',
			],
		},
		'Marketing Digital': {
			relatedTags: [
				'Prova Social',
				'Conversão de Clientes',
				'Avaliações Google',
				'Autoridade de Marca',
				'Branding Digital',
			],
		},
		'Prova Social': {
			relatedTags: [
				'Avaliações Google',
				'Reputação Online',
				'Conversão de Clientes',
				'Confiança do Cliente',
				'Marketing Digital',
			],
		},
	},
	niche: {
		'Mobile First': {
			relatedTags: [
				'Google Maps',
				'SEO Local',
				'Avaliações Google',
				'Google Meu Negócio',
			],
		},
		'Inteligência Artificial': {
			relatedTags: [
				'Busca por Voz',
				'SEO Local',
				'Avaliações Google',
				'Google Meu Negócio',
			],
		},
		'Otimização de Perfil': {
			relatedTags: [
				'Google Meu Negócio',
				'Avaliações Google',
				'SEO Local',
				'Gestão de Perfil',
			],
		},
	},
} as const;

export async function getAllPublishedPosts(): Promise<PostDTO[]> {
	return getPosts({ status: 'published', limit: 1000 });
}

export async function getRecommendedPosts(currentSlug?: string): Promise<PostDTO[]> {
	const posts = await getAllPublishedPosts();
	const filtered = currentSlug ? posts.filter((p) => p.slug !== currentSlug) : posts;
	return filtered.slice(0, 3);
}

export async function getRecentPosts(limit = 3): Promise<PostDTO[]> {
	return getPosts({ status: 'published', limit });
}

export async function getPostBySlug(slug: string): Promise<PostDTO | null> {
	return getPostBySlugFromDb(slug);
}

export async function getPostsByTag(tag: string, limit = 50): Promise<PostDTO[]> {
	return getPosts({ status: 'published', tag, limit });
}

export function getRelatedTags(currentTag: string): string[] {
	for (const clusterType of Object.values(tagClusters)) {
		const cluster = clusterType as Record<string, { description?: string; relatedTags?: string[] }>;
		if (cluster[currentTag]) {
			return cluster[currentTag].relatedTags ?? [];
		}
	}
	return [];
}

export async function getPostsByTags(tags: string[], limit = 10): Promise<PostDTO[]> {
	if (tags.length === 0) return [];

	const posts = await getAllPublishedPosts();

	const postsWithScore = posts.map((post) => {
		const matchCount = post.tags.filter((tag) => tags.includes(tag)).length;
		return { post, score: matchCount };
	});

	return postsWithScore
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.post);
}

export async function getAllTags(): Promise<string[]> {
	const posts = await getAllPublishedPosts();
	const allTags = new Set<string>();
	posts.forEach((post) => {
		post.tags.forEach((tag) => allTags.add(tag));
	});
	return Array.from(allTags).sort();
}

