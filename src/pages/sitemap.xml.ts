import type { APIRoute } from 'astro';
import { getAllPublishedPosts, getAllTags, tagClusters } from '../lib/blogQueries';

function getTagPriority(tag: string): number {
	if (tagClusters.pillars[tag as keyof typeof tagClusters.pillars]) return 0.9;
	if (tagClusters.supporting[tag as keyof typeof tagClusters.supporting]) return 0.7;
	if (tagClusters.niche[tag as keyof typeof tagClusters.niche]) return 0.6;
	return 0.5;
}

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const SITE_URL = 'https://criarcatalogoonline.online';

	const posts = await getAllPublishedPosts();
	const allTags = await getAllTags();

	const sortedTags = allTags.sort((a, b) => getTagPriority(b) - getTagPriority(a));

	let latestPostDate = new Date();
	if (posts.length > 0) {
		latestPostDate = posts.reduce((latest, post) => {
			const d = post.publishedAt ?? post.updatedAt ?? post.createdAt;
			return d > latest ? d : latest;
		}, posts[0].publishedAt ?? posts[0].updatedAt ?? posts[0].createdAt);
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
	<url>
		<loc>${SITE_URL}/</loc>
		<lastmod>${latestPostDate.toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
${posts
	.map(
		(post) => `	<url>
		<loc>${SITE_URL}/${encodeURIComponent(post.slug)}</loc>
		<lastmod>${(post.updatedAt ?? post.publishedAt ?? latestPostDate).toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>`,
	)
	.join('\n')}
${sortedTags
	.map((tag) => {
		const priority = getTagPriority(tag).toFixed(1);
		return `	<url>
		<loc>${SITE_URL}/tag/${encodeURIComponent(tag)}</loc>
		<lastmod>${latestPostDate.toISOString()}</lastmod>
		<changefreq>${Number(priority) >= 0.7 ? 'weekly' : 'monthly'}</changefreq>
		<priority>${priority}</priority>
	</url>`;
	})
	.join('\n')}
</urlset>`.trim();

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};

