import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { inspectProjectBuffer } from '../../../electron/main/projectIndex';

const PROBE_ROOT = path.resolve(
  'reference_material',
  'user_probes',
  '2026-06-app-required',
  'projects',
);
const PHASE_B_PROJECT_ROOT = path.resolve(
  'reference_material',
  'user_probes',
  '2026-06-phase-b',
  'projects',
);

const PRESET_BY_PATTERN = ['pp', 'qq', 'rr', 'ss', 'tt', 'uu', 'vv', 'ww', 'xx'];

describe('OP-XY project inspection', () => {
  it.each([
    ['a1-t1-p9.xy', 1],
    ['a2-t2-p9.xy', 2],
    ['a3-t3-p9.xy', 3],
    ['a4-t4-p9.xy', 4],
  ])('infers drum preset folders for %s', (filename, activeTrack) => {
    const buf = readFileSync(path.join(PROBE_ROOT, filename));
    const inspection = inspectProjectBuffer(buf);
    const track = inspection.tracks.find((item) => item.trackNumber === activeTrack);

    expect(inspection.parseStatus).toBe('ok');
    expect(track?.patterns).toHaveLength(9);

    for (const [index, expectedPreset] of PRESET_BY_PATTERN.entries()) {
      const pattern = track?.patterns[index];
      expect(pattern?.patternNumber).toBe(index + 1);
      expect(pattern?.active).toBe(true);
      expect(pattern?.engineName).toBe('drum');
      expect(pattern?.presetRefs[0]).toMatchObject({
        folder: `/fat32/presets/drum/${expectedPreset}`,
        kind: 'drum',
        hitCount: 24,
        confidence: 'strong',
      });
      expect(pattern?.inferredPresetFolders?.[0]).toEqual(pattern?.presetRefs[0]);
    }
  });

  it.each([
    ['b1-t1eng1bar2.xy', 'axis', 'nt-accord', 'synth'],
    ['b1-t1eng2bar1.xy', 'dissolve', 'nt-cold brew', 'synth'],
    ['b1-t1eng3bar1.xy', 'drum', '/fat32/presets/drum/nt-aeroplane.preset', 'drum'],
    ['b1-t1eng4bar1.xy', 'epiano', 'nt-crowded', 'synth'],
    ['b1-t1eng5bar1.xy', 'hardsync', 'nt-cabin pressure', 'synth'],
    ['b1-t1eng6bar3.xy', 'multisampler', 'bandpasser', 'multi'],
    ['b1-t1eng7bar1.xy', 'organ', 'nt-castle vania', 'synth'],
    ['b1-t1eng8bar1.xy', 'prism', 'nt-blip tips', 'synth'],
    ['b1-t1eng9bar1.xy', 'sampler', 'nt-106 bass', 'sampler'],
    ['b1-t1eng10bar1.xy', 'simple', 'nt-dunce cap', 'synth'],
    ['b1-t1eng11bar1.xy', 'wavetable', 'nt-tall drink', 'synth'],
  ])('infers selected preset fragment for %s', (filename, engineName, preset, kind) => {
    const buf = readFileSync(path.join(PHASE_B_PROJECT_ROOT, filename));
    const inspection = inspectProjectBuffer(buf);
    const pattern = inspection.tracks.find((item) => item.trackNumber === 1)?.patterns[0];

    expect(inspection.parseStatus).toBe('ok');
    expect(pattern?.active).toBe(true);
    expect(pattern?.engineName).toBe(engineName);
    expect(pattern?.presetRefs[0]).toMatchObject({
      folder: preset,
      kind,
    });
  });
});
