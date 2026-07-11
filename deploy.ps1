# HiGooya deploy: build/upload frontend + upload/rebuild/restart backend.
# You will be prompted for the VPS password several times. That is normal.

$ErrorActionPreference = "Stop"

$HostName   = "87.107.12.53"
$User       = "root"
$Port       = 9011
$RemoteRoot = "/var/www/higooya"
$RemoteDist = "$RemoteRoot/dist"
$RemoteServer = "$RemoteRoot/server"
$FixWebPermissions = "chmod 755 /var /var/www $RemoteRoot $RemoteDist && chown -R root:www-data $RemoteDist && find $RemoteDist -type d -exec chmod 755 {} \; && find $RemoteDist -type f -exec chmod 644 {} \;"

Write-Host "Building..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed." }

Write-Host "Fetching Prisma engines locally (for offline VPS install)..." -ForegroundColor Green
& (Join-Path $PSScriptRoot "scripts\fetch-prisma-engines.ps1")
if ($LASTEXITCODE -ne 0) { throw "Prisma engine fetch failed." }

Write-Host "Clearing remote frontend/backend build folders..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" "mkdir -p $RemoteDist $RemoteServer/src $RemoteServer/prisma $RemoteServer/prisma-engines $RemoteServer/dist && rm -rf $RemoteDist/* $RemoteServer/src/* $RemoteServer/prisma/* $RemoteServer/dist/*"

Write-Host "Uploading frontend..." -ForegroundColor Green
scp -P $Port -r .\dist\* "${User}@${HostName}:$RemoteDist/"

Write-Host "Fixing frontend permissions..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" $FixWebPermissions

Write-Host "Uploading backend source..." -ForegroundColor Green
scp -P $Port .\docker-compose.yml "${User}@${HostName}:$RemoteRoot/"
scp -P $Port -r .\server\src\* "${User}@${HostName}:$RemoteServer/src/"
scp -P $Port -r .\server\prisma\* "${User}@${HostName}:$RemoteServer/prisma/"
scp -P $Port .\server\package.json .\server\tsconfig.json "${User}@${HostName}:$RemoteServer/"
if (Test-Path .\server\package-lock.json) {
  scp -P $Port .\server\package-lock.json "${User}@${HostName}:$RemoteServer/"
}

Write-Host "Uploading Prisma engines..." -ForegroundColor Green
scp -P $Port -r .\server\prisma-engines\* "${User}@${HostName}:$RemoteServer/prisma-engines/"
ssh -p $Port "$User@$HostName" "chmod +x $RemoteServer/prisma-engines/schema-engine-linux-musl-openssl-3.0.x"

Write-Host "Regenerating Prisma client, syncing database, rebuilding backend, restarting api, and reloading nginx..." -ForegroundColor Green
# PRISMA_SCHEMA_ENGINE_BINARY + PRISMA_QUERY_ENGINE_LIBRARY are set in docker-compose.yml,
# so `prisma generate` / `db push` use the pre-downloaded engines instead of binaries.prisma.sh.
# We must `docker-compose up -d` (not just restart) so the new volume mount and env vars apply.
ssh -p $Port "$User@$HostName" "cd $RemoteRoot && docker-compose up -d --force-recreate api && sleep 3 && docker-compose exec -T api sh -lc 'export PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma-engines/schema-engine-linux-musl-openssl-3.0.x PRISMA_QUERY_ENGINE_LIBRARY=/app/prisma-engines/libquery_engine-linux-musl-openssl-3.0.x.so.node PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x; cd /app && test -x \"`$PRISMA_SCHEMA_ENGINE_BINARY\" && test -f \"`$PRISMA_QUERY_ENGINE_LIBRARY\" && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && rm -rf dist/* && npm run build' && docker-compose restart api && sleep 3 && docker-compose logs --tail=20 api && $FixWebPermissions && systemctl reload nginx"

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
