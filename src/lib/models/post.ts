import { ObjectId, type WithId } from 'mongodb';
import {
	getMemoryCacheTtlMs,
	invalidateMemoryCacheKey,
	invalidateMemoryCachePrefix,
	memoryCached,
} from '../memory-cache';
import { getDb } from '../mongodb';

export type PostStatus = 'draft' | 'pending' | 'published' | 'archived' | 'deleted';

export interface PostCategory {
	name: string;
	slug: string;
	color?: string;
}

export interface PostMeta {
	title?: string;
	description?: string;
	keywords?: string[];
	canonical?: string;
	ogImage?: string;
	noIndex?: boolean;
}

export interface PostStats {
	views: number;
	shares: number;
	comments: number;
}

export interface PostAuthor {
	name: string;
	email?: string;
	avatar?: string;
	bio?: string;
}

export interface PostImage {
	url: string;
	alt?: string;
	caption?: string;
	credits?: string;
}

export interface PostInput {
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	category: PostCategory;
	tags: string[];
	author: PostAuthor;
	image?: PostImage;
	status?: PostStatus;
	publishedAt?: Date;
	readTime?: number;
	meta?: PostMeta;
	featured?: boolean;
}

export interface PostDocument extends PostInput {
	_id: ObjectId;
	status: PostStatus;
	publishedAt?: Date;
	stats: PostStats;
	featured: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface PostDTO extends Omit<PostDocument, '_id'> {
	id: string;
}

function toDTO(doc: WithId<PostDocument>): PostDTO {
	const { _id, ...rest } = doc;
	return {
		id: _id.toHexString(),
		...rest,
	};
}

async function getCollection() {
	const db = await getDb();
	return db.collection<PostDocument>('posts');
}

export async function createPost(input: PostInput): Promise<PostDTO> {
	const now = new Date();
	const doc: PostDocument = {
		_id: new ObjectId(),
		status: input.status ?? 'draft',
		publishedAt: input.publishedAt,
		stats: {
			views: 0,
			shares: 0,
			comments: 0,
		},
		featured: input.featured ?? false,
		createdAt: now,
		updatedAt: now,
		...input,
	};

	const collection = await getCollection();
	await collection.insertOne(doc);
	invalidatePostsCache();
	return toDTO(doc);
}

export interface PostQueryOptions {
	tag?: string;
	categorySlug?: string;
	status?: PostStatus;
	search?: string;
	limit?: number;
	skip?: number;
}

const POSTS_CACHE_PREFIX = 'posts:';

function postsListCacheKey(options: PostQueryOptions): string {
	const normalized = {
		tag: options.tag ?? '',
		categorySlug: options.categorySlug ?? '',
		status: options.status ?? '',
		search: options.search ?? '',
		limit: options.limit ?? 20,
		skip: options.skip ?? 0,
	};
	return `${POSTS_CACHE_PREFIX}list:${JSON.stringify(normalized)}`;
}

function postSlugCacheKey(slug: string, includeDrafts: boolean): string {
	return `${POSTS_CACHE_PREFIX}slug:${slug}:${includeDrafts}`;
}

function postIdCacheKey(id: string): string {
	return `${POSTS_CACHE_PREFIX}id:${id}`;
}

const TAGS_COUNTS_CACHE_KEY = `${POSTS_CACHE_PREFIX}tags:counts`;
const CATEGORIES_COUNTS_CACHE_KEY = `${POSTS_CACHE_PREFIX}categories:counts`;

function invalidatePostsCache(): void {
	invalidateMemoryCachePrefix(POSTS_CACHE_PREFIX);
}

export async function getPosts(options: PostQueryOptions = {}): Promise<PostDTO[]> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(postsListCacheKey(options), ttl, async () => {
		const {
			tag,
			categorySlug,
			status,
			search,
			limit = 20,
			skip = 0,
		} = options;

		const collection = await getCollection();

		const query: Record<string, unknown> = {};

		if (status) {
			query.status = status;
		}

		if (tag) {
			query.tags = tag;
		}

		if (categorySlug) {
			query['category.slug'] = categorySlug;
		}

		if (search) {
			const regex = new RegExp(search, 'i');
			query.$or = [{ title: regex }, { excerpt: regex }, { content: regex }, { tags: regex }];
		}

		const cursor = collection
			.find(query)
			.sort({ publishedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const docs = await cursor.toArray();
		return docs.map(toDTO);
	});
}

export async function getPostBySlug(slug: string, includeDrafts = false): Promise<PostDTO | null> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(postSlugCacheKey(slug, includeDrafts), ttl, async () => {
		const collection = await getCollection();
		const query: Record<string, unknown> = { slug };
		if (!includeDrafts) {
			query.status = 'published';
		}
		const doc = await collection.findOne(query);
		return doc ? toDTO(doc) : null;
	});
}

export async function getPostById(id: string): Promise<PostDTO | null> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(postIdCacheKey(id), ttl, async () => {
		const collection = await getCollection();
		const _id = new ObjectId(id);
		const doc = await collection.findOne({ _id });
		return doc ? toDTO(doc) : null;
	});
}

