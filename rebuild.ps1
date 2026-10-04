# Daily build: authoritative homepage partials + curated topics + SEO outputs.
# Git Bash: python tools/site/build_seo.py
param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  python tools/site/build_seo.py
  if ($LASTEXITCODE -ne 0) { throw "Site build failed ($LASTEXITCODE)" }
} finally {
  Pop-Location
}
