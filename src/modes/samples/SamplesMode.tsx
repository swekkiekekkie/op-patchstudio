import { useMemo, useState } from 'react';
import type { CacheSampleEntry } from '../../types/opxy';
import { LibraryWorkspace, ModeScreen, SearchField } from '../../ui';
import { useAppShell } from '../../navigation/AppShellContext';
import { useNavigation } from '../../navigation/useNavigation';
import { CacheAudioPreview } from '../../components/device/CacheAudioPreview';

interface SamplesModeProps {
  samples: CacheSampleEntry[];
  busy: boolean;
  onRefresh: () => void;
}

export function SamplesMode({ samples, busy, onRefresh }: SamplesModeProps) {
  const { state } = useAppShell();
  const { goToSamples } = useNavigation();
  const [search, setSearch] = useState('');
  const [unnamedOnly, setUnnamedOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = samples;
    if (unnamedOnly) list = list.filter((s) => s.isUnnamed);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.filename.toLowerCase().includes(q));
    return list;
  }, [samples, search, unnamedOnly]);

  const selected = useMemo(() => {
    if (!state.sampleFilename) return filtered[0] ?? null;
    return filtered.find((s) => s.filename === state.sampleFilename || s.relativePath.includes(state.sampleFilename)) ?? null;
  }, [filtered, state.sampleFilename]);

  return (
    <ModeScreen>
      <div className="library-toolbar">
        <SearchField value={search} onChange={setSearch} placeholder="search" />
        <div className="filter-toggles">
          <button type="button" className={`filter-toggle${unnamedOnly ? ' active' : ''}`} onClick={() => setUnnamedOnly((v) => !v)}>?</button>
        </div>
      </div>

      <LibraryWorkspace
        showDetail={!!selected}
        list={
          <>
            <div className="list-toolbar">
              <span className="mono">showing {filtered.length}/{samples.length}</span>
              <button type="button" onClick={onRefresh} disabled={busy}>refresh</button>
            </div>
            <div className="library-list-scroll">
              {filtered.slice(0, 200).map((s, i) => (
                <button
                  key={s.relativePath}
                  type="button"
                  className={`object-row${selected?.relativePath === s.relativePath ? ' selected' : ''}`}
                  onClick={() => goToSamples(s.filename)}
                >
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="name">{s.filename.replace(/\.wav$/i, '')}</span>
                  <span className="meta">{s.isUnnamed ? '? unnamed' : s.note}</span>
                </button>
              ))}
            </div>
          </>
        }
        detail={
          selected ? (
            <>
              <div className="detail-head detail-head-compact">
                <h2>{selected.filename}</h2>
                <div className="detail-sub mono">{selected.base} · {selected.note} · {selected.idx}</div>
              </div>
              <div className="detail-body">
                <CacheAudioPreview relativePath={selected.relativePath} />
              </div>
            </>
          ) : null
        }
        empty={<span>—</span>}
      />
    </ModeScreen>
  );
}
