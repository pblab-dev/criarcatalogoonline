import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, "dist");
const serverPath = join(distPath, "server", "entry.mjs");
const clientPath = join(distPath, "client");

console.log("🔍 Verificando arquivos de build...");

if (!existsSync(distPath)) {
  console.error("❌ Pasta dist não encontrada. Execute: npm run build");
  process.exit(1);
}

if (!existsSync(serverPath)) {
  console.error("❌ Arquivo entry.mjs não encontrado em dist/server/. Execute: npm run build");
  process.exit(1);
}

if (!existsSync(clientPath)) {
  console.error("❌ Pasta client não encontrada em dist/. Execute: npm run build");
  process.exit(1);
}

console.log("✅ Arquivos de build encontrados!");
console.log("🚀 Iniciando servidor de produção...");

import("./server.js");

