param(
  [string]$HostName = "87.107.12.53",
  [string]$User = "root",
  [int]$Port = 9011,
  [string]$IdentityFile = "$env:USERPROFILE\.ssh\higooya_ed25519"
)

# One-time setup: generates an SSH key and installs it on the VPS so
# deploy.ps1 runs without password prompts. You will be asked for the
# VPS password ONCE at the end to copy the public key up.

$ErrorActionPreference = "Stop"

$sshDir = Split-Path $IdentityFile -Parent
if (!(Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }

if (!(Test-Path $IdentityFile)) {
  Write-Host "Generating new SSH key at $IdentityFile ..." -ForegroundColor Green
  # empty passphrase so deploys never prompt
  ssh-keygen -t ed25519 -f "$IdentityFile" -N '""' -C "higooya-deploy"
} else {
  Write-Host "SSH key already exists at $IdentityFile - reusing it." -ForegroundColor Yellow
}

$pubKey = (Get-Content "$IdentityFile.pub" -Raw).Trim()

Write-Host "`nInstalling public key on $User@$HostName (enter VPS password when prompted)..." -ForegroundColor Green
$remoteCmd = "mkdir -p ~/.ssh; chmod 700 ~/.ssh; touch ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; grep -qxF '$pubKey' ~/.ssh/authorized_keys || echo '$pubKey' >> ~/.ssh/authorized_keys"
ssh -p $Port "$User@$HostName" $remoteCmd
if ($LASTEXITCODE -ne 0) { throw "Failed to install public key on VPS." }

Write-Host "`nTesting passwordless login..." -ForegroundColor Green
ssh -i "$IdentityFile" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p $Port "$User@$HostName" "echo OK: passwordless SSH works"
if ($LASTEXITCODE -ne 0) { throw "Passwordless login test failed." }

Write-Host "`nDone. From now on, just run .\deploy.ps1 - no password needed." -ForegroundColor Green
