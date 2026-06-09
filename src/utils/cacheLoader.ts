import type { Dispatch } from 'react';
import type { AppAction } from '../context/AppContext';
import type { CachePresetEntry, PatchJson } from '../types/opxy';
import { DRUM_MIDI_START, normalizePresetType } from '../types/opxy';
import { categoryFromPresetPath } from './presetPath';
import { readAudioMetadata } from './audioFormats';

function sampleRelPath(presetRelPath: string, filename: string): string {
  return `${presetRelPath.replace(/\\/g, '/')}/${filename}`;
}

async function bytesToFile(bytes: ArrayBuffer, filename: string): Promise<File> {
  const blob = new Blob([bytes]);
  return new File([blob], filename, { type: blob.type || 'audio/wav' });
}

export async function loadPresetIntoEditor(
  preset: CachePresetEntry,
  dispatch: Dispatch<AppAction>,
  mapping: 'C3' | 'C4',
  multisampleCount: number,
  options?: { embed?: boolean },
): Promise<'drum' | 'multisample'> {
  if (!window.opxy) throw new Error('App bridge unavailable');

  const detail = await window.opxy.device.getPresetDetail(preset.relativePath);
  const patch = JSON.parse(detail.patchJson) as PatchJson;
  const normalizedType = normalizePresetType(patch.type);

  if (normalizedType === 'drum') {
    dispatch({ type: 'CLEAR_ALL_DRUM_SAMPLES' });
    dispatch({ type: 'SET_IMPORTED_DRUM_PRESET', payload: patch });
    dispatch({ type: 'SET_DRUM_PRESET_NAME', payload: detail.name });
    dispatch({
      type: 'SET_CACHE_SOURCE',
      payload: {
        relativePath: preset.relativePath.replace(/\\/g, '/'),
        name: detail.name,
        category: preset.category || categoryFromPresetPath(preset.relativePath),
        type: detail.type,
      },
    });

    for (const region of detail.regions) {
      if (!region.hasAudio || region.hikey === undefined) continue;
      const keyIndex = region.hikey - DRUM_MIDI_START;
      if (keyIndex < 0 || keyIndex > 23) continue;

      const rel = sampleRelPath(preset.relativePath, region.sample);
      const bytes = await window.opxy.device.readBytes(rel);
      const file = await bytesToFile(bytes, region.sample);
      const metadata = await readAudioMetadata(file, mapping);

      dispatch({
        type: 'LOAD_DRUM_SAMPLE',
        payload: { index: keyIndex, file, audioBuffer: metadata.audioBuffer, metadata },
      });
    }

    if (!options?.embed) {
      dispatch({ type: 'SET_TAB', payload: 'drum' });
    }
    return 'drum';
  }

  if (normalizedType === 'sampler') {
    for (let i = multisampleCount - 1; i >= 0; i--) {
      dispatch({ type: 'CLEAR_MULTISAMPLE_FILE', payload: i });
    }

    dispatch({ type: 'SET_IMPORTED_MULTISAMPLE_PRESET', payload: patch });
    dispatch({ type: 'SET_MULTISAMPLE_PRESET_NAME', payload: detail.name });
    dispatch({
      type: 'SET_CACHE_SOURCE',
      payload: {
        relativePath: preset.relativePath.replace(/\\/g, '/'),
        name: detail.name,
        category: preset.category || categoryFromPresetPath(preset.relativePath),
        type: detail.type,
      },
    });

    for (const region of detail.regions) {
      if (!region.hasAudio) continue;
      const rel = sampleRelPath(preset.relativePath, region.sample);
      const bytes = await window.opxy.device.readBytes(rel);
      const file = await bytesToFile(bytes, region.sample);
      const metadata = await readAudioMetadata(file, mapping);
      const rootNote = region.rootNote ?? region.hikey ?? 60;

      dispatch({
        type: 'LOAD_MULTISAMPLE_FILE',
        payload: {
          file,
          audioBuffer: metadata.audioBuffer,
          metadata,
          rootNoteOverride: rootNote,
        },
      });
    }

    if (!options?.embed) {
      dispatch({ type: 'SET_TAB', payload: 'multisample' });
    }
    return 'multisample';
  }

  throw new Error(`Preset type "${patch.type}" cannot be opened in drum or multisample editor`);
}
