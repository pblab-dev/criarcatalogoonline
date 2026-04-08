import { getDb } from '../mongodb';
import bcrypt from 'bcryptjs';

export interface UserDocument {
	_id: string;
	email: string;
	name: string;
	passwordHash: string;
	role: 'admin';
	createdAt: Date;
	updatedAt: Date;
}

export interface UserDTO extends Omit<UserDocument, 'passwordHash'> {}

async function getCollection() {
	const db = await getDb();
	return db.collection<UserDocument>('users');
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
	const collection = await getCollection();
	return collection.findOne({ email });
}

export async function findUserById(id: string): Promise<UserDocument | null> {
	const collection = await getCollection();
	return collection.findOne({ _id: id });
}

export async function createAdminUser(
	id: string,
	email: string,
	name: string,
	password: string,
): Promise<UserDTO> {
	const collection = await getCollection();
	const now = new Date();

	const passwordHash = await bcrypt.hash(password, 10);

	const doc: UserDocument = {
		_id: id,
		email,
		name,
		passwordHash,
		role: 'admin',
		createdAt: now,
		updatedAt: now,
	};

	await collection.insertOne(doc);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { passwordHash: _ph, ...user } = doc;
	return user;
}

export async function verifyPassword(user: UserDocument, password: string): Promise<boolean> {
	return bcrypt.compare(password, user.passwordHash);
}

