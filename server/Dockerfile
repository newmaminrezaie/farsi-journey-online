# HiGooya API image — minimal.
# node_modules, dist, and prisma are volume-mounted from the host at runtime
# (see docker-compose.yml). This image only provides the Node runtime plus
# the openssl shared library that Prisma's query engine needs on Alpine.
#
# Rebuild only when the Node major version needs to change. Day-to-day code
# updates are `git pull && docker-compose restart api`.

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
# Point Prisma at the musl engine we ship in node_modules.
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node

# ParsVDS can't reach dl-cdn.alpinelinux.org; use an Iranian mirror for apk.
RUN sed -i 's|https://dl-cdn.alpinelinux.org|https://mirror.aminidc.com|g' /etc/apk/repositories \
 && apk add --no-cache openssl

RUN mkdir -p /app/uploads
EXPOSE 3000

# Compile TS if dist/ is missing (first boot after a fresh checkout), then
# sync schema and start. `db push` is idempotent; the TS build is skipped
# when dist/index.js already exists so restarts stay fast.
CMD ["sh", "-c", "[ -f dist/index.js ] || npx tsc -p tsconfig.json && npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
