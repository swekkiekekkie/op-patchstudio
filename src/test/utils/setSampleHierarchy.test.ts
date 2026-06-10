import { describe, expect, it } from 'vitest';
import { buildSetSampleHierarchy, findSetSampleHierarchySelection } from '../../utils/setSampleHierarchy';
import type { CacheSampleEntry } from '../../types/opxy';

function sample(relativePath: string, overrides: Partial<CacheSampleEntry> = {}): CacheSampleEntry {
  const filename = relativePath.split('/').at(-1) ?? relativePath;
  return {
    relativePath,
    filename,
    base: filename.replace(/-[a-g]#?\d+-\d+\.\w+$/i, ''),
    note: filename.match(/-([a-g]#?\d+)-\d+\.\w+$/i)?.[1]?.toLowerCase() ?? '',
    idx: Number(filename.match(/-(\d+)\.\w+$/)?.[1] ?? 0),
    isUnnamed: false,
    ...overrides,
  };
}

describe('setSampleHierarchy', () => {
  it('groups repeated OP-XY sample variants by folder and base name', () => {
    const hierarchy = buildSetSampleHierarchy([
      sample('samples/user/kit-a-c3-0.wav', { base: 'kit-a', note: 'c3', idx: 0 }),
      sample('samples/user/kit-a-c3-1.wav', { base: 'kit-a', note: 'c3', idx: 1, isUnnamed: true }),
      sample('samples/user/kit-b-d3-0.wav', { base: 'kit-b', note: 'd3', idx: 0 }),
      sample('samples/imports/loop-c3-0.wav', { base: 'loop', note: 'c3', idx: 0 }),
    ]);

    expect(hierarchy.folders.map((folder) => folder.label)).toEqual(['samples / imports', 'samples / user']);
    const userFolder = hierarchy.folders.find((folder) => folder.path === 'samples/user');
    expect(userFolder?.groups.map((group) => group.label)).toEqual(['kit-a', 'loose files']);
    expect(userFolder?.groups[0]?.sampleCount).toBe(2);
    expect(userFolder?.groups[0]?.unnamedCount).toBe(1);
  });

  it('collapses singletons and unparsed filenames into one loose group', () => {
    const hierarchy = buildSetSampleHierarchy([
      sample('samples/user/WT_FXLoopB_126-02.wav', { base: 'WT_FXLoopB_126-02', note: '', idx: 0 }),
      sample('samples/user/one-shot-c3-0.wav', { base: 'one-shot', note: 'c3', idx: 0 }),
      sample('samples/user/kit-a-c3-0.wav', { base: 'kit-a', note: 'c3', idx: 0 }),
      sample('samples/user/kit-a-d3-0.wav', { base: 'kit-a', note: 'd3', idx: 0 }),
    ]);

    const userFolder = hierarchy.folders[0];
    expect(userFolder?.groups.map((group) => group.label)).toEqual(['kit-a', 'loose files']);
    const loose = userFolder?.groups.find((group) => group.label === 'loose files');
    expect(loose?.sampleCount).toBe(2);
    expect(loose?.noteSummary).toBe('2 files');
  });

  it('finds the folder and group for a selected set sample', () => {
    const hierarchy = buildSetSampleHierarchy([
      sample('samples/user/kit-a-c3-0.wav', { base: 'kit-a' }),
      sample('samples/user/kit-a-d3-0.wav', { base: 'kit-a' }),
      sample('samples/user/kit-b-c3-0.wav', { base: 'kit-b' }),
    ]);

    expect(findSetSampleHierarchySelection(hierarchy, 'samples/user/kit-a-d3-0.wav')).toEqual({
      folderId: 'samples/user',
      groupId: 'samples/user:kit-a',
    });
    expect(findSetSampleHierarchySelection(hierarchy, 'samples/user/kit-b-c3-0.wav')).toEqual({
      folderId: 'samples/user',
      groupId: 'samples/user:__loose',
    });
  });
});
