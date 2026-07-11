# Simple HiGooya deploy: build, upload, fix perms, reload nginx.
# You will be prompted for the VPS password 3 times. That is fine.

$ErrorActionPreference = "Stop"

$HostName   = "87.107.12.53"
$User       = "root"
$Port       = 9011
$RemotePath = "/var/www/higooya/dist"

Write-Host "Building..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed." }

Write-Host "Clearing remote dist..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" "mkdir -p $RemotePath && rm -rf $RemotePath/*"

Write-Host "Uploading..." -ForegroundColor Green
scp -P $Port -r .\dist\* "${User}@${HostName}:$RemotePath/"

Write-Host "Fixing perms and reloading nginx..." -ForegroundColor Green
ssh -p $Port "$User@$HostName" "chown -R root:www-data $RemotePath && find $RemotePath -type d -exec chmod 755 {} \; && find $RemotePath -type f -exec chmod 644 {} \; && systemctl reload nginx"

Write-Host "`nDone. Hard-refresh https://higooya.ir with Ctrl+F5." -ForegroundColor Green
