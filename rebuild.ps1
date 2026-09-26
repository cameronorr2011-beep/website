# ============================================================
#  Algaephyte - Orr Biologicals
#  Modular rebuild script
#  Assembles index.html from the modular parts:
#    sections/head.html  -> document head (SEO metadata lives here)
#    sections/*.html     -> body sections (verbatim)
#    css/*.css           -> stylesheet links (ordered)
#    js/*.js             -> deferred scripts (fixed order)
#
#  This is the DAILY rebuild tool. It does not need the legacy
#  single-file source (NEW 67.html). build.ps1 remains the
#  legacy "split from original + rebuild" tool for when the
#  original single file is available again.
#
#  Usage:
#    powershell -File rebuild.ps1
# ============================================================
param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$utf8 = [System.Text.UTF8Encoding]::new($false)
function ReadUtf8([string]$p){ return [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }
function WriteUtf8([string]$p, [string]$t){
  $dir = Split-Path -Parent $p
  if(!(Test-Path -LiteralPath $dir)){ [void](New-Item -ItemType Directory -Path $dir -Force) }
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  if(-not $Quiet){ Write-Host ('  wrote  ' + $p) }
}
function Out-Log([string]$m){ if(-not $Quiet){ Write-Host $m } }

$nl = "`r`n"

# ------------------------------------------------------------
# 1. Head - from sections/head.html (SEO single source of truth)
# ------------------------------------------------------------
Out-Log "=== Algaephyte modular rebuild ==="
$headPartial = Join-Path $root 'sections/head.html'
if(-not (Test-Path -LiteralPath $headPartial)){ throw "Missing sections/head.html - cannot rebuild the document head." }
$head = (ReadUtf8 $headPartial).TrimEnd()
Out-Log "  head from sections/head.html ($($head.Length) chars)"

# ------------------------------------------------------------
# 2. Stylesheet order (must match build.ps1 cssMarkers order)
# ------------------------------------------------------------
$cssFiles = @(
  'global.css','header.css','hero.css','ticker.css','dashboard.css',
  'stack.css','system.css','signals.css','safety.css','mesh.css',
  'instrument.css','impact.css','accordions.css','journal.css',
  'deploy.css','footer.css','animations.css','extras.css'
)
foreach($c in $cssFiles){
  if(-not (Test-Path -LiteralPath (Join-Path $root ('css/' + $c)))){ throw "Missing stylesheet: css/$c" }
}
$cssLines = ($cssFiles | ForEach-Object { '  <link rel="stylesheet" href="css/' + $_ + '">' }) -join $nl

# ------------------------------------------------------------
# 3. Body sections (order must match build.ps1 bodySections)
# ------------------------------------------------------------
$bodyFiles = @(
  'sections/header.html','sections/hero.html','sections/ticker.html',
  'sections/simulation.html','sections/products.html','sections/stack.html',
  'sections/system.html','sections/signals.html','sections/twin.html',
  'sections/safety.html','sections/mesh.html','sections/instrument.html',
  'sections/impact.html','sections/journal.html','sections/faults.html',
  'sections/faq.html','sections/deploy.html','sections/footer.html'
)
$sectionTexts = @()
foreach($f in $bodyFiles){
  $p = Join-Path $root $f
  if(-not (Test-Path -LiteralPath $p)){ throw "Missing section: $f" }
  $sectionTexts += (ReadUtf8 $p)
}
if($sectionTexts.Count -ne 18){ throw "Expected 18 body sections, found $($sectionTexts.Count)" }

# ------------------------------------------------------------
# 4. Scripts (fixed order, classic defer for file:// support)
# ------------------------------------------------------------
$scripts = '  <script defer src="js/simulator.js"></script>'      + $nl +
           '  <script defer src="js/site.js"></script>'          + $nl +
           '  <script defer src="js/main-dashboard.js"></script>'+ $nl +
           '  <script defer src="js/navigation.js"></script>'    + $nl +
           '  <script defer src="js/animations.js"></script>'
foreach($j in @('simulator.js','site.js','main-dashboard.js','navigation.js','animations.js')){
  if(-not (Test-Path -LiteralPath (Join-Path $root ('js/' + $j)))){ throw "Missing script: js/$j" }
}
# ------------------------------------------------------------
# 5. Assemble index.html (identical layout logic to build.ps1)
# ------------------------------------------------------------
Out-Log "  assembling index.html..."
$index = $head + $nl + $nl +
  $cssLines + $nl +
  '</head>' + $nl + '<body>' + $nl +
  '  <a class="skip" href="#main">Skip to content</a>' + $nl + $nl +
  $sectionTexts[0].TrimEnd() + $nl + $nl +
  '  <main id="main">' + $nl
for($di = 1; $di -le 16; $di++){
  $index += $sectionTexts[$di].TrimEnd()
  if($di -lt 15){ $index += $nl }
}
$index += $nl +
  '  </main>' + $nl + $nl +
  $sectionTexts[17].TrimEnd() + $nl + $nl +
  $scripts + $nl +
  '</body>' + $nl +
  '</html>' + $nl

WriteUtf8 (Join-Path $root 'index.html') $index
Out-Log ("  index.html written (" + $index.Length + " chars)")

# ------------------------------------------------------------
# 6. Verification
# ------------------------------------------------------------
Out-Log "6. Verification"
$idxText = ReadUtf8 (Join-Path $root 'index.html')

# 6a. every stylesheet and script must be linked
foreach($c in $cssFiles){
  if(-not $idxText.Contains('href="css/' + $c + '"')){ throw "index.html is missing stylesheet link: css/$c" }
}
foreach($j in @('simulator.js','site.js','main-dashboard.js','navigation.js','animations.js')){
  if(-not $idxText.Contains('src="js/' + $j + '"')){ throw "index.html is missing script link: js/$j" }
}
Out-Log ("  css + js links verified (" + $cssFiles.Count + " stylesheets, 5 scripts)")

# 6b. no embedded data URIs may leak into the public page
if($idxText -match 'data:image'){ throw "index.html still contains an embedded data URI!" }
Out-Log "  no embedded data URIs"

# 6c. every local asset reference resolves to a file on disk
$assetRx = [regex]'href="([^"#][^"]*)"|src="([^"#][^"]*)"'
$checked = @{}
$missing = @()
foreach($mm in $assetRx.Matches($idxText)){
  $v = $null
  if($mm.Groups[1].Success){ $v = $mm.Groups[1].Value }
  elseif($mm.Groups[2].Success){ $v = $mm.Groups[2].Value }
  if([string]::IsNullOrEmpty($v)){ continue }
  if($v -match '^(https?://|//|mailto:|tel:|javascript:)'){ continue }
  if($v.StartsWith('#')){ continue }
  if($checked.ContainsKey($v)){ continue }
  $checked[$v] = $true
  $candidate = $v.Split([char[]]@('?','#'))[0]
  $fp = Join-Path $root $candidate
  if(-not (Test-Path -LiteralPath $fp) -and -not (Test-Path -LiteralPath ($fp + '.html'))){ $missing += $v }
}
if($missing.Count -gt 0){ throw ("index.html references missing files: " + ($missing -join ', ')) }
Out-Log ("  asset references resolve (" + $checked.Count + " unique refs)")

# 6d. every in-page anchor target (#id) must exist as an id on the page
$idRx     = [regex]'id="([^"]+)"'
$anchorRx = [regex]'href="#([^"]+)"'
$ids = @{}
foreach($idm in $idRx.Matches($idxText)){ $ids[$idm.Groups[1].Value] = $true }
$broken = @()
foreach($am in $anchorRx.Matches($idxText)){
  if(-not $ids.ContainsKey($am.Groups[1].Value)){ $broken += ('#' + $am.Groups[1].Value) }
}
if($broken.Count -gt 0){ throw ("index.html has anchors without targets: " + ($broken -join ', ')) }
Out-Log ("  anchor targets verified (" + $ids.Count + " ids, " + $anchorRx.Matches($idxText).Count + " anchors)")

# 6e. required SEO tags must be present (see docs/SEO.md)
$requiredSeo = @(
  '<link rel="canonical"',
  'property="og:title"', 'property="og:description"', 'property="og:type"',
  'property="og:url"', 'property="og:image"', 'property="og:site_name"',
  'name="twitter:card"', 'name="twitter:title"', 'name="twitter:image"',
  'application/ld+json', 'name="description"'
)
foreach($tag in $requiredSeo){
  if(-not $idxText.Contains($tag)){ throw "index.html is missing required SEO tag: $tag" }
}
Out-Log "  required SEO tags present"

Out-Log "=== Rebuild complete ==="