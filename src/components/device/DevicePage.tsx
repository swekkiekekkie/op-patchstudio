import { useCallback, useEffect, useState } from 'react';
import { Button, InlineLoading, Tag, Tile } from '@carbon/react';
import type { CachePresetEntry, DeviceStatus } from '../../types/opxy';

export function DevicePage() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [presets, setPresets] = useState<CachePresetEntry[]>([]);
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
    if (s.lastPullAt) {
      setPresets(await window.opxy.device.listPresets());
    } else {
      setPresets([]);
    }
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

  const samplePresets = presets.filter((p) => p.sampleBased);

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
          {status?.cacheRoot && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              cache: {status.cacheRoot}
            </span>
          )}
          {status?.lastPullAt && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              last pull: {new Date(status.lastPullAt).toLocaleString()}
            </span>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <Button onClick={handlePull} disabled={busy || !status?.connected}>
            {busy ? 'pulling…' : 'pull from device'}
          </Button>
          <Button kind="tertiary" onClick={refresh} disabled={busy}>
            refresh status
          </Button>
        </div>

        {busy && <InlineLoading description="Copying from MTP (this can take a minute)…" style={{ marginTop: '1rem' }} />}
        {message && <p style={{ marginTop: '1rem', marginBottom: 0 }}>{message}</p>}
        {status?.error && !status.connected && (
          <p style={{ marginTop: '0.75rem', marginBottom: 0, color: 'var(--color-text-error)' }}>
            {status.error}
          </p>
        )}
      </Tile>

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
