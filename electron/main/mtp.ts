import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function runMtpScript(action: 'status' | 'pull', dest: string): string {
  const script = `
$ErrorActionPreference = 'Stop'
$Action = '${action}'
$Dest = ${JSON.stringify(dest)}
$shell = New-Object -ComObject Shell.Application
$computer = $shell.NameSpace(0x11)
$opxy = ($computer.Items() | Where-Object { $_.Name -eq 'OP-XY' })
if (-not $opxy) { Write-Output '{"connected":false}'; exit 0 }
$rootItem = ($opxy.GetFolder().Items() | Where-Object { $_.Name -eq 'OP-XY' })
if (-not $rootItem) { Write-Output '{"connected":false}'; exit 0 }
$rootFolder = $rootItem.GetFolder()

if ($Action -eq 'status') {
  Write-Output '{"connected":true,"deviceName":"OP-XY"}'
  exit 0
}

function Copy-Folder($folder, $destPath) {
  New-Item -ItemType Directory -Path $destPath -Force | Out-Null
  $shell.NameSpace($destPath).CopyHere($folder, 0x14)
}

$pres = ($rootFolder.Items() | Where-Object { $_.Name -eq 'presets' })
$samp = ($rootFolder.Items() | Where-Object { $_.Name -eq 'samples' })
if ($pres) { Copy-Folder ($pres.GetFolder()) (Join-Path $Dest 'presets') }
if ($samp) { Copy-Folder ($samp.GetFolder()) (Join-Path $Dest 'samples') }
Start-Sleep -Seconds 10
Write-Output '{"connected":true,"ok":true}'
`;

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 180_000 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || `PowerShell exit ${result.status}`);
  }
  return result.stdout ?? '';
}

export function mtpStatus(): { connected: boolean; deviceName?: string } {
  try {
    return JSON.parse(runMtpScript('status', '').trim() || '{}');
  } catch {
    return { connected: false };
  }
}

export function mtpPull(dest: string): { ok: boolean; error?: string } {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  try {
    const parsed = JSON.parse(runMtpScript('pull', dest).trim() || '{}');
    if (!parsed.ok) return { ok: false, error: 'MTP pull failed' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function countCacheEntries(cacheRoot: string): { presetCount: number; sampleCount: number } {
  let presetCount = 0;
  let sampleCount = 0;
  const presetsRoot = path.join(cacheRoot, 'presets');
  const samplesRoot = path.join(cacheRoot, 'samples', 'user');

  if (fs.existsSync(presetsRoot)) {
    for (const dir of walkDirs(presetsRoot)) {
      if (dir.endsWith('.preset') && fs.existsSync(path.join(dir, 'patch.json'))) presetCount++;
    }
  }
  if (fs.existsSync(samplesRoot)) {
    for (const f of fs.readdirSync(samplesRoot)) {
      if (/\.(wav|aif|aiff)$/i.test(f)) sampleCount++;
    }
  }
  return { presetCount, sampleCount };
}

function* walkDirs(root: string): Generator<string> {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield full;
      yield* walkDirs(full);
    }
  }
}
