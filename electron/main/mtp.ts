import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const scriptPath = path.join(__dirname, 'mtp.ps1');

export interface MtpStatusResult {
  connected: boolean;
  deviceName?: string;
  error?: string;
}

export interface MtpPullResult {
  ok: boolean;
  error?: string;
  deviceName?: string;
}

export interface MtpPushResult {
  ok: boolean;
  error?: string;
  deviceName?: string;
}

function runMtpScript(
  action: 'status' | 'pull' | 'push',
  opts: { dest?: string; src?: string } = {},
): { ok: boolean; data?: Record<string, unknown>; error?: string } {
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, error: `MTP script missing: ${scriptPath}` };
  }

  const args = [
    '-STA',
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-Action',
    action,
  ];
  if (action === 'pull') args.push('-Dest', opts.dest ?? '');
  if (action === 'push') args.push('-Src', opts.src ?? '');

  const timeout = action === 'push' ? 300_000 : 180_000;

  const result = spawnSync('powershell.exe', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout,
    windowsHide: true,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  const raw = (result.stdout ?? '').trim().replace(/^\uFEFF/, '');
  if (!raw) {
    const stderr = result.stderr?.trim();
    return {
      ok: false,
      error: stderr || `PowerShell produced no output (exit ${result.status ?? 'unknown'})`,
    };
  }

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (result.status !== 0 && !data.error) {
      return { ok: false, data, error: `PowerShell exit ${result.status}` };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: `Invalid JSON from MTP script: ${raw.slice(0, 200)}` };
  }
}

export function mtpStatus(): MtpStatusResult {
  const result = runMtpScript('status');
  if (!result.ok || !result.data) {
    return { connected: false, error: result.error ?? 'MTP status check failed' };
  }

  return {
    connected: Boolean(result.data.connected),
    deviceName: typeof result.data.deviceName === 'string' ? result.data.deviceName : undefined,
    error: typeof result.data.error === 'string' ? result.data.error : undefined,
  };
}

export function mtpPull(dest: string): MtpPullResult {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  const result = runMtpScript('pull', { dest });
  if (!result.ok || !result.data) {
    return { ok: false, error: result.error ?? 'MTP pull failed' };
  }

  if (!result.data.ok) {
    return {
      ok: false,
      error: typeof result.data.error === 'string' ? result.data.error : 'MTP pull failed',
    };
  }

  return { ok: true, deviceName: typeof result.data.deviceName === 'string' ? result.data.deviceName : undefined };
}

export function mtpPush(src: string): MtpPushResult {
  if (!fs.existsSync(src)) {
    return { ok: false, error: 'Cache folder not found' };
  }

  const result = runMtpScript('push', { src });
  if (!result.ok || !result.data) {
    return { ok: false, error: result.error ?? 'MTP push failed' };
  }

  if (!result.data.ok) {
    return {
      ok: false,
      error: typeof result.data.error === 'string' ? result.data.error : 'MTP push failed',
    };
  }

  return { ok: true, deviceName: typeof result.data.deviceName === 'string' ? result.data.deviceName : undefined };
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
