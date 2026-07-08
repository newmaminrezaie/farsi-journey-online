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

```bash
cd /var/www/higooya
docker compose up -d
docker compose exec api npm run seed:admin
```

## Build & upload the SPA

On your machine:

```bash
npm install --legacy-peer-deps
npm run build
scp -r dist/ user@vps:/var/www/higooya/
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

## Update procedure

```bash
git pull
docker compose build api
docker compose up -d api        # applies pending Prisma migrations on start
npm run build && scp -r dist/ user@vps:/var/www/higooya/
```
