param(
  [string]$HostName = "87.107.12.53",
  [string]$User = "root",
  [int]$Port = 9011,
  [string]$RemotePath = "/var/www/higooya/dist"
)

$ErrorActionPreference = "Stop"

function Run-Local($Command) {
  Write-Host "`n> $Command" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Command" }
}

function Run-Remote($Command) {
  Run-Local "ssh -p $Port $User@$HostName `"$Command`""
}

Write-Host "Building frontend..." -ForegroundColor Green
Run-Local "npm run build"

if (!(Test-Path ".\dist\index.html")) {
  throw "Build failed: .\dist\index.html was not created."
}

Write-Host "Preparing remote directory..." -ForegroundColor Green
Run-Remote "mkdir -p '$RemotePath' && rm -rf '$RemotePath'/*"

Write-Host "Uploading fresh build..." -ForegroundColor Green
Run-Local "scp -P $Port -r .\dist\* $User@$HostName`:$RemotePath/"

Write-Host "Fixing ownership and permissions..." -ForegroundColor Green
Run-Remote "chown -R root:www-data '$RemotePath' && find '$RemotePath' -type d -exec chmod 755 {} \; && find '$RemotePath' -type f -exec chmod 644 {} \; && nginx -t && systemctl reload nginx"

Write-Host "Verifying remote index.html..." -ForegroundColor Green
Run-Remote "test -f '$RemotePath/index.html' && ls -la '$RemotePath/index.html' && grep -oE 'assets/index-[a-z0-9]+\.js' '$RemotePath/index.html' || true"

Write-Host "`nDeploy complete. Open https://higooya.ir and hard-refresh with Ctrl+F5." -ForegroundColor Green