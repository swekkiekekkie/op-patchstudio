/**
 * OP-XY device content types — device MTP scan + reference material.
 */

export type DevicePresetType =
  | 'drum'
  | 'sampler'
  | 'axis'
  | 'dissolve'
  | 'epiano'
  | 'hardsync'
  | 'organ'
  | 'prism'
  | 'simple'
  | 'wavetable';

export type SamplePresetType = 'drum' | 'sampler';

export type SynthEngineType = Exclude<DevicePresetType, SamplePresetType>;

export type AppTab = 'device' | 'drum' | 'multisample';

export function normalizePresetType(type: string): DevicePresetType | string {
  if (type === 'multisampler') return 'sampler';
  return type;
}

export function isSampleBasedPreset(type: string, regions: unknown[]): type is SamplePresetType {
  const t = normalizePresetType(type);
  return (t === 'drum' || t === 'sampler') && regions.length > 0;
}

export const ALLOWED_NAME_CHARS = /^[a-zA-Z0-9 #\-()]+$/;

export const DEVICE_SAMPLE_FILENAME =
  /^(?<base>.+)-(?<note>[a-g](?:#|b)?\d+)-(?<idx>\d+)\.(?<ext>wav|aif|aiff)$/i;

export interface ParsedSampleName {
  base: string;
  note: string;
  idx: number;
  ext: string;
}

export function parseDeviceSampleFilename(filename: string): ParsedSampleName | null {
  const m = filename.match(DEVICE_SAMPLE_FILENAME);
  if (!m?.groups) return null;
  return {
    base: m.groups.base,
    note: m.groups.note.toLowerCase(),
    idx: parseInt(m.groups.idx, 10),
    ext: m.groups.ext.toLowerCase(),
  };
}

export const DRUM_PAD_LABELS = [
  'KD1', 'KD2', 'SD1', 'SD2', 'RIM', 'CLP', 'TB', 'SH', 'CH', 'CL1', 'OH', 'CAB',
  'LT1', 'RC', 'MT', 'CC', 'HT', 'COW', 'TRI', 'LT2', 'LC', 'WS', 'HC', 'GUI',
] as const;

export const DRUM_MIDI_START = 53;

export function drumPadLabel(hikey: number): string | undefined {
  return DRUM_PAD_LABELS[hikey - DRUM_MIDI_START];
}

export interface ModulationTarget {
  amount: number;
  target: number;
}

export interface PatchEngine {
  bendrange: number;
  highpass: number;
  playmode: string;
  transpose: number;
  volume: number;
  width: number;
  'velocity.sensitivity': number;
  'portamento.amount': number;
  'portamento.type': number;
  'tuning.root': number;
  'tuning.scale': number;
  params: number[];
  modulation: {
    aftertouch: ModulationTarget;
    modwheel: ModulationTarget;
    pitchbend: ModulationTarget;
    velocity: ModulationTarget;
  };
}

export interface PatchEnvelope {
  amp: { attack: number; decay: number; release: number; sustain: number };
  filter: { attack: number; decay: number; release: number; sustain: number };
}

export interface PatchFx {
  active: boolean;
  type: string;
  params: number[];
}

export interface PatchLfo {
  active: boolean;
  type: string;
  params: number[];
}

export interface DrumRegion {
  'fade.in': number;
  'fade.out': number;
  framecount: number;
  hikey: number;
  lokey: number;
  pan: number;
  'pitch.keycenter': number;
  playmode: string;
  reverse: boolean;
  sample: string;
  'sample.end': number;
  transpose: number;
  tune: number;
  gain?: number;
  'sample.start'?: number;
}

export interface SamplerRegion {
  framecount: number;
  hikey: number;
  lokey: number;
  'pitch.keycenter': number;
  reverse: boolean;
  sample: string;
  'sample.end': number;
  tune: number;
  'loop.start': number;
  'loop.end': number;
  'loop.onrelease': boolean;
  'loop.crossfade': number;
  gain?: number;
  'loop.enabled'?: boolean;
  'sample.start'?: number;
}

export interface PatchJson {
  platform: 'OP-XY';
  version: number;
  type: DevicePresetType | string;
  octave: number;
  name?: string;
  engine: PatchEngine;
  envelope: PatchEnvelope;
  fx: PatchFx;
  lfo: PatchLfo;
  regions: DrumRegion[] | SamplerRegion[];
}

export interface CachePresetEntry {
  relativePath: string;
  category: string;
  name: string;
  type: string;
  sampleBased: boolean;
  sampleCount: number;
}

export interface DeviceStatus {
  connected: boolean;
  deviceName: string | null;
  cacheRoot: string;
  lastPullAt: number | null;
}

export interface OpxyApi {
  device: {
    status(): Promise<DeviceStatus>;
    pull(): Promise<{ ok: boolean; error?: string; presetCount?: number; sampleCount?: number }>;
    cacheRoot(): Promise<string>;
    listPresets(): Promise<CachePresetEntry[]>;
    readText(relativePath: string): Promise<string>;
    readBytes(relativePath: string): Promise<ArrayBuffer>;
    exportPresetZip(presetName: string, zipBase64: string): Promise<{ ok: boolean; path?: string; error?: string }>;
  };
}

declare global {
  interface Window {
    opxy: OpxyApi;
  }
}

export {};
