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

# Keep flaky/slow links alive: the 15MB+18MB Prisma engine uploads take ~30min on
# this connection and the server was dropping the session right after them.
$SshOpts = @(
  "-p", "$Port",
  "-o", "ServerAliveInterval=15",
  "-o", "ServerAliveCountMax=20",
  "-o", "TCPKeepAlive=yes",
  "-o", "ConnectTimeout=30"
)
$ScpOpts = @(
  "-P", "$Port",
  "-o", "ServerAliveInterval=15",
  "-o", "ServerAliveCountMax=20",
  "-o", "TCPKeepAlive=yes",
  "-o", "ConnectTimeout=30"
)

function Invoke-Ssh {
  param([Parameter(Mandatory = $true)][string]$Script)
  ssh @SshOpts "$User@$HostName" $Script
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,
    [int]$Retries = 2
  )

  Write-Host $Label -ForegroundColor Green
  for ($attempt = 1; $attempt -le ($Retries + 1); $attempt++) {
    & $Command
    if ($LASTEXITCODE -eq 0) { return }
    if ($attempt -le $Retries) {
      Write-Host "  attempt $attempt failed (exit $LASTEXITCODE) - retrying..." -ForegroundColor Yellow
      Start-Sleep -Seconds 5
    }
  }
  throw "$Label failed with exit code $LASTEXITCODE."
}

Invoke-Checked "Building..." { npm run build } -Retries 0

Invoke-Checked "Fetching Prisma engines locally (for offline VPS install)..." { & (Join-Path $PSScriptRoot "scripts\fetch-prisma-engines.ps1") } -Retries 0

Invoke-Checked "Clearing remote frontend/backend build folders..." { Invoke-Ssh "mkdir -p $RemoteDist $RemoteServer/src $RemoteServer/prisma $RemoteServer/prisma-engines $RemoteServer/dist && rm -rf $RemoteDist/* $RemoteServer/src/* $RemoteServer/prisma/* $RemoteServer/dist/*" }

Invoke-Checked "Uploading frontend..." { scp @ScpOpts -r .\dist\* "${User}@${HostName}:$RemoteDist/" }

Invoke-Checked "Fixing frontend permissions..." { Invoke-Ssh $FixWebPermissions }

Write-Host "Uploading backend source..." -ForegroundColor Green
Invoke-Checked "Uploading docker-compose.yml..." { scp @ScpOpts .\docker-compose.yml "${User}@${HostName}:$RemoteRoot/" }
Invoke-Checked "Uploading server source..." { scp @ScpOpts -r .\server\src\* "${User}@${HostName}:$RemoteServer/src/" }
Invoke-Checked "Uploading Prisma schema..." { scp @ScpOpts -r .\server\prisma\* "${User}@${HostName}:$RemoteServer/prisma/" }
Invoke-Checked "Uploading server package files..." { scp @ScpOpts .\server\package.json .\server\tsconfig.json "${User}@${HostName}:$RemoteServer/" }
if (Test-Path .\server\package-lock.json) {
  Invoke-Checked "Uploading server lockfile..." { scp @ScpOpts .\server\package-lock.json "${User}@${HostName}:$RemoteServer/" }
}

# Prisma engines are ~33MB and never change unless the Prisma version changes.
# Compare sizes with the VPS first and skip the (very slow) upload when they match.
Write-Host "Checking remote Prisma engines..." -ForegroundColor Green
$engineFiles = Get-ChildItem (Join-Path $PSScriptRoot "server\prisma-engines") -File
$remoteSizes = (Invoke-Ssh "stat -c '%n %s' $RemoteServer/prisma-engines/* 2>/dev/null || true") -join "`n"
$needUpload = $false
foreach ($f in $engineFiles) {
  if ($remoteSizes -notmatch [regex]::Escape("$($f.Name) $($f.Length)")) { $needUpload = $true }
}

if ($needUpload) {
  Invoke-Checked "Uploading Prisma engines (large, this can take a while)..." { scp @ScpOpts -r .\server\prisma-engines\* "${User}@${HostName}:$RemoteServer/prisma-engines/" }
} else {
  Write-Host "  engines already present and identical in size - skipping upload" -ForegroundColor DarkGray
}

