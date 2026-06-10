import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CachePresetEntry, PatchEnvelope, PatchJson, PresetDetail } from '../../types/opxy';
import { normalizePresetType } from '../../types/opxy';
import { ObjectDetailHead } from '../../ui';
import { loadPresetIntoEditor } from '../../utils/cacheLoader';
import { PresetEditorEmbed } from './PresetEditorEmbed';
import { useAppContext } from '../../context/AppContext';
import { notify } from '../../utils/notify';
import { usePresetNavigation } from '../../utils/presetFilters';

interface PresetDetailPaneProps {
  preset: CachePresetEntry;
  filteredPresets: CachePresetEntry[];
  isDirty: boolean;
  busy?: boolean;
  onRenamed: () => void;
  onNavigate: (path: string) => void;
}

function presetMetaLine(p: CachePresetEntry, isDirty: boolean): string {
  const bits = [p.category, normalizePresetType(p.type)];
  if (p.sampleBased) bits.push(`${p.sampleCount} samples`);
  if (isDirty) bits.push('●');
  return bits.join(' · ');
}

function parsePatchJson(detail: PresetDetail | null): PatchJson | null {
  if (!detail) return null;
  try {
    return JSON.parse(detail.patchJson) as PatchJson;
  } catch {
    return null;
  }
}

function formatPatchValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && value.trim()) return value;
  return '—';
}

function pct(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round((value / 32767) * 100)));
}

function envelopeValues(envelope: PatchEnvelope | undefined, kind: keyof PatchEnvelope): Array<{ label: string; value: number }> {
  const values = envelope?.[kind];
  return [
    { label: 'a', value: pct(values?.attack) },
    { label: 'd', value: pct(values?.decay) },
    { label: 's', value: pct(values?.sustain) },
    { label: 'r', value: pct(values?.release) },
  ];
}

function SoundValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="preset-sound-value">
      <span>{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}

function EnvelopeStrip({ label, values }: { label: string; values: Array<{ label: string; value: number }> }) {
  return (
    <div className="preset-envelope-strip">
      <span>{label}</span>
      <div>
        {values.map((item) => (
          <span key={item.label} className="preset-envelope-meter">
            <span className="mono">{item.label}</span>
            <span className="preset-meter-track"><span style={{ width: `${item.value}%` }} /></span>
            <span className="mono">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function EngineParams({ params }: { params: number[] | undefined }) {
  const visible = params?.slice(0, 8) ?? [];
  if (visible.length === 0) return null;
  return (
    <div className="preset-param-grid" aria-label="engine parameters">
      {visible.map((value, index) => (
        <div key={index} className="preset-param-cell">
          <span className="mono">p{index + 1}</span>
          <span className="preset-meter-track"><span style={{ width: `${pct(value)}%` }} /></span>
          <span className="mono">{pct(value)}</span>
        </div>
      ))}
    </div>
  );
}

function PresetSoundPanel({ patch }: { patch: PatchJson | null }) {
  if (!patch) {
    return <p className="mono preset-muted-note">patch details unavailable</p>;
  }
  return (
    <div className="preset-sound-panel">
      <section className="preset-sound-section">
        <div className="preset-section-head">
          <span>engine</span>
          <span className="mono">{normalizePresetType(patch.type)}</span>
        </div>
        <div className="preset-sound-values">
          <SoundValue label="play" value={formatPatchValue(patch.engine?.playmode)} />
          <SoundValue label="transpose" value={formatPatchValue(patch.engine?.transpose)} />
          <SoundValue label="volume" value={String(pct(patch.engine?.volume))} />
          <SoundValue label="width" value={String(pct(patch.engine?.width))} />
          <SoundValue label="highpass" value={String(pct(patch.engine?.highpass))} />
          <SoundValue label="velocity" value={String(pct(patch.engine?.['velocity.sensitivity']))} />
        </div>
      </section>

      <section className="preset-sound-section">
        <div className="preset-section-head">
          <span>envelopes</span>
          <span className="mono">0-100</span>
        </div>
        <EnvelopeStrip label="amp" values={envelopeValues(patch.envelope, 'amp')} />
        <EnvelopeStrip label="filter" values={envelopeValues(patch.envelope, 'filter')} />
      </section>

      <section className="preset-sound-section">
        <div className="preset-section-head">
          <span>parameters</span>
          <span className="mono">engine raw</span>
        </div>
        <EngineParams params={patch.engine?.params} />
      </section>

      <section className="preset-sound-section compact">
        <SoundValue label="fx" value={`${patch.fx?.active ? 'on' : 'off'}${patch.fx?.type ? ` · ${patch.fx.type}` : ''}`} />
        <SoundValue label="lfo" value={`${patch.lfo?.active ? 'on' : 'off'}${patch.lfo?.type ? ` · ${patch.lfo.type}` : ''}`} />
      </section>
    </div>
  );
}

export function PresetDetailPane({
  preset,
  filteredPresets,
  isDirty,
  busy: externalBusy,
  onNavigate,
}: PresetDetailPaneProps) {
  const { state, dispatch } = useAppContext();
  const { prev, next, selectedIndex } = usePresetNavigation(filteredPresets, preset.relativePath);

  const [detail, setDetail] = useState<PresetDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const isBusy = busy || externalBusy;
  const editorKind = detail ? normalizePresetType(detail.type) : null;
  const isSampleBased = preset.sampleBased;
  const patch = useMemo(() => parsePatchJson(detail), [detail]);

  const refresh = useCallback(async () => {
    if (!window.opxy) return;
    const d = await window.opxy.device.getPresetDetail(preset.relativePath);
    setDetail(d);
  }, [preset.relativePath]);

  useEffect(() => { refresh(); }, [refresh]);

  const canEmbedEditor = editorKind === 'drum' || editorKind === 'sampler';

  useEffect(() => {
    if (!canEmbedEditor || isBusy) return;
    const normPath = preset.relativePath.replace(/\\/g, '/');
    const sourcePath = state.cacheSource?.relativePath.replace(/\\/g, '/');
    if (sourcePath === normPath) return;
    void loadPresetIntoEditor(preset, dispatch, state.midiNoteMapping, state.multisampleFiles.length, {
      embed: true,
    }).catch((e) => {
      notify(dispatch, 'error', 'Editor load failed', e instanceof Error ? e.message : 'Failed');
    });
  }, [
    canEmbedEditor,
    preset.relativePath,
    state.cacheSource?.relativePath,
    state.midiNoteMapping,
    state.multisampleFiles.length,
    dispatch,
    isBusy,
  ]);

  return (
    <>
      <ObjectDetailHead
        title={preset.name}
        meta={presetMetaLine(preset, isDirty)}
        position={selectedIndex >= 0 ? `${selectedIndex + 1}/${filteredPresets.length}` : undefined}
        onPrev={() => prev && onNavigate(prev.relativePath)}
        onNext={() => next && onNavigate(next.relativePath)}
        prevDisabled={!prev}
        nextDisabled={!next}
      />

      <div className="detail-body">
        {isSampleBased ? (
          <div className="sub-pane edit-workspace">
            {canEmbedEditor ? (
              <PresetEditorEmbed presetPath={preset.relativePath} />
            ) : (
              <p className="mono edit-unavailable">no sample editor for this preset type</p>
            )}
          </div>
        ) : (
          <div className="sub-pane preset-overview">
            <PresetSoundPanel patch={patch} />
          </div>
        )}
      </div>
    </>
  );
}
