/**
 * Análise de SEO do artigo (executável no browser).
 * Retorna pontuação 0-100 e lista de itens (ok, aviso, erro).
 */

export interface SeoItem {
	type: "ok" | "warn" | "fail";
	label: string;
	message: string;
	value?: string;
}

export interface SeoAnalysisResult {
	score: number;
	items: SeoItem[];
}

function stripHtml(html: string): string {
	const div = document.createElement("div");
	div.innerHTML = html;
	return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function wordCount(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}

function extractLinks(html: string): { internal: number; external: number; total: number } {
	const div = document.createElement("div");
	div.innerHTML = html;
	const anchors = div.querySelectorAll("a[href]");
	let internal = 0;
	let external = 0;
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	anchors.forEach((a) => {
		const href = (a as HTMLAnchorElement).getAttribute("href") || "";
		if (!href || href.startsWith("#")) return;
		if (href.startsWith("/") || href.includes(origin)) internal++;
		else external++;
	});
	return { internal, external, total: internal + external };
}

/** Detecta repetição excessiva de frases (canibalização) no texto */
function findCannibalization(plainText: string): { phrase: string; count: number }[] {
	const words = plainText.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
	const phrases: Record<string, number> = {};
	const phraseLen = 4;
	for (let i = 0; i <= words.length - phraseLen; i++) {
		const phrase = words.slice(i, i + phraseLen).join(" ");
		phrases[phrase] = (phrases[phrase] || 0) + 1;
	}
	return Object.entries(phrases)
		.filter(([, count]) => count >= 3)
		.map(([phrase, count]) => ({ phrase, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
}

/** Verifica se o slug faz sentido em relação ao título (palavras em comum) */
function slugRelevance(title: string, slug: string): number {
	const titleWords = new Set(
		title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.split(/[^a-z0-9]+/)
			.filter((w) => w.length > 2),
	);
	const slugWords = slug.split("-").filter(Boolean);
	if (slugWords.length === 0) return 0;
	const match = slugWords.filter((w) => titleWords.has(w)).length;
	return Math.round((match / slugWords.length) * 100);
}

export function analyzeSeo(params: {
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	tags: string;
	categoryName: string;
	imageUrl: string;
	imageAlt: string;
}): SeoAnalysisResult {
	const items: SeoItem[] = [];
	const {
		title,
		slug,
		excerpt,
		content,
		tags,
		categoryName,
		imageUrl,
		imageAlt,
	} = params;

	const contentPlain = stripHtml(content);
	const excerptPlain = stripHtml(excerpt);
	const titleLen = title.trim().length;
	const excerptLen = excerptPlain.length;
	const words = wordCount(contentPlain);
	const links = extractLinks(content);
	const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
	const cannibal = findCannibalization(contentPlain);

	// ---- Título ----
	if (titleLen === 0) {
		items.push({ type: "fail", label: "Título", message: "Título é obrigatório." });
	} else if (titleLen < 30) {
		items.push({
			type: "warn",
			label: "Título",
			message: "Título curto. Ideal 50–60 caracteres para SEO.",
			value: `${titleLen} caracteres`,
		});
	} else if (titleLen >= 50 && titleLen <= 60) {
		items.push({
			type: "ok",
			label: "Título",
			message: "Tamanho ideal para SEO.",
			value: `${titleLen} caracteres`,
		});
	} else if (titleLen > 70) {
		items.push({
			type: "warn",
			label: "Título",
			message: "Título longo. Pode ser cortado nos resultados do Google.",
			value: `${titleLen} caracteres`,
		});
	} else {
		items.push({
			type: "ok",
			label: "Título",
			message: "Tamanho aceitável.",
			value: `${titleLen} caracteres`,
		});
	}

	// ---- Slug ----
	if (!slug.trim()) {
		items.push({ type: "fail", label: "Slug", message: "Slug é obrigatório." });
	} else {
		const slugRelevant = slugRelevance(title, slug);
		if (slugRelevant < 30 && slug.length > 5) {
			items.push({
				type: "warn",
				label: "Slug",
				message: "Slug pouco relacionado ao título. Use palavras do título.",
				value: `Relevância: ${slugRelevant}%`,
			});
		} else if (slugRelevant >= 50) {
			items.push({
				type: "ok",
				label: "Slug",
				message: "Slug coerente com o título.",
				value: `Relevância: ${slugRelevant}%`,
			});
		}
		if (slug.length > 80) {
			items.push({
				type: "warn",
				label: "Slug",
				message: "Slug muito longo.",
				value: `${slug.length} caracteres`,
			});
		}
	}

	// ---- Resumo (excerpt) ----
	const hasHtmlInExcerpt = /<[a-z][\s\S]*>/i.test(excerpt.trim());
	if (hasHtmlInExcerpt) {
		items.push({
			type: "fail",
			label: "Resumo",
			message: "Resumo deve conter apenas texto, sem tags HTML.",
		});
	} else if (excerptLen === 0) {
		items.push({ type: "fail", label: "Resumo", message: "Resumo é obrigatório." });
	} else if (excerptLen >= 150 && excerptLen <= 160) {
		items.push({
			type: "ok",
			label: "Resumo",
			message: "Tamanho ideal para meta description.",
			value: `${excerptLen} caracteres`,
		});
	} else if (excerptLen < 120) {
		items.push({
			type: "warn",
			label: "Resumo",
			message: "Resumo curto. Ideal 150–160 caracteres.",
			value: `${excerptLen} caracteres`,
		});
	} else if (excerptLen > 165) {
		items.push({
			type: "warn",
			label: "Resumo",
			message: "Resumo longo. Pode ser cortado no Google.",
			value: `${excerptLen} caracteres`,
		});
	} else {
		items.push({
			type: "ok",
			label: "Resumo",
			message: "Tamanho adequado.",
			value: `${excerptLen} caracteres`,
		});
	}

	// ---- Conteúdo (quantidade de texto) ----
	if (words < 300) {
		items.push({
			type: "warn",
			label: "Conteúdo",
			message: "Pouco texto. Artigos com 300+ palavras rankeiam melhor.",
			value: `${words} palavras`,
		});
	} else if (words >= 600 && words <= 2000) {
		items.push({
			type: "ok",
			label: "Conteúdo",
			message: "Bom volume de texto para SEO.",
			value: `${words} palavras`,
		});
	} else if (words > 2000) {
		items.push({
			type: "ok",
			label: "Conteúdo",
			message: "Texto longo. Considere quebrar em seções claras.",
			value: `${words} palavras`,
		});
	} else {
		items.push({
			type: "ok",
			label: "Conteúdo",
			message: "Volume adequado.",
			value: `${words} palavras`,
		});
	}

	// ---- Linkagem ----
	if (links.total === 0) {
		items.push({
			type: "warn",
			label: "Links",
			message: "Nenhum link no conteúdo. Linkagem interna ajuda SEO.",
		});
	} else if (links.external > 10) {
		items.push({
			type: "warn",
			label: "Links",
			message: "Muitos links externos. Equilibre com links internos.",
			value: `${links.internal} internos, ${links.external} externos`,
		});
	} else if (links.internal >= 1) {
		items.push({
			type: "ok",
			label: "Links",
			message: "Linkagem presente.",
			value: `${links.internal} internos, ${links.external} externos`,
		});
	} else {
		items.push({
			type: "warn",
			label: "Links",
			message: "Poucos ou nenhum link interno. Recomenda-se 1–3 links internos.",
			value: `${links.internal} internos, ${links.external} externos`,
		});
	}

	// ---- Canibalização ----
	if (cannibal.length > 0) {
		items.push({
			type: "warn",
			label: "Canibalização",
			message: `Frase repetida em excesso: "${cannibal[0].phrase}..." (${cannibal[0].count}x). Varie o texto.`,
		});
	} else if (words > 100) {
		items.push({
			type: "ok",
			label: "Canibalização",
			message: "Sem repetição excessiva de frases.",
		});
	}

	// ---- Estrutura (headings) ----
	const h2Count = (content.match(/<h2\b/gi) || []).length;
	if (words > 200 && h2Count === 0) {
		items.push({
			type: "warn",
			label: "Estrutura",
			message: "Use subtítulos (H2) para organizar o conteúdo.",
		});
	} else if (h2Count >= 1) {
		items.push({
			type: "ok",
			label: "Estrutura",
			message: "Conteúdo com subtítulos (H2).",
			value: `${h2Count} H2(s)`,
		});
	}

	// ---- Imagem ----
	if (!imageUrl.trim()) {
		items.push({ type: "fail", label: "Imagem", message: "Imagem do artigo é obrigatória." });
	} else if (!imageAlt.trim()) {
		items.push({
			type: "warn",
			label: "Imagem",
			message: "Preencha o texto alternativo (alt) da imagem para acessibilidade e SEO.",
		});
	} else {
		items.push({
			type: "ok",
			label: "Imagem",
			message: "Imagem e alt preenchidos.",
		});
	}

	// ---- Tags ----
	if (tagList.length === 0) {
		items.push({
			type: "warn",
			label: "Tags",
			message: "Adicione tags para organização e SEO.",
		});
	} else if (tagList.length > 8) {
		items.push({
			type: "warn",
			label: "Tags",
			message: "Muitas tags. Ideal 3–8 tags.",
			value: `${tagList.length} tags`,
		});
	} else {
		items.push({
			type: "ok",
			label: "Tags",
			message: "Quantidade adequada de tags.",
			value: `${tagList.length} tags`,
		});
	}

	// ---- Categoria ----
	if (!categoryName.trim()) {
		items.push({ type: "fail", label: "Categoria", message: "Categoria é obrigatória." });
	} else {
		items.push({
			type: "ok",
			label: "Categoria",
			message: "Categoria definida.",
		});
	}

	// ---- Cálculo da pontuação ----
	const failCount = items.filter((i) => i.type === "fail").length;
	const warnCount = items.filter((i) => i.type === "warn").length;
	const okCount = items.filter((i) => i.type === "ok").length;
	const total = items.length;
	let score = 100;
	score -= failCount * 15;
	score -= warnCount * 5;
	score = Math.max(0, Math.min(100, score));

	return { score, items };
}
