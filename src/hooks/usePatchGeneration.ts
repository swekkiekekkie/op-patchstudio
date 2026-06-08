import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateDrumPatch, generateMultisamplePatch } from '../utils/patchGeneration';
import { exportDrumPatchToCache, exportMultisamplePatchToCache } from '../utils/devicePatchExport';
import { normalizePresetType } from '../types/opxy';

async function exportPresetZip(blob: Blob, presetName: string): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);

  if (window.opxy?.device?.exportPresetZip) {
    const result = await window.opxy.device.exportPresetZip(presetName, base64);
    if (!result.ok) throw new Error(result.error ?? 'Export failed');
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${presetName}.preset.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function uint8ToNumberArray(data: Uint8Array): number[] {
  return Array.from(data);
}

export function usePatchGeneration() {
  const { state, dispatch } = useAppContext();

  const generateDrumPatchFile = useCallback(async (patchName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const loadedSamples = state.drumSamples.filter((sample) => sample.isLoaded);
      if (loadedSamples.length === 0) throw new Error('No samples loaded');

      const finalPatchName = patchName || state.drumSettings.presetName || `drum_patch_${Date.now()}`;
      const targetSampleRate = state.drumSettings.sampleRate || undefined;
      const targetBitDepth = state.drumSettings.bitDepth || undefined;
      const targetChannels = state.drumSettings.channels === 1 ? 'mono' : 'keep';

      if (window.opxy?.device?.writePreset) {
        const categories = await window.opxy.device.listCategories();
        const source = state.cacheSource;
        const category =
          source?.type === 'drum' || normalizePresetType(source?.type ?? '') === 'drum'
            ? source?.category ?? (categories.includes('drum') ? 'drum' : categories[0] ?? 'user')
            : categories.includes('drum')
              ? 'drum'
              : (categories[0] ?? 'user');
        const saveName = source?.name ?? finalPatchName;
        const cacheExport = await exportDrumPatchToCache(
          state,
          finalPatchName,
          targetSampleRate,
          targetBitDepth,
          targetChannels,
          state.drumSettings.audioFormat,
        );
        const result = await window.opxy.device.writePreset({
          category,
          presetName: saveName,
          patchJson: cacheExport.patchJson,
          files: cacheExport.files.map((f) => ({ name: f.name, data: uint8ToNumberArray(f.data) })),
        });
        if (!result.ok) throw new Error(result.error ?? 'Failed to save preset to cache');
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `cache-${Date.now()}`,
            type: 'success',
            title: source ? 'Updated device cache preset' : 'Saved to device cache',
            message: result.relativePath ?? saveName,
            duration: 5000,
          },
        });
        return;
      }

      const patchBlob = await generateDrumPatch(
        state,
        finalPatchName,
        targetSampleRate,
        targetBitDepth,
        targetChannels,
        state.drumSettings.audioFormat,
      );

      await exportPresetZip(patchBlob, finalPatchName);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to generate patch',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, dispatch]);

  const generateMultisamplePatchFile = useCallback(async (patchName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (state.multisampleFiles.length === 0) throw new Error('No samples loaded');

      const finalPatchName = patchName || state.multisampleSettings.presetName || `multisample_patch_${Date.now()}`;
      const targetSampleRate = state.multisampleSettings.sampleRate || undefined;
      const targetBitDepth = state.multisampleSettings.bitDepth || undefined;
      const targetChannels = state.multisampleSettings.channels === 1 ? 'mono' : 'keep';
      const multisampleGain = state.multisampleSettings.gain || 0;

      if (window.opxy?.device?.writePreset) {
        const categories = await window.opxy.device.listCategories();
        const source = state.cacheSource;
        const category =
          source?.category ??
          (categories.includes('keys') ? 'keys' : (categories[0] ?? 'user'));
        const saveName = source?.name ?? finalPatchName;
        const cacheExport = await exportMultisamplePatchToCache(
          state,
          finalPatchName,
          targetSampleRate,
          targetBitDepth,
          targetChannels,
          multisampleGain,
          state.multisampleSettings.audioFormat,
        );
        const result = await window.opxy.device.writePreset({
          category,
          presetName: saveName,
          patchJson: cacheExport.patchJson,
          files: cacheExport.files.map((f) => ({ name: f.name, data: uint8ToNumberArray(f.data) })),
        });
        if (!result.ok) throw new Error(result.error ?? 'Failed to save preset to cache');
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `cache-${Date.now()}`,
            type: 'success',
            title: source ? 'Updated device cache preset' : 'Saved to device cache',
            message: result.relativePath ?? saveName,
            duration: 5000,
          },
        });
        return;
      }

      const patchBlob = await generateMultisamplePatch(
        state,
        finalPatchName,
        targetSampleRate,
        targetBitDepth,
        targetChannels,
        multisampleGain,
        state.multisampleSettings.audioFormat,
      );

      await exportPresetZip(patchBlob, finalPatchName);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to generate patch',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, dispatch]);

  return { generateDrumPatchFile, generateMultisamplePatchFile };
}
