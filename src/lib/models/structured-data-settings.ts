import { type WithId } from "mongodb";
import { getMemoryCacheTtlMs, invalidateMemoryCacheKey, memoryCached } from "../memory-cache";
import { getDb } from "../mongodb";

const STRUCTURED_DATA_SETTINGS_CACHE_KEY = "structured:data:settings";

export interface StructuredDataSettingsInput {
	siteUrl: string;
	organizationName: string;
	websiteName: string;
	websiteAlternateName: string;
	contactEmail: string;
	logoUrl: string;
	logoCaption: string;
	aboutPageName: string;
	telephone: string;
	addressCountry: string;
	addressLocality: string;
	addressRegion: string;
	aggregateRatingValue: string;
	aggregateRatingCount: string;
	description: string;
	foundingDate: string;
	priceRange: string;
	slogan: string;
}

interface StructuredDataSettingsDocument extends StructuredDataSettingsInput {
	key: "main";
	createdAt: Date;
	updatedAt: Date;
}

const DEFAULT_STRUCTURED_SETTINGS: StructuredDataSettingsInput = {
	siteUrl: "https://compraravaliacoesgoogle.one",
	organizationName: "Comprar Avaliações no Google",
	websiteName: "Comprar Avaliações no Google",
	websiteAlternateName: "Comprar Avaliações",
	contactEmail: "avaliacoes@compraravaliacoes.com.br",
	logoUrl: "https://compraravaliacoesgoogle.one/logo2.png",
	logoCaption: "Comprar Avaliações no Google",
	aboutPageName:
		"Comprar Avaliações no Google ⭐⭐⭐⭐⭐ | Ajudamos seu Crescimento",
	telephone: "+55 27 99915-2648",
	addressCountry: "Brasil",
	addressLocality: "Ribeirao Preto",
	addressRegion: "Sao Paulo",
	aggregateRatingValue: "4.8",
	aggregateRatingCount: "89",
	description:
		"Comprar avaliações google, comprar avaliação google, comprar avaliacoes google, comprar avaliações no google, avaliações google comprar, comprar comentarios no google, comprar comentarios google, compra de avaliações google, comprar avaliacao google, comprar avaliações google meu negócio, avaliação google comprar, compra avaliação google, comprar avaliação google meu negócio, como comprar avaliações no google, comprar avaliação no google, comprar comentários google, comprar avaliações, comprar reviews google, comprar avaliacoes no google, comprar avaliações do google, avaliações no google comprar, comentarios google comprar, avaliação do google maps.",
	foundingDate: "2022",
	priceRange: "$",
	slogan: "Comprar Avaliações Google",
};

async function getCollection() {
	const db = await getDb();
	return db.collection<StructuredDataSettingsDocument>("structured_data_settings");
}

function toInput(
	doc?: WithId<StructuredDataSettingsDocument> | null,
): StructuredDataSettingsInput {
	if (!doc) return { ...DEFAULT_STRUCTURED_SETTINGS };

	return {
		siteUrl: doc.siteUrl ?? DEFAULT_STRUCTURED_SETTINGS.siteUrl,
		organizationName:
			doc.organizationName ?? DEFAULT_STRUCTURED_SETTINGS.organizationName,
		websiteName: doc.websiteName ?? DEFAULT_STRUCTURED_SETTINGS.websiteName,
		websiteAlternateName:
			doc.websiteAlternateName ??
			DEFAULT_STRUCTURED_SETTINGS.websiteAlternateName,
		contactEmail: doc.contactEmail ?? DEFAULT_STRUCTURED_SETTINGS.contactEmail,
		logoUrl: doc.logoUrl ?? DEFAULT_STRUCTURED_SETTINGS.logoUrl,
		logoCaption: doc.logoCaption ?? DEFAULT_STRUCTURED_SETTINGS.logoCaption,
		aboutPageName: doc.aboutPageName ?? DEFAULT_STRUCTURED_SETTINGS.aboutPageName,
		telephone: doc.telephone ?? DEFAULT_STRUCTURED_SETTINGS.telephone,
		addressCountry:
			doc.addressCountry ?? DEFAULT_STRUCTURED_SETTINGS.addressCountry,
		addressLocality:
			doc.addressLocality ?? DEFAULT_STRUCTURED_SETTINGS.addressLocality,
		addressRegion: doc.addressRegion ?? DEFAULT_STRUCTURED_SETTINGS.addressRegion,
		aggregateRatingValue:
			doc.aggregateRatingValue ??
			DEFAULT_STRUCTURED_SETTINGS.aggregateRatingValue,
		aggregateRatingCount:
			doc.aggregateRatingCount ??
			DEFAULT_STRUCTURED_SETTINGS.aggregateRatingCount,
		description: doc.description ?? DEFAULT_STRUCTURED_SETTINGS.description,
		foundingDate: doc.foundingDate ?? DEFAULT_STRUCTURED_SETTINGS.foundingDate,
		priceRange: doc.priceRange ?? DEFAULT_STRUCTURED_SETTINGS.priceRange,
		slogan: doc.slogan ?? DEFAULT_STRUCTURED_SETTINGS.slogan,
	};
}

