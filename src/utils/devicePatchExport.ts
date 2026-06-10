import JSZip from 'jszip';
import { generateDrumPatch, generateMultisamplePatch } from './patchGeneration';
import { generateDeviceSampleFilename } from '../types/opxy';
import { sanitizeName } from './audio';
import { getAudioFileExtension, type AudioFormat } from './audioExport';
import type { AppState } from '../context/AppContext';

export interface DeviceCacheExport {
  patchJson: string;
  files: Array<{ name: string; data: Uint8Array }>;
}

async function remapZipToDeviceCache(
  blob: Blob,
  presetName: string,
  deviceType: 'drum' | 'sampler',
  audioFormat: AudioFormat,
): Promise<DeviceCacheExport> {
  const zip = await JSZip.loadAsync(blob);
  const patchEntry = zip.file('patch.json');
  if (!patchEntry) throw new Error('Generated patch missing patch.json');

  const patch = JSON.parse(await patchEntry.async('string')) as {
    type: string;
    regions: Array<{ sample: string; 'pitch.keycenter'?: number; hikey?: number }>;
  };

  patch.type = deviceType;
  const cleanBase = sanitizeName(presetName);
  const ext = getAudioFileExtension(audioFormat);
  const files: Array<{ name: string; data: Uint8Array }> = [];

  for (let i = 0; i < patch.regions.length; i++) {
    const region = patch.regions[i]!;
    const entry = zip.file(region.sample);
    if (!entry) continue;

    const rootNote = region['pitch.keycenter'] ?? region.hikey ?? 60;
    const newName = generateDeviceSampleFilename(cleanBase, rootNote, i, ext);
    region.sample = newName;
    files.push({ name: newName, data: await entry.async('uint8array') });
  }

  return { patchJson: JSON.stringify(patch), files };
}

export async function exportDrumPatchToCache(
  state: AppState,
  patchName: string,
  targetSampleRate?: number,
  targetBitDepth?: number,
  targetChannels?: string,
  audioFormat: AudioFormat = 'wav',
): Promise<DeviceCacheExport> {
  const blob = await generateDrumPatch(
    state,
    patchName,
    targetSampleRate,
    targetBitDepth,
    targetChannels,
    audioFormat,
  );
  return remapZipToDeviceCache(blob, patchName, 'drum', audioFormat);
}

export async function exportMultisamplePatchToCache(
  state: AppState,
  patchName: string,
  targetSampleRate?: number,
  targetBitDepth?: number,
  targetChannels?: string,
  multisampleGain: number = 0,
  audioFormat: AudioFormat = 'wav',
): Promise<DeviceCacheExport> {
  const blob = await generateMultisamplePatch(
    state,
    patchName,
    targetSampleRate,
    targetBitDepth,
    targetChannels,
    multisampleGain,
    audioFormat,
  );
  return remapZipToDeviceCache(blob, patchName, 'sampler', audioFormat);
}
