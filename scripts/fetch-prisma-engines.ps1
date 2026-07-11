# Downloads the linux-musl-openssl-3.0.x Prisma engines to server/prisma-engines/
# so the VPS never needs to reach binaries.prisma.sh. Safe to re-run.

$ErrorActionPreference = "Stop"

$OutDir = Join-Path $PSScriptRoot "..\server\prisma-engines"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Read the engines commit hash the local Prisma install pinned to.
$EnginesPkg = Join-Path $PSScriptRoot "..\server\node_modules\@prisma\engines-version\package.json"
if (Test-Path $EnginesPkg) {
    $hash = (Get-Content $EnginesPkg -Raw | ConvertFrom-Json).prisma.enginesVersion
} else {
    # Fallback: commit hash observed in the deploy error log.
    $hash = "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}
Write-Host "Prisma engines commit: $hash" -ForegroundColor Green

$base = "https://binaries.prisma.sh/all_commits/$hash/linux-musl-openssl-3.0.x"

function DownloadGz([string]$url, [string]$outFile) {
    if (Test-Path $outFile) {
        Write-Host "  already have $(Split-Path $outFile -Leaf), skipping" -ForegroundColor DarkGray
        return
    }
    $gz = "$outFile.gz"
    Write-Host "  downloading $url"
    Invoke-WebRequest -Uri $url -OutFile $gz -UseBasicParsing
    # Ungzip
    $in  = [System.IO.File]::OpenRead($gz)
    $out = [System.IO.File]::Create($outFile)
    $gzs = New-Object System.IO.Compression.GzipStream($in, [System.IO.Compression.CompressionMode]::Decompress)
    $gzs.CopyTo($out)
    $gzs.Dispose(); $out.Dispose(); $in.Dispose()
    Remove-Item $gz
}

DownloadGz "$base/libquery_engine.so.node.gz" (Join-Path $OutDir "libquery_engine-linux-musl-openssl-3.0.x.so.node")
DownloadGz "$base/schema-engine.gz"          (Join-Path $OutDir "schema-engine-linux-musl-openssl-3.0.x")

Write-Host "Done. Engines saved in $OutDir" -ForegroundColor Green
Get-ChildItem $OutDir | Select-Object Name, Length | Format-Table
