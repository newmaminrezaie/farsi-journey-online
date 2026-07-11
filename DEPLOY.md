# Deploy — Iranian VPS

Two things ship: the SPA (`dist/`) served by nginx, and the API stack
(`docker-compose.yml`) served by Docker.

## One-time setup on the VPS

```bash
# nginx already installed; also install docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # log out/in

# create the deploy dir
sudo mkdir -p /var/www/higooya
sudo chown $USER:$USER /var/www/higooya
cd /var/www/higooya

# copy repo (only what's needed)
scp -r docker-compose.yml scripts/ server/ .env.example user@vps:/var/www/higooya/
cp .env.example .env
# then edit .env — see "Secrets to fill" below
```

### Secrets to fill in `.env`

Minimum to boot:

- `POSTGRES_PASSWORD` — strong random
- `JWT_SECRET` — `openssl rand -hex 48`
- `BOOTSTRAP_ADMIN_PASSWORD` — first admin login

Notifications (optional but recommended):

- `BALE_BOT_TOKEN` — create a bot via `@botfather_bot` on Bale
- `BALE_ADMIN_CHAT_IDS` — comma-separated fallback chat IDs
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_PROXY_URL` — only if you want Telegram in addition to Bale. Proxy URL supports `http://`, `https://`, `socks5://`. If either is unset, Telegram is silently disabled.

Zarinpal (Phase 2): `ZARINPAL_MERCHANT_ID`.

## Bring the stack up

The api container **volume-mounts** `server/dist/`, `server/node_modules/`, and
`server/prisma/` from the host. That means:

- You must have a built `server/dist/` and a populated `server/node_modules/`
  on the host before starting the api container.
- Day-to-day code updates are `git pull && docker-compose restart api` — no
  image rebuild needed. Rebuild only if you bump Node or change the Dockerfile.

First-time bring-up:

```bash
cd /var/www/higooya/server
# Build node_modules on the host (needs npm registry access — do this through
# your proxy/tunnel once). The Prisma musl engine for Alpine ships automatically
# because schema.prisma declares binaryTargets = ["native", "linux-musl-openssl-3.0.x"].
npm install --no-audit --no-fund
npx prisma generate
npm run build     # compiles TS → dist/

cd /var/www/higooya
docker-compose up -d
npx --prefix server prisma db push --schema server/prisma/schema.prisma --accept-data-loss
docker-compose exec db psql -U higooya -d higooya -c "\dt"
docker-compose exec api npm run seed:admin
```

`seed:admin` reads `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` from
`.env` and creates the first admin. It's idempotent — if the user already
exists it skips (so **changing the password in .env and re-running does NOT
update it**). To reset the password, delete the row and re-seed:

```bash
docker-compose exec db psql -U higooya -d higooya \
  -c 'DELETE FROM "StaffUser" WHERE username = '"'"'admin'"'"';'
docker-compose exec api npm run seed:admin
```

Schema changes: edit `server/prisma/schema.prisma`, then run the schema sync on
the VPS host and restart the api. Do not run Prisma schema sync from container
startup on restricted networks:

```bash
cd /var/www/higooya
npx --prefix server prisma db push --schema server/prisma/schema.prisma --accept-data-loss
docker-compose restart api
```

## Update procedure

```bash
cd /var/www/higooya
git pull
# If server/src changed:
cd server && npm run build && cd ..
# If server/prisma/schema.prisma changed:
npx --prefix server prisma db push --schema server/prisma/schema.prisma --accept-data-loss
docker-compose restart api
# If SPA changed: build locally, ship dist/, then fix perms — scp preserves
# the client-side umask and often lands as 700, which nginx (www-data) can't read.
# Preferred: rsync with explicit perms (from Git Bash / WSL on the client):
#   rsync -e "ssh -p 9011" -rlt --delete --chmod=D755,F644 \
#     ./dist/ root@<vps>:/var/www/higooya/dist.new/
# Or after `scp -r ./dist root@<vps>:/var/www/higooya/dist.new` and the atomic
# `mv dist.new dist`, always run on the VPS:
#   sudo chown -R root:www-data /var/www/higooya/dist
#   sudo find /var/www/higooya/dist -type d -exec chmod 755 {} \;
#   sudo find /var/www/higooya/dist -type f -exec chmod 644 {} \;
```

## Nginx

```nginx
server {
  listen 80;
  server_name higooya.ir www.higooya.ir;
  root /var/www/higooya/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  # API + uploads → Fastify container on 127.0.0.1:3000
  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    alias /var/www/higooya/uploads/;
    expires 7d;
  }
}
```

Reload: `sudo nginx -t && sudo systemctl reload nginx`.
Add HTTPS with Let's Encrypt or an Iranian TLS provider — the stack is
scheme-agnostic.

## Backups

The `backup` container runs `scripts/backup.sh` nightly at 03:00 Tehran time
and writes `backups/higooya-YYYY-MM-DD.dump` + `backups/uploads-YYYY-MM-DD.tar.gz`,
keeping the last 30 days. Restore:

```bash
docker compose exec -T db pg_restore -U higooya -d higooya --clean --if-exists < backups/higooya-2026-07-08.dump
```

For off-site copies, `rclone config` a remote (Arvan Object Storage, S3, etc.)
and set `RCLONE_REMOTE=<name>:higooya-backups` in `.env`.

