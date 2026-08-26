# ============================================================
#  Algaephyte — Orr Biologicals
#  Modular rebuild script
#  Splits the original single-file build (NEW 67.html) into
#  sections/, css/, js/ and assets/, and rebuilds index.html.
#
#  Usage:
#    powershell -File build.ps1
#    powershell -File build.ps1 -Source "..\NEW 67.html"
# ============================================================
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\NEW 67.html'),
  [switch]$Quiet
)
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

if(-not (Test-Path -LiteralPath $Source)){ throw "Source file not found: $Source" }

$nl = "`r`n"
$raw = ReadUtf8 $Source
$lines = $raw -split "`r`n"

function SliceLines([int]$from, [int]$to){   # 1-based inclusive
  if($from -lt 1 -or $to -gt $lines.Count){ throw "Slice out of range: $from..$to" }
  return (($lines[($from-1)..($to-1)]) -join $nl)
}

function SlicePos([string]$text, [string]$fromMark, [string]$toMark){
  if($null -eq $fromMark -or $fromMark -eq '' -or $fromMark -eq 'START'){ $i = 0 } else {
    $i = $text.IndexOf($fromMark)
    if($i -lt 0){ throw "Opening marker not found: '$fromMark'" }
  }
  if($null -eq $toMark -or $toMark -eq '' -or $toMark -eq 'END'){ $j = $text.Length } else {
    $j = $text.IndexOf($toMark, $i)
    if($j -lt 0){ throw "Closing marker not found: '$toMark'" }
  }
  return $text.Substring($i, $j - $i)
}

Out-Log "=== Algaephyte split / rebuild ==="
Out-Log ("source: " + $Source) + ("")
Out-Log ("source lines: " + $lines.Count)

