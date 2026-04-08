import type { APIRoute } from 'astro';
import { findUserByEmail, verifyPassword } from '../../../lib/models/user';
import { createSessionToken, SESSION_COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	try {
		const contentType = request.headers.get('content-type') || '';
		let email = '';
		let password = '';

		if (contentType.includes('application/json')) {
			const body = (await request.json()) as { email?: string; password?: string };
			email = body.email ?? '';
			password = body.password ?? '';
		} else if (
			contentType.includes('application/x-www-form-urlencoded') ||
			contentType.includes('multipart/form-data')
		) {
			const form = await request.formData();
			email = String(form.get('email') ?? '');
			password = String(form.get('password') ?? '');
		} else {
			return redirect('/admin/login?error=server', 303);
		}

		if (!email || !password) {
			return redirect('/admin/login?error=missing', 303);
		}

		const user = await findUserByEmail(email);
		if (!user) {
			return redirect('/admin/login?error=invalid', 303);
		}

		const valid = await verifyPassword(user, password);
		if (!valid) {
			return redirect('/admin/login?error=invalid', 303);
		}

		const token = createSessionToken(user);

		cookies.set(SESSION_COOKIE_NAME, token, {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: import.meta.env.PROD,
			maxAge: 60 * 60 * 24, // 1 dia
		});

		return redirect('/admin', 303);
	} catch (error) {
		console.error('Erro no login admin', error);
		return redirect('/admin/login?error=server', 303);
	}
};

