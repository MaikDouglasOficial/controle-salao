# 1. Imagem base
FROM node:20-alpine AS base

# 2. Imagem para dependências
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder (gera o .next/)
FROM base AS builder
WORKDIR /app

ENV DATABASE_URL="file:/app/data/prod.db"
RUN mkdir -p /app/data

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm run build

# 4. Imagem final (leve)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Habilitar modo standalone (Next 13+)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/prod.db"

RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
