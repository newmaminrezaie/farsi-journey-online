# Deploy — Iranian VPS

This is a static SPA. `npm run build` produces `dist/` — that's the entire
deployable artifact.

## 1) Build on your machine

```bash
npm install --legacy-peer-deps
npm run build
```

Output: `dist/` (assets are hashed and fingerprinted).

## 2) SCP to the VPS

```bash
scp -r dist/ user@your-vps:/var/www/higooya/
```

## 3) Nginx

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
}
```

Reload: `sudo nginx -t && sudo systemctl reload nginx`.

## 4) HTTPS

Use Let's Encrypt via certbot or an Iranian TLS provider — the SPA doesn't
care which.

## Phase 2 — backend

When we add the Node.js + SQLite backend, deployment becomes:

```
/var/www/higooya/
  dist/            ← the SPA
  server/          ← Node.js app (Express + better-sqlite3)
  data/app.db      ← SQLite file
  uploads/         ← admin-uploaded images
```

Nginx will then also reverse-proxy `/api` and `/uploads` to the Node process.