# ------------------------------------------------------------
# 1. Images — decode the four embedded base64 JPEGs to assets/
# ------------------------------------------------------------
Out-Log "1. Extracting embedded images"
$imgSpecs = @(
  @{ Line = 352; Out = 'assets/images/hero.jpg'                    },
  @{ Line = 389; Out = 'assets/images/microscopy/sim-field.jpg'    },
  @{ Line = 484; Out = 'assets/images/microscopy/bench-photo.jpg'  },
  @{ Line = 582; Out = 'assets/images/instrument-photo.jpg'        }
)
$imgFullRegex = [regex]'data:image/jpeg;base64,[A-Za-z0-9+/=]+'
$imgDataRegex = [regex]'data:image/jpeg;base64,([A-Za-z0-9+/=]+)'
foreach($spec in $imgSpecs){
  $m = $imgDataRegex.Match($lines[$spec.Line - 1])
  if(-not $m.Success){ throw ("Image data not found on line " + $spec.Line) }
  $bytes = [System.Convert]::FromBase64String($m.Groups[1].Value)
  $dest = Join-Path $root $spec.Out
  $dir = Split-Path -Parent $dest
  if(!(Test-Path -LiteralPath $dir)){ [void](New-Item -ItemType Directory -Path $dir -Force) }
  [System.IO.File]::WriteAllBytes($dest, $bytes)
  if(-not $Quiet){ Write-Host ('  image  ' + $spec.Out + '  (' + $bytes.Length + ' bytes)') }
}
# ------------------------------------------------------------
# 2. CSS — split the style block (original L16..L310)
# ------------------------------------------------------------
Out-Log "2. Splitting CSS -> css/*.css"
$cssText = SliceLines 16 310
$cssMarkers = @(
  @{ File = 'css/global.css';     From = 'START' ; To = '/* ---------- nav ---------- */' },
  @{ File = 'css/header.css';     From = '/* ---------- nav ---------- */' ; To = '/* ---------- hero ---------- */' },
  @{ File = 'css/hero.css';       From = '/* ---------- hero ---------- */' ; To = '/* ---------- ticker ---------- */' },
  @{ File = 'css/ticker.css';     From = '/* ---------- ticker ---------- */' ; To = '/* ---------- simulation ---------- */' },
  @{ File = 'css/dashboard.css';  From = '/* ---------- simulation ---------- */' ; To = '/* ---------- stack ---------- */' },
  @{ File = 'css/stack.css';      From = '/* ---------- stack ---------- */' ; To = '/* ---------- loop grid ---------- */' },
  @{ File = 'css/system.css';     From = '/* ---------- loop grid ---------- */' ; To = '/* ---------- signals ---------- */' },
  @{ File = 'css/signals.css';    From = '/* ---------- signals ---------- */' ; To = '/* ---------- safety ---------- */' },
  @{ File = 'css/safety.css';     From = '/* ---------- safety ---------- */' ; To = '/* ---------- mesh ---------- */' },
  @{ File = 'css/mesh.css';       From = '/* ---------- mesh ---------- */' ; To = '/* ---------- instrument ---------- */' },
  @{ File = 'css/instrument.css'; From = '/* ---------- instrument ---------- */' ; To = '/* ---------- impact ---------- */' },
  @{ File = 'css/impact.css';     From = '/* ---------- impact ---------- */' ; To = '/* ---------- accordions (faq / issues) ---------- */' },
  @{ File = 'css/accordions.css'; From = '/* ---------- accordions (faq / issues) ---------- */' ; To = '/* ---------- journal ---------- */' },
  @{ File = 'css/journal.css';    From = '/* ---------- journal ---------- */' ; To = '/* ---------- deploy form ---------- */' },
  @{ File = 'css/deploy.css';     From = '/* ---------- deploy form ---------- */' ; To = '/* ---------- footer ---------- */' },
  @{ File = 'css/footer.css';     From = '/* ---------- footer ---------- */' ; To = '/* ---------- reveal ---------- */' },
  @{ File = 'css/animations.css'; From = '/* ---------- reveal ---------- */' ; To = 'END' }
)
$cssPieces = @()
$cssFileList = @()
foreach($cm in $cssMarkers){
  $piece = SlicePos $cssText $cm.From $cm.To
  $cssPieces += $piece
  $cssFileList += $cm.File
  WriteUtf8 (Join-Path $root $cm.File) $piece
}
$rejoined = ($cssPieces -join '')
if($rejoined -ne $cssText){ throw "CSS split mismatch — content lost or duplicated!" }
else { Out-Log ("  css integrity OK (" + $cssText.Length + " chars across " + $cssMarkers.Count + " files)") }
# ------------------------------------------------------------
# 3. JavaScript — split the script block (original L715..L1422)
# ------------------------------------------------------------
Out-Log "3. Splitting JS -> js/*.js"
$jsText = SliceLines 715 1422

# one contiguous piece per original region, in original order
$jp = @{
  boot     = SlicePos $jsText 'START'  '/* ---------- data ---------- */'
  data     = SlicePos $jsText '/* ---------- data ---------- */' '/* ---------- sim model (ported from the build) ---------- */'
  model    = SlicePos $jsText '/* ---------- sim model (ported from the build) ---------- */' '/* wordmark */'
  content  = SlicePos $jsText '/* wordmark */' '/* ---------- living simulation wiring ---------- */'
  simWiring= SlicePos $jsText '/* ---------- living simulation wiring ---------- */' '/* ---------- count up ---------- */'
  scroll   = SlicePos $jsText '/* ---------- count up ---------- */' '/* ---------- nav state ---------- */'
  nav      = SlicePos $jsText '/* ---------- nav state ---------- */' '/* ---------- atmosphere particles (bubbles / helices / specks) ---------- */'
  atmos    = SlicePos $jsText '/* ---------- atmosphere particles (bubbles / helices / specks) ---------- */' '/* ---------- live culture chamber render (ported CultureSim) ---------- */'
  chamber  = SlicePos $jsText '/* ---------- live culture chamber render (ported CultureSim) ---------- */' '/* ---------- hero / instrument parallax ---------- */'
  parallax = SlicePos $jsText '/* ---------- hero / instrument parallax ---------- */' 'END'
}
$jpOrder = @('boot','data','model','content','simWiring','scroll','nav','atmos','chamber','parallax')
$seq = ''
foreach($k in $jpOrder){ $seq += $jp[$k] }
if($seq -ne $jsText){ throw "JS split mismatch — content lost or duplicated!" }
else { Out-Log ("  js integrity OK (" + $jsText.Length + " chars)") }

