param(
  [string]$HostName = "87.107.12.53",
  [string]$User = "root",
  [int]$Port = 9011,
  [string]$RemotePath = "/var/www/higooya/dist",
  [string]$Password = "Jkr041044#"
)

$ErrorActionPreference = "Stop"

# Requires PuTTY tools (plink.exe + pscp.exe) on PATH so we can pass the password non-interactively.
# Install once with:  winget install PuTTY.PuTTY
foreach ($tool in @("plink.exe", "pscp.exe")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool not found on PATH. Install PuTTY (winget install PuTTY.PuTTY) and reopen PowerShell."
  }
}

function Run-Local($Command) {
  Write-Host "`n> $Command" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Command" }
}

function Run-Remote($Command) {
  Write-Host "`n> [remote] $Command" -ForegroundColor Cyan
  & plink.exe -ssh -batch -pw $Password -P $Port "$User@$HostName" $Command
  if ($LASTEXITCODE -ne 0) { throw "Remote command failed: $Command" }
}

function Copy-Remote($LocalGlob, $Remote) {
  Write-Host "`n> [scp] $LocalGlob -> $Remote" -ForegroundColor Cyan
  & pscp.exe -batch -pw $Password -P $Port -r $LocalGlob "$User@$HostName`:$Remote"
  if ($LASTEXITCODE -ne 0) { throw "Upload failed." }
}

Write-Host "Building frontend..." -ForegroundColor Green
Run-Local "npm run build"

if (!(Test-Path ".\dist\index.html")) {
  throw "Build failed: .\dist\index.html was not created."
}

# Trust host key on first connect (silently accept for automation).
& cmd /c "echo y | plink.exe -ssh -pw $Password -P $Port $User@$HostName exit" | Out-Null

Write-Host "Preparing remote directory..." -ForegroundColor Green
Run-Remote "mkdir -p '$RemotePath' && rm -rf '$RemotePath'/*"

Write-Host "Uploading fresh build..." -ForegroundColor Green
Copy-Remote ".\dist\*" $RemotePath

Write-Host "Fixing ownership and permissions..." -ForegroundColor Green
Run-Remote "chown -R root:www-data '$RemotePath' && find '$RemotePath' -type d -exec chmod 755 {} \; && find '$RemotePath' -type f -exec chmod 644 {} \; && nginx -t && systemctl reload nginx"

Write-Host "Verifying remote index.html..." -ForegroundColor Green
Run-Remote "test -f '$RemotePath/index.html' && ls -la '$RemotePath/index.html' && grep -oE 'assets/index-[a-z0-9]+\.js' '$RemotePath/index.html' || true"

Write-Host "`nDeploy complete. Open https://higooya.ir and hard-refresh with Ctrl+F5." -ForegroundColor Green
