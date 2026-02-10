Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$postsDir = Join-Path $PSScriptRoot "posts"
if(!(Test-Path -LiteralPath $postsDir)){ throw ("MISSING_DIR=" + $postsDir) }

$bad = New-Object System.Collections.Generic.List[string]

Get-ChildItem -LiteralPath $postsDir -Filter "*.md" | ForEach-Object {
  $p = $_.FullName
  $t = Get-Content -LiteralPath $p -Raw -Encoding UTF8

  if($t -match "Amazon UK search:"){
    $bad.Add("PLACEHOLDER " + $p) | Out-Null
  }

  $m = [regex]::Matches($t, "/dp/([A-Z0-9]{10})")
  if($m.Count -lt 1){
    $bad.Add("NO_DP_LINKS " + $p) | Out-Null
  }
}

if($bad.Count -gt 0){
  $bad | ForEach-Object { Write-Output $_ }
  throw ("INTEGRITY_FAIL count=" + $bad.Count)
}

Write-Output "INTEGRITY_PASS_ALL_POSTS"