Invoke-Checked "Marking Prisma schema engine executable..." { Invoke-Ssh "chmod +x $RemoteServer/prisma-engines/schema-engine-linux-musl-openssl-3.0.x" }


# PRISMA_SCHEMA_ENGINE_BINARY + PRISMA_QUERY_ENGINE_LIBRARY are set in docker-compose.yml,
# so `prisma generate` / `db push` use the pre-downloaded engines instead of binaries.prisma.sh.
# Remove only the API container first to avoid docker-compose v1's KeyError: ContainerConfig
# recreate bug, and use --no-deps so the database container is never recreated during deploy.
$PrismaEnv = "export PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma-engines/schema-engine-linux-musl-openssl-3.0.x PRISMA_QUERY_ENGINE_LIBRARY=/app/prisma-engines/libquery_engine-linux-musl-openssl-3.0.x.so.node PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x;"
$ContainerBuildCommand = "$PrismaEnv cd /app && test -x `$PRISMA_SCHEMA_ENGINE_BINARY && test -f `$PRISMA_QUERY_ENGINE_LIBRARY && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && rm -rf dist/* && npx tsc -p tsconfig.json"
$RemoteDeployCommand = @"
#!/usr/bin/env bash
set -e
cd $RemoteRoot

# Exit code 137 means SIGKILL, almost always the Linux OOM killer on small VPSes.
# Give Prisma/schema-engine enough breathing room during `db push` without needing
# provider support or a larger plan.
if ! swapon --show | grep -q '/swapfile'; then
  if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' >> /etc/fstab

DC='docker-compose'
if docker compose version >/dev/null 2>&1; then
  DC='docker compose'
fi

# docker-compose v1.29 crashes with KeyError: 'ContainerConfig' whenever it tries
# to RECREATE a container whose image was built/pulled by a modern Docker daemon.
# Workaround: never recreate in place. Start with --no-recreate, and if the
# service config really changed, remove the container first and create it fresh.
`$DC up -d --no-recreate db || { `$DC rm -sf db >/dev/null 2>&1 || true; `$DC up -d --no-deps db; }

# Stop RAM consumers before Prisma. Do NOT start api before build, because its
# startup command may run TypeScript compilation at the same time as this deploy.
`$DC stop api backup >/dev/null 2>&1 || true
`$DC run --rm --no-deps api sh -lc '$ContainerBuildCommand'
`$DC rm -sf api >/dev/null 2>&1 || true
`$DC up -d --no-deps api
`$DC rm -sf backup >/dev/null 2>&1 || true
`$DC up -d --no-deps backup >/dev/null 2>&1 || true

sleep 3
`$DC logs --tail=20 api
$FixWebPermissions
systemctl reload nginx

# Reclaim disk: drop dangling images and cap docker build cache at 512MB
# so repeat deploys don't slowly fill the VPS with unreferenced layers.
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f --keep-storage 512MB >/dev/null 2>&1 || true
echo '--- disk usage ---'
df -h / | tail -n 1
"@

# Windows PowerShell here-strings are CRLF by default. Sending CRLF directly to
# bash over SSH causes errors like `set: invalid option` and paths ending in `\r`.
# Write the remote deploy script as LF-only, upload it, then execute it on the VPS.
$RemoteDeployCommand = $RemoteDeployCommand.Replace("`r`n", "`n").Replace("`r", "")
$RemoteScriptPath = Join-Path $env:TEMP "higooya-remote-deploy.sh"
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($RemoteScriptPath, $RemoteDeployCommand, $Utf8NoBom)

Invoke-Checked "Uploading remote deploy script..." { scp @ScpOpts $RemoteScriptPath "${User}@${HostName}:/tmp/higooya-remote-deploy.sh" }
Invoke-Checked "Regenerating Prisma client, syncing database, rebuilding backend, restarting api, and reloading nginx..." { Invoke-Ssh 'bash /tmp/higooya-remote-deploy.sh; status=$?; rm -f /tmp/higooya-remote-deploy.sh; exit $status' } -Retries 0

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
