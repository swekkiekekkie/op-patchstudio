import { useCallback, useEffect, useState } from 'react';
import { InlineLoading } from '@carbon/react';
import { SmallWaveform } from '../common/SmallWaveform';
import { IconButton } from '../common/IconButton';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface CacheAudioPreviewProps {
  relativePath: string;
  enabled?: boolean;
  height?: number;
}

export function CacheAudioPreview({ relativePath, enabled = true, height = 44 }: CacheAudioPreviewProps) {
  const { play, stop } = useAudioPlayer();
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!enabled || !window.opxy) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const bytes = await window.opxy!.device.readBytes(relativePath);
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(bytes.slice(0));
        await ctx.close();
        if (!cancelled) setBuffer(decoded);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load audio');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [relativePath, enabled, stop]);

  const handlePlay = useCallback(async () => {
    if (!buffer) return;
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    const ok = await play(buffer);
    setPlaying(ok);
    if (ok) {
      window.setTimeout(() => setPlaying(false), Math.ceil(buffer.duration * 1000));
    }
  }, [buffer, play, stop, playing]);

  if (!enabled) return null;
  if (loading) return <InlineLoading description="Loading audio…" />;
  if (error) return <span style={{ fontSize: '0.8rem', color: 'var(--color-text-error)' }}>{error}</span>;
  if (!buffer) return null;

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <IconButton
        icon={playing ? 'fas fa-stop' : 'fas fa-play'}
        title={playing ? 'stop' : 'play sample'}
        onClick={handlePlay}
        color="var(--color-interactive-focus)"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SmallWaveform audioBuffer={buffer} height={height} />
      </div>
    </div>
  );
}
