$ErrorActionPreference = 'Continue'
$shell = New-Object -ComObject Shell.Application
$computer = $shell.NameSpace(0x11)
Write-Host '=== My Computer (0x11) items ==='
foreach ($item in $computer.Items()) {
  Write-Host ("  [{0}] path={1}" -f $item.Name, $item.Path)
  if ($item.Name -match 'OP|XY|Teenage|Portable|Engineering') {
    try {
      $folder = $item.GetFolder()
      Write-Host '    children:'
      foreach ($child in $folder.Items()) {
        Write-Host ("      - {0}" -f $child.Name)
      }
    } catch {
      Write-Host ("    err: {0}" -f $_)
    }
  }
}

Write-Host ''
Write-Host '=== Also check 0x10 (This PC alternate) ==='
try {
  $pc = $shell.NameSpace(0x10)
  foreach ($item in $pc.Items()) {
    if ($item.Name -match 'OP|XY|Teenage|Portable') {
      Write-Host ("  [{0}]" -f $item.Name)
    }
  }
} catch {
  Write-Host "  0x10 failed: $_"
}
