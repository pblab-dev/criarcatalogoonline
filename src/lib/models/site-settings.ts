import { type WithId } from "mongodb";
import { getDb } from "../mongodb";

export interface SiteSocialLinks {
	instagram: string;
	youtube: string;
	linkedin: string;
	facebook: string;
	tiktok: string;
	x: string;
}

export interface SiteSettingsInput {
	siteTitle: string;
	siteDescription: string;
	homeHeaderTitle: string;
	homeHeaderDescription: string;
	primaryColor: string;
	secondaryColor: string;
	socialLinks: SiteSocialLinks;
}

interface SiteSettingsDocument extends SiteSettingsInput {
	key: "main";
	createdAt: Date;
	updatedAt: Date;
}

const DEFAULT_SETTINGS: SiteSettingsInput = {
	siteTitle: "",
	siteDescription: "",
	homeHeaderTitle: "",
	homeHeaderDescription: "",
	primaryColor: "#1D1760",
	secondaryColor: "#2563eb",
	socialLinks: {
		instagram: "",
		youtube: "",
		linkedin: "",
		facebook: "",
		tiktok: "",
		x: "",
	},
};

async function getCollection() {
	const db = await getDb();
	return db.collection<SiteSettingsDocument>("site_settings");
}

function toInput(doc?: WithId<SiteSettingsDocument> | null): SiteSettingsInput {
	if (!doc) return { ...DEFAULT_SETTINGS };
	return {
		siteTitle: doc.siteTitle ?? "",
		siteDescription: doc.siteDescription ?? "",
		homeHeaderTitle: doc.homeHeaderTitle ?? "",
		homeHeaderDescription: doc.homeHeaderDescription ?? "",
		primaryColor: doc.primaryColor ?? "#1D1760",
		secondaryColor: doc.secondaryColor ?? "#2563eb",
		socialLinks: {
			instagram: doc.socialLinks?.instagram ?? "",
			youtube: doc.socialLinks?.youtube ?? "",
			linkedin: doc.socialLinks?.linkedin ?? "",
			facebook: doc.socialLinks?.facebook ?? "",
			tiktok: doc.socialLinks?.tiktok ?? "",
			x: doc.socialLinks?.x ?? "",
		},
	};
}

export async function getSiteSettings(): Promise<SiteSettingsInput> {
	const collection = await getCollection();
	const doc = await collection.findOne({ key: "main" });
	return toInput(doc);
}

export async function upsertSiteSettings(
	input: Partial<SiteSettingsInput>,
): Promise<SiteSettingsInput> {
	const collection = await getCollection();
	const now = new Date();

	const normalized: SiteSettingsInput = {
		siteTitle: String(input.siteTitle ?? "").trim(),
		siteDescription: String(input.siteDescription ?? "").trim(),
		homeHeaderTitle: String(input.homeHeaderTitle ?? "").trim(),
		homeHeaderDescription: String(input.homeHeaderDescription ?? "").trim(),
		primaryColor: String(input.primaryColor ?? "#1D1760").trim() || "#1D1760",
		secondaryColor:
			String(input.secondaryColor ?? "#2563eb").trim() || "#2563eb",
		socialLinks: {
			instagram: String(input.socialLinks?.instagram ?? "").trim(),
			youtube: String(input.socialLinks?.youtube ?? "").trim(),
			linkedin: String(input.socialLinks?.linkedin ?? "").trim(),
			facebook: String(input.socialLinks?.facebook ?? "").trim(),
			tiktok: String(input.socialLinks?.tiktok ?? "").trim(),
			x: String(input.socialLinks?.x ?? "").trim(),
		},
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

	return toInput(result as WithId<SiteSettingsDocument> | null);
}