export async function getStructuredDataSettings(): Promise<StructuredDataSettingsInput> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(STRUCTURED_DATA_SETTINGS_CACHE_KEY, ttl, async () => {
		const collection = await getCollection();
		const doc = await collection.findOne({ key: "main" });
		return toInput(doc);
	});
}

export async function upsertStructuredDataSettings(
	input: Partial<StructuredDataSettingsInput>,
): Promise<StructuredDataSettingsInput> {
	const collection = await getCollection();
	const now = new Date();

	const normalized: StructuredDataSettingsInput = {
		siteUrl: String(input.siteUrl ?? DEFAULT_STRUCTURED_SETTINGS.siteUrl).trim(),
		organizationName: String(
			input.organizationName ?? DEFAULT_STRUCTURED_SETTINGS.organizationName,
		).trim(),
		websiteName: String(
			input.websiteName ?? DEFAULT_STRUCTURED_SETTINGS.websiteName,
		).trim(),
		websiteAlternateName: String(
			input.websiteAlternateName ??
				DEFAULT_STRUCTURED_SETTINGS.websiteAlternateName,
		).trim(),
		contactEmail: String(
			input.contactEmail ?? DEFAULT_STRUCTURED_SETTINGS.contactEmail,
		).trim(),
		logoUrl: String(input.logoUrl ?? DEFAULT_STRUCTURED_SETTINGS.logoUrl).trim(),
		logoCaption: String(
			input.logoCaption ?? DEFAULT_STRUCTURED_SETTINGS.logoCaption,
		).trim(),
		aboutPageName: String(
			input.aboutPageName ?? DEFAULT_STRUCTURED_SETTINGS.aboutPageName,
		).trim(),
		telephone: String(
			input.telephone ?? DEFAULT_STRUCTURED_SETTINGS.telephone,
		).trim(),
		addressCountry: String(
			input.addressCountry ?? DEFAULT_STRUCTURED_SETTINGS.addressCountry,
		).trim(),
		addressLocality: String(
			input.addressLocality ?? DEFAULT_STRUCTURED_SETTINGS.addressLocality,
		).trim(),
		addressRegion: String(
			input.addressRegion ?? DEFAULT_STRUCTURED_SETTINGS.addressRegion,
		).trim(),
		aggregateRatingValue: String(
			input.aggregateRatingValue ??
				DEFAULT_STRUCTURED_SETTINGS.aggregateRatingValue,
		).trim(),
		aggregateRatingCount: String(
			input.aggregateRatingCount ??
				DEFAULT_STRUCTURED_SETTINGS.aggregateRatingCount,
		).trim(),
		description: String(
			input.description ?? DEFAULT_STRUCTURED_SETTINGS.description,
		).trim(),
		foundingDate: String(
			input.foundingDate ?? DEFAULT_STRUCTURED_SETTINGS.foundingDate,
		).trim(),
		priceRange: String(
			input.priceRange ?? DEFAULT_STRUCTURED_SETTINGS.priceRange,
		).trim(),
		slogan: String(input.slogan ?? DEFAULT_STRUCTURED_SETTINGS.slogan).trim(),
	};

	const result = await collection.findOneAndUpdate(
		{ key: "main" },
		{
			$set: {
				...normalized,
				updatedAt: now,
			},
			$setOnInsert: {
				key: "main" as const,
				createdAt: now,
			},
		},
		{
			upsert: true,
			returnDocument: "after",
		},
	);

	invalidateMemoryCacheKey(STRUCTURED_DATA_SETTINGS_CACHE_KEY);
	return toInput(result as WithId<StructuredDataSettingsDocument> | null);
}

