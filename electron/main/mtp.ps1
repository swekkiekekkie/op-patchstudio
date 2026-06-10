param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('status', 'pull', 'push')]
  [string]$Action,

  [string]$Dest = '',
  [string]$Src = ''
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Json($obj) {
  $json = $obj | ConvertTo-Json -Compress
  [Console]::Out.WriteLine($json)
}

function Find-OpxyDevice($computerItems) {
  foreach ($item in @($computerItems)) {
    if ($item.Name -match '(?i)^OP-XY$') { return $item }
  }
  foreach ($item in @($computerItems)) {
    if ($item.Name -match '(?i)OP-XY|Teenage') { return $item }
  }
  return $null
}

function Get-OpxyContentFolder($deviceItem) {
  $deviceFolder = $deviceItem.GetFolder()
  $children = @($deviceFolder.Items())

  $nested = $children | Where-Object { $_.Name -match '(?i)^OP-XY$' } | Select-Object -First 1
  if ($nested) {
    return $nested.GetFolder()
  }

  $hasContent = $children | Where-Object { $_.Name -in @('presets', 'samples', 'projects') }
  if ($hasContent) {
    return $deviceFolder
  }

  return $null
}

function Copy-MtpFolder($shell, $folder, $destPath) {
  New-Item -ItemType Directory -Path $destPath -Force | Out-Null
  $shell.NameSpace($destPath).CopyHere($folder, 0x14)
}

try {
  $shell = New-Object -ComObject Shell.Application
  $computer = $shell.NameSpace(0x11)
  if (-not $computer) {
    Write-Json @{ connected = $false; error = 'Shell namespace 0x11 unavailable' }
    exit 0
  }

  $device = Find-OpxyDevice $computer.Items()
  if (-not $device) {
    Write-Json @{ connected = $false; error = 'OP-XY not found - check USB and MTP mode' }
    exit 0
  }

  $rootFolder = Get-OpxyContentFolder $device
  if (-not $rootFolder) {
    Write-Json @{ connected = $false; deviceName = $device.Name; error = 'OP-XY storage folder not accessible' }
    exit 0
  }

  if ($Action -eq 'status') {
    Write-Json @{ connected = $true; deviceName = $device.Name }
    exit 0
  }

  if ($Action -eq 'push') {
    if (-not $Src) {
      Write-Json @{ connected = $true; ok = $false; error = 'Missing source cache path' }
      exit 1
    }
    $localPres = Join-Path $Src 'presets'
    $localSamp = Join-Path $Src 'samples'
    $pres = @($rootFolder.Items()) | Where-Object { $_.Name -eq 'presets' } | Select-Object -First 1
    $samp = @($rootFolder.Items()) | Where-Object { $_.Name -eq 'samples' } | Select-Object -First 1

    if ($pres -and (Test-Path $localPres)) {
      $localItems = $shell.NameSpace($localPres).Items()
      foreach ($item in @($localItems)) {
        $pres.GetFolder().CopyHere($item, 0x14)
      }
    }
    if ($samp -and (Test-Path $localSamp)) {
      $localItems = $shell.NameSpace($localSamp).Items()
      foreach ($item in @($localItems)) {
        $samp.GetFolder().CopyHere($item, 0x14)
      }
    }

    Start-Sleep -Seconds 20
    Write-Json @{ connected = $true; ok = $true; deviceName = $device.Name }
    exit 0
  }

  if (-not $Dest) {
    Write-Json @{ connected = $true; ok = $false; error = 'Missing destination path' }
    exit 1
  }

  New-Item -ItemType Directory -Path $Dest -Force | Out-Null

  $pres = @($rootFolder.Items()) | Where-Object { $_.Name -eq 'presets' } | Select-Object -First 1
  $samp = @($rootFolder.Items()) | Where-Object { $_.Name -eq 'samples' } | Select-Object -First 1

  if ($pres) { Copy-MtpFolder $shell ($pres.GetFolder()) (Join-Path $Dest 'presets') }
  if ($samp) { Copy-MtpFolder $shell ($samp.GetFolder()) (Join-Path $Dest 'samples') }
  $proj = @($rootFolder.Items()) | Where-Object { $_.Name -eq 'projects' } | Select-Object -First 1
  if ($proj) { Copy-MtpFolder $shell ($proj.GetFolder()) (Join-Path $Dest 'projects') }

  # CopyHere is async
  Start-Sleep -Seconds 15

  Write-Json @{ connected = $true; ok = $true; deviceName = $device.Name }
}
catch {
  Write-Json @{ connected = $false; ok = $false; error = $_.Exception.Message }
  exit 1
}
