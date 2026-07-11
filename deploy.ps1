param(
  [string]$HostName = "87.107.12.53",
  [string]$User = "root",
  [int]$Port = 9011,
  [string]$RemotePath = "/var/www/higooya/dist",
  [string]$IdentityFile = "$env:USERPROFILE\.ssh\higooya_ed25519"
)

# Deploy HiGooya frontend to the VPS.
#
# One-time setup (no more password prompts after this):
#   .\setup-ssh-key.ps1
#
# Then just run:
#   .\deploy.ps1

$ErrorActionPreference = "Stop"

$sshArgs = "-p $Port"
$scpArgs = "-P $Port"
if (Test-Path $IdentityFile) {
  $sshArgs = "-i `"$IdentityFile`" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p $Port"
  $scpArgs = "-i `"$IdentityFile`" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -P $Port"
} else {
  Write-Host "No SSH key at $IdentityFile — you'll be prompted for the password." -ForegroundColor Yellow
  Write-Host "Run .\setup-ssh-key.ps1 once to enable passwordless deploys." -ForegroundColor Yellow
}

function Run-Local($Command) {
  Write-Host "`n> $Command" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Command" }
}

function Run-Remote($Command) {
  Run-Local "ssh $sshArgs $User@$HostName `"$Command`""
}

Write-Host "Building frontend..." -ForegroundColor Green
Run-Local "npm run build"

if (!(Test-Path ".\dist\index.html")) {
  throw "Build failed: .\dist\index.html was not created."
}

Write-Host "Preparing remote directory..." -ForegroundColor Green
Run-Remote "mkdir -p '$RemotePath' && rm -rf '$RemotePath'/*"

Write-Host "Uploading fresh build..." -ForegroundColor Green
Run-Local "scp $scpArgs -r .\dist\* $User@$HostName`:$RemotePath/"

Write-Host "Fixing ownership and permissions..." -ForegroundColor Green
Run-Remote "chown -R root:www-data '$RemotePath' && find '$RemotePath' -type d -exec chmod 755 {} \; && find '$RemotePath' -type f -exec chmod 644 {} \; && nginx -t && systemctl reload nginx"

Write-Host "Verifying remote index.html..." -ForegroundColor Green
Run-Remote "test -f '$RemotePath/index.html' && ls -la '$RemotePath/index.html' && grep -oE 'assets/index-[a-z0-9]+\.js' '$RemotePath/index.html' || true"

Write-Host "`nDeploy complete. Open https://higooya.ir and hard-refresh with Ctrl+F5." -ForegroundColor Green
