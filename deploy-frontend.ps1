# HiGooya frontend-only deploy.
# Use this when you ONLY changed files under src/ (no server/, prisma/, docker-compose changes).
# Much faster than deploy.ps1 — no Docker, no Prisma, no swap, no image prune.

$ErrorActionPreference = "Stop"

$HostName   = "87.107.12.53"
$User       = "root"
$Port       = 9011
$RemoteRoot = "/var/www/higooya"
$RemoteDist = "$RemoteRoot/dist"
$FixWebPermissions = "chmod 755 /var /var/www $RemoteRoot $RemoteDist && chown -R root:www-data $RemoteDist && find $RemoteDist -type d -exec chmod 755 {} \; && find $RemoteDist -type f -exec chmod 644 {} \;"

function Invoke-Checked {
  param([Parameter(Mandatory)][string]$Label, [Parameter(Mandatory)][scriptblock]$Command)
  Write-Host $Label -ForegroundColor Green
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE." }
}

Invoke-Checked "Building frontend..." { npm run build }
Invoke-Checked "Clearing remote dist..." { ssh -p $Port "$User@$HostName" "mkdir -p $RemoteDist && rm -rf $RemoteDist/*" }
Invoke-Checked "Uploading dist..." { scp -P $Port -r .\dist\* "${User}@${HostName}:$RemoteDist/" }
Invoke-Checked "Fixing permissions + reloading nginx..." { ssh -p $Port "$User@$HostName" "$FixWebPermissions && systemctl reload nginx" }

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
