# Full deterministic build: cinema bundle, authoritative pages, SEO outputs
# (delegated to tools/site/build_seo.py),
# preserved Digital Lab bundle, and Cyanoflow game bundle.
param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Site build failed ($LASTEXITCODE)" }
} finally {
  Pop-Location
}