$strict = "`"use strict`";" + $nl
$jsFiles = @{
  'js/simulator.js'      = $jp.boot + $jp.model
  'js/site.js'           = $strict + $jp.data + $jp.content
  'js/main-dashboard.js' = $strict + $jp.simWiring + $jp.chamber
  'js/navigation.js'     = $strict + $jp.nav
  'js/animations.js'     = $strict + $jp.scroll + $jp.atmos + $jp.parallax
}
foreach($k in $jsFiles.Keys){
  WriteUtf8 (Join-Path $root $k) $jsFiles[$k]
}
# ------------------------------------------------------------
# 4. HTML sections — slice <body> into sections/*.html
#    Embedded image srcs are rewritten to assets/ paths.
# ------------------------------------------------------------
Out-Log "4. Splitting HTML body -> sections/*.html"
$bodySections = @(
  @{ File = 'sections/header.html';    From = 316; To = 347; Img = $null },
  @{ File = 'sections/hero.html';      From = 350; To = 369; Img = 'assets/images/hero.jpg' },
  @{ File = 'sections/ticker.html';    From = 371; To = 374; Img = '' },
  @{ File = 'sections/simulation.html';From = 376; To = 439; Img = 'assets/images/microscopy/sim-field.jpg' },
  @{ File = 'sections/stack.html';     From = 441; To = 459; Img = '' },
  @{ File = 'sections/system.html';    From = 461; To = 500; Img = 'assets/images/microscopy/bench-photo.jpg' },
  @{ File = 'sections/signals.html';   From = 502; To = 512; Img = '' },
  @{ File = 'sections/twin.html';      From = 514; To = 536; Img = '' },
  @{ File = 'sections/safety.html';    From = 538; To = 554; Img = '' },
  @{ File = 'sections/mesh.html';      From = 556; To = 578; Img = '' },
  @{ File = 'sections/instrument.html';From = 580; To = 594; Img = 'assets/images/instrument-photo.jpg' },
  @{ File = 'sections/impact.html';    From = 596; To = 615; Img = '' },
  @{ File = 'sections/journal.html';   From = 617; To = 629; Img = '' },
  @{ File = 'sections/faults.html';    From = 631; To = 641; Img = '' },
  @{ File = 'sections/faq.html';       From = 643; To = 652; Img = '' },
  @{ File = 'sections/deploy.html';    From = 654; To = 670; Img = '' },
  @{ File = 'sections/footer.html';    From = 673; To = 712; Img = '' }
)
$sectionTexts = @()
foreach($sec in $bodySections){
  $t = SliceLines $sec.From $sec.To
  if($sec.Img){
    $t = $imgFullRegex.Replace($t, $sec.Img)
  }
  $sectionTexts += $t
  WriteUtf8 (Join-Path $root $sec.File) $t
}
# ------------------------------------------------------------
# 5. Assemble index.html
# ------------------------------------------------------------
Out-Log "5. Assembling index.html"
$head      = (SliceLines 1 14).TrimEnd()
$cssLines  = ($cssFileList | ForEach-Object { '  <link rel="stylesheet" href="' + $_ + '">' }) -join $nl
$scripts   = '  <script defer src="js/simulator.js"></script>'      + $nl +
             '  <script defer src="js/site.js"></script>'          + $nl +
             '  <script defer src="js/main-dashboard.js"></script>'+ $nl +
             '  <script defer src="js/navigation.js"></script>'    + $nl +
             '  <script defer src="js/animations.js"></script>'

$index = $head + $nl + $nl +
  $cssLines + $nl +
  '</head>' + $nl + '<body>' + $nl +
  '  <a class="skip" href="#main">Skip to content</a>' + $nl + $nl +
  $sectionTexts[0].TrimEnd() + $nl + $nl +
  '  <main id="main">' + $nl
for($di = 1; $di -le 15; $di++){
  $index += $sectionTexts[$di].TrimEnd()
  if($di -lt 15){ $index += $nl }
}
$index += $nl +
  '  </main>' + $nl + $nl +
  $sectionTexts[16].TrimEnd() + $nl + $nl +
  $scripts + $nl +
  '</body>' + $nl +
  '</html>' + $nl

WriteUtf8 (Join-Path $root 'index.html') $index
Out-Log ("  index.html written (" + $index.Length + " chars)")
# ------------------------------------------------------------
# 6. Verification
# ------------------------------------------------------------
Out-Log "6. Verification"
$imgMask = [regex]'data:image/jpeg;base64,[A-Za-z0-9+/=]+'

# 6a. decoded JPEGs are valid JPEG (magic bytes FF D8 FF)
foreach($spec in $imgSpecs){
  $b = [System.IO.File]::ReadAllBytes((Join-Path $root $spec.Out))
  if($b.Length -lt 4 -or $b[0] -ne 0xFF -or $b[1] -ne 0xD8 -or $b[2] -ne 0xFF){
    throw ("Decoded image is not a valid JPEG: " + $spec.Out)
  }
}
Out-Log "  4 JPEGs decoded OK"

# 2. every section partial must exist verbatim inside the original body
$origMain  = (SliceLines 314 713)  # body open .. footer close
$origMainM = $imgMask.Replace($origMain, '__IMG__')
foreach($sec in $bodySections){
  $t = ReadUtf8 (Join-Path $root $sec.File)
  if($sec.Img){
    $t = $t.Replace($sec.Img, '__IMG__')
  }
  $needle = ($t -replace "`r","") -replace "`n",""
  $hay    = $origMainM  -replace "`r",""  -replace "`n",""
  if(-not $hay.Contains($needle)){
    throw "Section partial not found verbatim in original body: " + $sec.File
  }
}
Out-Log "  17 section partials verified verbatim against the original"

# 3. index.html must not contain any embedded data URI
$idxText = ReadUtf8 (Join-Path $root 'index.html')
if($idxText -match 'data:image'){ throw "index.html still contains an embedded data URI!" }
if(-not $idxText.Contains('assets/images/hero.jpg')){ throw "index.html is missing the hero image reference" }

# 3b. every stylesheet and script must be linked in index.html
foreach($cm in $cssMarkers){
  $need = 'href="' + $cm.File + '"'
  if(-not $idxText.Contains($need)){ throw "index.html is missing stylesheet link: $($cm.File)" }
}
foreach($jsn in @('simulator.js','site.js','main-dashboard.js','navigation.js','animations.js')){
  if(-not $idxText.Contains('src="js/' + $jsn + '"')){ throw "index.html is missing script link: js/$jsn" }
}
Out-Log ("  css + js links verified (" + $cssMarkers.Count + " stylesheets, 5 scripts)")

# 4. all four image references resolve to files that exist
foreach($spec in $imgSpecs){
  if(-not (Test-Path -LiteralPath (Join-Path $root $spec.Out))){ throw "Image missing: " + $spec.Out }
}
Out-Log "  index.html OK (no embedded images; asset refs resolve)"

# 5. URL inventory: every href/src in index.html must equal one from the original
$origUrlRx  = [regex]'href="([^"#][^"]*)"|src="([^"#][^"]*)"'
$newUrlRx   = [regex]'href="(?:[^"#][^"]*)"|src="(?:[^"#][^"]*)"'
$origUrls = @{}
foreach($mm in $origUrlRx.Matches($raw)){
  if($mm.Groups[1].Success){ $origUrls[$mm.Groups[1].Value] = $true }
  if($mm.Groups[2].Success){ $origUrls[$mm.Groups[2].Value] = $true }
}
$newUrls = @{}
foreach($mm in $newUrlRx.Matches($idxText)){
  $v = $mm.Value -replace '^(href|src)="','' -replace '"$',''
  $newUrls[$v] = $true
}
$extra = @($newUrls.Keys | Where-Object { -not $origUrls.ContainsKey($_) -and $_ -notlike 'css/*' -and $_ -notlike 'js/*' -and $_ -notlike 'assets/*' })
if($extra.Count -gt 0){ throw ("index.html contains URLs not in the original: " + ($extra -join ', ')) }
Out-Log ("  URL inventory OK (" + $newUrls.Count + " unique hrefs/srcs)")

Out-Log "=== Build complete ==="