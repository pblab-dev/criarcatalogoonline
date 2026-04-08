import crypto from 'crypto';
import { findUserById, type UserDTO, type UserDocument } from './models/user';

const SESSION_COOKIE_NAME = 'admin_session';

function getSessionSecret(): string {
	const secret = import.meta.env.ADMIN_SESSION_SECRET;
	if (!secret) {
		throw new Error('ADMIN_SESSION_SECRET não está definido nas variáveis de ambiente.');
	}
	return secret;
}

interface SessionPayload {
	sub: string;
	exp: number;
}

function base64url(input: Buffer | string): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

export function createSessionToken(user: UserDocument | UserDTO, ttlHours = 24): string {
	const payload: SessionPayload = {
		sub: user._id,
		exp: Date.now() + ttlHours * 60 * 60 * 1000,
	};

	const payloadStr = JSON.stringify(payload);
	const payloadB64 = base64url(payloadStr);

	const secret = getSessionSecret();
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(payloadB64);
	const signature = base64url(hmac.digest());

	return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<UserDTO | null> {
	if (!token) return null;

	const [payloadB64, signature] = token.split('.');
	if (!payloadB64 || !signature) return null;

	const secret = getSessionSecret();
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(payloadB64);
	const expectedSignature = base64url(hmac.digest());

	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
		return null;
	}

	let payload: SessionPayload;
	try {
		const json = Buffer.from(payloadB64, 'base64').toString('utf8');
		payload = JSON.parse(json) as SessionPayload;
	} catch {
		return null;
	}

	if (!payload.sub || !payload.exp || Date.now() > payload.exp) {
		return null;
	}

	const user = await findUserById(payload.sub);
	if (!user) return null;

	const { passwordHash: _ph, ...dto } = user;
	return dto;
}

export { SESSION_COOKIE_NAME };

