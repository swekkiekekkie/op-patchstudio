import { useCallback, useEffect, useState } from 'react';
import { Button, InlineLoading, Tag, Tile } from '@carbon/react';
import type { BackupEntry, CachePresetEntry, DeviceStatus } from '../../types/opxy';

export function DevicePage() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [presets, setPresets] = useState<CachePresetEntry[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.opxy) {
      const inBrowser = typeof navigator !== 'undefined' && !navigator.userAgent.includes('Electron');
      setStatus({
        connected: false,
        deviceName: null,
        cacheRoot: '',
        lastPullAt: null,
        error: inBrowser
          ? 'Opened in a browser — use the Electron window from npm run dev'
          : 'App bridge unavailable — quit and run npm run dev again',
      });
      return;
    }
    const s = await window.opxy.device.status();
    setStatus(s);
    if ((s.presetCount ?? 0) > 0 || (s.sampleCount ?? 0) > 0) {
      setPresets(await window.opxy.device.listPresets());
    } else {
      setPresets([]);
    }
    setBackups(await window.opxy.device.listBackups());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePull = async () => {
    if (!window.opxy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.opxy.device.pull();
      if (!result.ok) {
        setMessage(result.error ?? 'Pull failed');
      } else {
        setMessage(`Pulled ${result.presetCount ?? 0} presets, ${result.sampleCount ?? 0} standalone samples`);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleBackup = async () => {
    if (!window.opxy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.opxy.device.backup();
      if (!result.ok) {
        setMessage(result.error ?? 'Backup failed');
      } else {
        setMessage(
          `Backup saved — ${result.presetCount ?? 0} presets, ${result.sampleCount ?? 0} samples`,
        );
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const samplePresets = presets.filter((p) => p.sampleBased);
  const cacheReady = (status?.presetCount ?? 0) > 0 || (status?.sampleCount ?? 0) > 0;

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0, fontWeight: 500 }}>OP-XY device</h2>

      <Tile style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag type={status?.connected ? 'green' : 'gray'}>
            {status?.connected ? 'connected' : 'not connected'}
          </Tag>
          {status?.deviceName && (
            <span style={{ fontSize: '0.85rem' }}>{status.deviceName}</span>
          )}
          {cacheReady && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              cache: {status?.presetCount ?? 0} presets, {status?.sampleCount ?? 0} samples
            </span>
          )}
          {status?.lastPullAt && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              last pull: {new Date(status.lastPullAt).toLocaleString()}
            </span>
          )}
          {status?.lastBackupAt && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              last backup: {new Date(status.lastBackupAt).toLocaleString()}
            </span>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={handlePull} disabled={busy || !status?.connected}>
            {busy ? 'working…' : 'pull from device'}
          </Button>
          <Button onClick={handleBackup} disabled={busy || !cacheReady} kind="secondary">
            backup cache
          </Button>
          <Button kind="tertiary" onClick={refresh} disabled={busy}>
            refresh status
          </Button>
        </div>

        {busy && (
          <InlineLoading
            description="Working with device cache…"
            style={{ marginTop: '1rem' }}
          />
        )}
        {message && <p style={{ marginTop: '1rem', marginBottom: 0 }}>{message}</p>}
        {status?.error && !status.connected && (
          <p style={{ marginTop: '0.75rem', marginBottom: 0, color: 'var(--color-text-error)' }}>
            {status.error}
          </p>
        )}
        <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Backups are copied to Documents/OP-XY Backups/ — safe to use before editing or pushing to the device.
        </p>
      </Tile>

      {backups.length > 0 && (
        <>
          <h3 style={{ fontWeight: 500 }}>Recent backups ({backups.length})</h3>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {backups.slice(0, 5).map((b) => (
              <Tile key={b.id} style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <strong>{new Date(b.createdAt).toLocaleString()}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {b.presetCount} presets · {b.sampleCount} samples
                    </div>
                  </div>
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={() => window.opxy?.device.showBackup(b.path)}
                  >
                    show in folder
                  </Button>
                </div>
              </Tile>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontWeight: 500 }}>Sample-based presets ({samplePresets.length})</h3>
      {samplePresets.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Pull from the device to browse presets here. Rename and push flows come next.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {samplePresets.slice(0, 50).map((p) => (
            <Tile key={p.relativePath} style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {p.category} · {p.type} · {p.sampleCount} regions
                  </div>
                </div>
                <code style={{ fontSize: '0.75rem' }}>{p.relativePath}</code>
              </div>
            </Tile>
          ))}
          {samplePresets.length > 50 && (
            <p style={{ color: 'var(--color-text-secondary)' }}>…and {samplePresets.length - 50} more</p>
          )}
        </div>
      )}
    </div>
  );
}
