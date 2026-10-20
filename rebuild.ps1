# Daily build: authoritative homepage partials + curated topics + SEO outputs.
# Git Bash: python tools/site/build_seo.py
param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3.12 tools/site/build_seo.py
  } else {
    python tools/site/build_seo.py
  }
  if ($LASTEXITCODE -ne 0) { throw "Site build failed ($LASTEXITCODE)" }
} finally {
  Pop-Location
}