export interface UpdatePostInput {
	title?: string;
	slug?: string;
	excerpt?: string;
	content?: string;
	category?: PostCategory;
	tags?: string[];
	author?: PostAuthor;
	image?: PostImage;
	status?: PostStatus;
	publishedAt?: Date | null;
	readTime?: number;
	meta?: PostMeta;
	featured?: boolean;
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<PostDTO | null> {
	const collection = await getCollection();
	const _id = new ObjectId(id);

	const update: Record<string, unknown> = {
		updatedAt: new Date(),
	};

	for (const [key, value] of Object.entries(input)) {
		if (typeof value === 'undefined') continue;
		if (value === null && key === 'publishedAt') {
			update.publishedAt = null;
		} else {
			update[key] = value;
		}
	}

	const result = await collection.findOneAndUpdate(
		{ _id },
		{ $set: update },
		{ returnDocument: 'after' },
	);

	// No driver MongoDB v6, findOneAndUpdate (sem includeResultMetadata)
	// já retorna diretamente o documento atualizado ou null.
	const doc = result as WithId<PostDocument> | null;
	if (doc) {
		invalidatePostsCache();
	}
	return doc ? toDTO(doc) : null;
}

export async function deletePost(id: string, soft = true): Promise<boolean> {
	const collection = await getCollection();
	const _id = new ObjectId(id);

	if (soft) {
		const result = await collection.updateOne(
			{ _id },
			{ $set: { status: 'deleted' as PostStatus, updatedAt: new Date() } },
		);
		if (result.matchedCount > 0) {
			invalidatePostsCache();
		}
		return result.matchedCount > 0;
	}

	const result = await collection.deleteOne({ _id });
	if (result.deletedCount === 1) {
		invalidatePostsCache();
	}
	return result.deletedCount === 1;
}

export interface TagWithCount {
	tag: string;
	count: number;
}

export interface CategoryWithCount {
	category: PostCategory;
	count: number;
}

export async function getTagsWithCounts(): Promise<TagWithCount[]> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(TAGS_COUNTS_CACHE_KEY, ttl, async () => {
		const collection = await getCollection();

		const pipeline = [
			{ $match: { status: 'published' as PostStatus } },
			{ $unwind: '$tags' },
			{
				$group: {
					_id: '$tags',
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1, _id: 1 } },
		];

		const results = await collection.aggregate<{ _id: string; count: number }>(pipeline).toArray();

		return results.map((r) => ({
			tag: r._id,
			count: r.count,
		}));
	});
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
	const ttl = getMemoryCacheTtlMs();
	return memoryCached(CATEGORIES_COUNTS_CACHE_KEY, ttl, async () => {
		const collection = await getCollection();

		const pipeline = [
			{ $match: { status: 'published' as PostStatus } },
			{
				$group: {
					_id: '$category.slug',
					name: { $first: '$category.name' },
					slug: { $first: '$category.slug' },
					color: { $first: '$category.color' },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1, name: 1 } },
		];

		const results = await collection
			.aggregate<{ _id: string; name: string; slug: string; color?: string; count: number }>(pipeline)
			.toArray();

		return results.map((r) => ({
			category: {
				name: r.name,
				slug: r.slug,
				color: r.color,
			},
			count: r.count,
		}));
	});
}

export async function incrementPostViews(slug: string): Promise<void> {
	const collection = await getCollection();
	await collection.updateOne(
		{ slug },
		{
			$inc: { 'stats.views': 1 },
			$set: { updatedAt: new Date() },
		},
	);
	invalidateMemoryCacheKey(postSlugCacheKey(slug, true));
	invalidateMemoryCacheKey(postSlugCacheKey(slug, false));
}

