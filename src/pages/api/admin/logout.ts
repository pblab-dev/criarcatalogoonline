import type { APIRoute } from 'astro';
import { SESSION_COOKIE_NAME } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
	cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		path: '/',
		maxAge: 0,
	});

	return redirect('/admin/login', 303);
};

