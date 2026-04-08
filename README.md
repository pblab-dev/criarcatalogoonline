# BlogSEO – Astro + Tailwind + MongoDB

Projeto base para um blog/SEO usando **Astro**, **Tailwind CSS** e **MongoDB**.

## 🚀 Stack

- **Astro 5** (template oficial de blog)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **MongoDB** (driver oficial `mongodb`)

## 🔧 Configuração inicial

1. **Instalar dependências**

   ```sh
   npm install
   ```

2. **Configurar variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto, baseado em `.env.example`:

   ```sh
   cp .env.example .env
   ```

   E ajuste os valores:

   - `MONGODB_URI`: string de conexão do seu cluster MongoDB.
   - `MONGODB_DB_NAME`: nome do banco que o projeto vai usar.

3. **Subir o servidor de desenvolvimento**

   ```sh
   npm run dev
   ```

   A aplicação ficará disponível em `http://localhost:4321`.

## 🗄️ Conexão com o MongoDB

- Helper de conexão: `src/lib/mongodb.ts` (`getDb()` retorna uma instância de `Db` já conectada).
- Rota de teste: `GET /api/db-test`
  - Se estiver tudo certo com o `.env` e o MongoDB acessível, retorna um JSON confirmando a conexão.

## 🧱 Estrutura do projeto

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro procura arquivos `.astro` ou `.md(x)` em `src/pages/`. Cada arquivo vira uma rota baseada no nome do arquivo.

- `src/pages/` – páginas do site (home, blog, about, APIs etc.).
- `src/components/` – componentes Astro reutilizáveis.
- `src/layouts/` – layouts de páginas/post.
- `src/content/` – posts do blog (Markdown/MDX).
- `src/lib/` – utilitários de backend (ex.: `mongodb.ts`).
- `public/` – assets estáticos.

## 🧞 Scripts úteis

Todos são executados na raiz do projeto:

| Script             | Ação                                                  |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Sobe o servidor de desenvolvimento (`localhost:4321`) |
| `npm run build`    | Gera build de produção em `./dist/`                   |
| `npm run preview`  | Faz preview local do build                            |
| `npm run astro …`  | Executa comandos da CLI do Astro                      |

# alziro-blog
