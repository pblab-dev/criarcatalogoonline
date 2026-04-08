import type { APIRoute } from 'astro';
import { getDb } from '../../lib/mongodb';

export const GET: APIRoute = async () => {
	try {
		const db = await getDb();
		// O comando ping verifica se a conexão está saudável.
		await db.command({ ping: 1 });

		return new Response(
			JSON.stringify({
				ok: true,
				message: 'Conexão com o MongoDB bem-sucedida.',
				db: db.databaseName,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	} catch (error) {
		console.error(error);

		return new Response(
			JSON.stringify({
				ok: false,
				message: 'Falha ao conectar no MongoDB. Verifique as variáveis de ambiente.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

