import { MongoClient, type Db } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB_NAME;

if (!uri) {
	throw new Error('MONGODB_URI não está definida nas variáveis de ambiente.');
}

if (!dbName) {
	throw new Error('MONGODB_DB_NAME não está definida nas variáveis de ambiente.');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function connectClient(): Promise<MongoClient> {
	if (client) return client;
	if (!clientPromise) {
		clientPromise = MongoClient.connect(uri).then((connectedClient) => {
			client = connectedClient;
			return connectedClient;
		});
	}
	return clientPromise;
}

export async function getDb(): Promise<Db> {
	const mongoClient = await connectClient();
	return mongoClient.db(dbName);
}

