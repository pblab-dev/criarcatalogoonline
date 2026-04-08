import express from "express";
import { handler as ssrHandler } from "./dist/server/entry.mjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4929;

app.use(express.json());

app.use(
  express.static(join(__dirname, "dist/client"), {
    maxAge: "1y",
    etag: true,
    setHeaders: (res, path) => {
      if (path.includes("/_astro/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      if (path.endsWith(".xml")) {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  })
);

app.use(ssrHandler);

app.listen(PORT, () => {
  console.log(`🚀 blogSEO rodando em http://localhost:${PORT}`);
  console.log(`📁 Assets estáticos: ${join(__dirname, "dist/client")}`);
  console.log(`🗺️  Sitemap: http://localhost:${PORT}/sitemap.xml`);
});

