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

Write-Host "Clearing remote frontend/backend build folders..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" "mkdir -p $RemoteDist $RemoteServer/src $RemoteServer/prisma $RemoteServer/dist && rm -rf $RemoteDist/* $RemoteServer/src/* $RemoteServer/prisma/* $RemoteServer/dist/*"

Write-Host "Uploading frontend..." -ForegroundColor Green
scp -P $Port -r .\dist\* "${User}@${HostName}:$RemoteDist/"

Write-Host "Fixing frontend permissions..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" $FixWebPermissions

Write-Host "Uploading backend source..." -ForegroundColor Green
scp -P $Port -r .\server\src\* "${User}@${HostName}:$RemoteServer/src/"
scp -P $Port -r .\server\prisma\* "${User}@${HostName}:$RemoteServer/prisma/"
scp -P $Port .\server\package.json .\server\tsconfig.json "${User}@${HostName}:$RemoteServer/"
if (Test-Path .\server\package-lock.json) {
  scp -P $Port .\server\package-lock.json "${User}@${HostName}:$RemoteServer/"
}

Write-Host "Regenerating Prisma client, syncing database, rebuilding backend, restarting api, and reloading nginx..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" "cd $RemoteRoot && docker-compose exec -T api sh -lc 'cd /app && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && rm -rf dist && npm run build' && docker-compose restart api && sleep 3 && docker-compose logs --tail=20 api && $FixWebPermissions && systemctl reload nginx"

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
