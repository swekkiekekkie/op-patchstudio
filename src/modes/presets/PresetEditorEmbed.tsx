import { useMemo } from 'react';
import { DrumTool } from '../../components/drum/DrumTool';
import { MultisampleTool } from '../../components/multisample/MultisampleTool';
import { useAppContext } from '../../context/AppContext';
import { normalizePresetType } from '../../types/opxy';

interface PresetEditorEmbedProps {
  presetPath: string;
}

/** Drum / sampler editor embedded in presets detail — keeps shell + mode tabs visible. */
export function PresetEditorEmbed({ presetPath }: PresetEditorEmbedProps) {
  const { state } = useAppContext();
  const normPath = presetPath.replace(/\\/g, '/');
  const sourcePath = state.cacheSource?.relativePath.replace(/\\/g, '/');
  const ready = sourcePath === normPath;

  const editorKind = useMemo(() => {
    if (!state.cacheSource || !ready) return null;
    const kind = normalizePresetType(state.cacheSource.type);
    return kind === 'drum' || kind === 'sampler' ? kind : null;
  }, [ready, state.cacheSource]);

  if (!ready || !editorKind) {
    return (
      <div className="preset-editor-loading mono">
        loading editor…
      </div>
    );
  }

  return (
    <div className="preset-editor-embed">
      {editorKind === 'drum' ? <DrumTool embedded /> : <MultisampleTool embedded />}
    </div>
  );
}
