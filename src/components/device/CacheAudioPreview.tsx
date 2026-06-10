import { useCallback, useEffect, useState } from 'react';
import { InlineLoading } from '@carbon/react';
import { SmallWaveform } from '../common/SmallWaveform';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { audioContextManager } from '../../utils/audioContext';
import { ActionButton, PlayIcon, StopIcon } from '../../ui';

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
        // Decode on the shared context: Chromium caps live AudioContexts, so
        // a per-sample context breaks preview after browsing enough files.
        const ctx = await audioContextManager.getAudioContext();
        const decoded = await ctx.decodeAudioData(bytes.slice(0));
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
  if (loading) return <InlineLoading description="loading audio" />;
  if (error) {
    return (
      <div className="cache-audio-preview cache-audio-preview-error" title={error}>
        <span className="mono">preview unavailable</span>
      </div>
    );
  }
  if (!buffer) return null;

  return (
    <div className="cache-audio-preview">
      <ActionButton
        label={playing ? 'stop' : 'play'}
        ariaLabel={playing ? 'stop sample' : 'play sample'}
        size="sm"
        onClick={handlePlay}
      >
        {playing ? <StopIcon /> : <PlayIcon />}
      </ActionButton>
      <div className="cache-audio-waveform">
        <SmallWaveform audioBuffer={buffer} height={height} />
      </div>
    </div>
  );
}
