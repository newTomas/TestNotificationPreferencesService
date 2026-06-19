# --- builder ---
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts nest-cli.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
# Значение нужно только для загрузки prisma.config.ts при postinstall (generate к БД не подключается).
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm ci
RUN npm run build

# --- runtime ---
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
