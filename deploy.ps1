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

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  Write-Host $Label -ForegroundColor Green
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

Invoke-Checked "Building..." { npm run build }

Invoke-Checked "Fetching Prisma engines locally (for offline VPS install)..." { & (Join-Path $PSScriptRoot "scripts\fetch-prisma-engines.ps1") }

Invoke-Checked "Clearing remote frontend/backend build folders..." { ssh -p $Port "$User@$HostName" "mkdir -p $RemoteDist $RemoteServer/src $RemoteServer/prisma $RemoteServer/prisma-engines $RemoteServer/dist && rm -rf $RemoteDist/* $RemoteServer/src/* $RemoteServer/prisma/* $RemoteServer/dist/*" }

Invoke-Checked "Uploading frontend..." { scp -P $Port -r .\dist\* "${User}@${HostName}:$RemoteDist/" }

Invoke-Checked "Fixing frontend permissions..." { ssh -p $Port "$User@$HostName" $FixWebPermissions }

Write-Host "Uploading backend source..." -ForegroundColor Green
Invoke-Checked "Uploading docker-compose.yml..." { scp -P $Port .\docker-compose.yml "${User}@${HostName}:$RemoteRoot/" }
Invoke-Checked "Uploading server source..." { scp -P $Port -r .\server\src\* "${User}@${HostName}:$RemoteServer/src/" }
Invoke-Checked "Uploading Prisma schema..." { scp -P $Port -r .\server\prisma\* "${User}@${HostName}:$RemoteServer/prisma/" }
Invoke-Checked "Uploading server package files..." { scp -P $Port .\server\package.json .\server\tsconfig.json "${User}@${HostName}:$RemoteServer/" }
if (Test-Path .\server\package-lock.json) {
  Invoke-Checked "Uploading server lockfile..." { scp -P $Port .\server\package-lock.json "${User}@${HostName}:$RemoteServer/" }
}

Invoke-Checked "Uploading Prisma engines..." { scp -P $Port -r .\server\prisma-engines\* "${User}@${HostName}:$RemoteServer/prisma-engines/" }
Invoke-Checked "Marking Prisma schema engine executable..." { ssh -p $Port "$User@$HostName" "chmod +x $RemoteServer/prisma-engines/schema-engine-linux-musl-openssl-3.0.x" }

# PRISMA_SCHEMA_ENGINE_BINARY + PRISMA_QUERY_ENGINE_LIBRARY are set in docker-compose.yml,
# so `prisma generate` / `db push` use the pre-downloaded engines instead of binaries.prisma.sh.
# Remove only the API container first to avoid docker-compose v1's KeyError: ContainerConfig
# recreate bug, and use --no-deps so the database container is never recreated during deploy.
$ContainerBuildCommand = "export PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma-engines/schema-engine-linux-musl-openssl-3.0.x PRISMA_QUERY_ENGINE_LIBRARY=/app/prisma-engines/libquery_engine-linux-musl-openssl-3.0.x.so.node PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x; cd /app && test -x `$PRISMA_SCHEMA_ENGINE_BINARY && test -f `$PRISMA_QUERY_ENGINE_LIBRARY && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && rm -rf dist/* && npm run build"
$RemoteDeployCommand = @"
#!/usr/bin/env bash
set -e
cd $RemoteRoot
DC='docker-compose'
if docker compose version >/dev/null 2>&1; then
  DC='docker compose'
fi
`$DC up -d db
`$DC rm -sf api >/dev/null 2>&1 || true
`$DC up -d --no-deps api
sleep 3
`$DC exec -T api sh -lc '$ContainerBuildCommand'
`$DC restart api
sleep 3
`$DC logs --tail=20 api
$FixWebPermissions
systemctl reload nginx
"@

# Windows PowerShell here-strings are CRLF by default. Sending CRLF directly to
# bash over SSH causes errors like `set: invalid option` and paths ending in `\r`.
# Write the remote deploy script as LF-only, upload it, then execute it on the VPS.
$RemoteDeployCommand = $RemoteDeployCommand.Replace("`r`n", "`n").Replace("`r", "")
$RemoteScriptPath = Join-Path $env:TEMP "higooya-remote-deploy.sh"
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($RemoteScriptPath, $RemoteDeployCommand, $Utf8NoBom)

Invoke-Checked "Uploading remote deploy script..." { scp -P $Port $RemoteScriptPath "${User}@${HostName}:/tmp/higooya-remote-deploy.sh" }
Invoke-Checked "Regenerating Prisma client, syncing database, rebuilding backend, restarting api, and reloading nginx..." { ssh -p $Port "$User@$HostName" 'bash /tmp/higooya-remote-deploy.sh; status=$?; rm -f /tmp/higooya-remote-deploy.sh; exit $status' }

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
