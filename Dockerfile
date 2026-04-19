# Build da aplicação Astro (output server + adapter Node middleware)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Imagem de produção: apenas dependências de runtime + artefatos do build
FROM node:20-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
# Plataformas de orquestração costumam injetar PORT; o server.js usa process.env.PORT
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server.js start-production.js ./

RUN chown -R node:node /app

USER node

EXPOSE 8080

# Equivale a `node start-production.js` (valida dist e carrega server.js)
CMD ["npm", "run", "start:production"]
