FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
RUN mkdir -p /app/uploads
EXPOSE 3000
# Sync schema to DB (no migration history — single-server deploy), then start.
# `prisma db push` is idempotent: it creates missing tables/columns/enums on
# a fresh DB and is a no-op when the schema already matches. If you later
# want a migration history, switch to `prisma migrate deploy` and commit
# the generated prisma/migrations/ folder.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
