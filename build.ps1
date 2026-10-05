# Compatibility entrypoint. Legacy source splitting has been retired because
# it overwrites modern CSS, JavaScript, disclosures and homepage metadata.
param([string]$Source, [switch]$Quiet)
$ErrorActionPreference = 'Stop'
if ($Source) { throw "Legacy import is retired. Edit sections/head.html and sections/home-body.html instead." }
& (Join-Path $PSScriptRoot 'rebuild.ps1') -Quiet:$Quiet
