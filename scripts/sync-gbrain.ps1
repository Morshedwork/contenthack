# Sync GBrain for ContentOps AI (Windows)
# Usage: .\scripts\sync-gbrain.ps1
# Requires OPENAI_API_KEY in user env for embeddings (optional: use -NoEmbed)

param(
    [switch]$NoEmbed,
    [switch]$Full
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:PATH = "$Root\scripts;$env:APPDATA\npm;$env:USERPROFILE\.bun\bin;$env:PATH"

Set-Location $Root

Write-Host "GBrain sync for contenthack (ContentOps AI)..." -ForegroundColor Cyan

$args = @("sync", "--source", "contenthack", "--strategy", "code")
if ($NoEmbed) { $args += "--no-embed" }
if ($Full) { $args += "--full" }

& "$Root\scripts\gbrain.cmd" @args

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDone. Source pinned via .gbrain-source -> contenthack" -ForegroundColor Green
    Write-Host "Try: gbrain search `"auth login`" --source contenthack"
} else {
    exit $LASTEXITCODE
}
