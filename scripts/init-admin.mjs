import 'dotenv/config';
import mongodb from 'mongodb';
import bcrypt from 'bcryptjs';

async function main() {
	const uri = process.env.MONGODB_URI;
	const dbName = process.env.MONGODB_DB_NAME;

	if (!uri || !dbName) {
		console.error('Defina MONGODB_URI e MONGODB_DB_NAME no .env antes de rodar este script.');
		process.exit(1);
	}

	const email = process.env.ADMIN_INIT_EMAIL || 'admin@blog.com';
	const name = process.env.ADMIN_INIT_NAME || 'Arthur';
	const password = process.env.ADMIN_INIT_PASSWORD || 'Diel1945!Diel';

	const client = new mongodb.MongoClient(uri);

	try {
		await client.connect();
		const db = client.db(dbName);
		const users = db.collection('users');

		const existing = await users.findOne({ role: 'admin' });
		if (existing) {
			console.log('Já existe um usuário admin. Nenhuma alteração foi feita.');
			return;
		}

		const now = new Date();
		const passwordHash = await bcrypt.hash(password, 10);

		const doc = {
			_id: new mongodb.ObjectId().toHexString(),
			email,
			name,
			passwordHash,
			role: 'admin',
			createdAt: now,
			updatedAt: now,
		};

		await users.insertOne(doc);
		console.log('Usuário admin criado com sucesso.');
		console.log(`E-mail: ${email}`);
		console.log(`Senha: ${password}`);
	} catch (err) {
		console.error('Erro ao inicializar usuário admin:', err);
		process.exit(1);
	} finally {
		await client.close();
	}
}

main();

