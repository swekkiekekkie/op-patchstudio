import { describe, expect, it } from 'vitest';
import type { SourcePresetEntry, SourceSampleEntry } from '../../types/opxy';
import {
  buildSourcePresetHierarchy,
  buildSourcePresetHierarchyColumns,
  buildSourceHierarchy,
  buildSourceHierarchyColumns,
  findSourceHierarchySelection,
} from '../../utils/sourceHierarchy';

function sample(folderId: string, folderLabel: string, relativePath: string): SourceSampleEntry {
  const filename = relativePath.split('/').at(-1) ?? relativePath;
  return {
    id: `${folderId}:${relativePath}`,
    folderId,
    folderLabel,
    absolutePath: `C:/samples/${folderId}/${relativePath}`,
    relativePath,
    filename,
    extension: filename.split('.').at(-1) ?? 'wav',
    sizeBytes: 1,
    mtimeMs: 1,
    alreadyInSet: false,
  };
}

function preset(folderId: string, folderLabel: string, relativePath: string): SourcePresetEntry {
  const folderName = relativePath.split('/').at(-1) ?? relativePath;
  return {
    id: `${folderId}:${relativePath}`,
    folderId,
    folderLabel,
    absolutePath: `C:/presets/${folderId}/${relativePath}`,
    relativePath,
    folderName,
    name: folderName.replace(/\.preset$/i, ''),
    type: 'drum',
    sampleRefs: [],
    availableSampleRefs: [],
    missingSampleRefs: [],
    mtimeMs: 1,
    alreadyInSet: false,
    flags: [],
  };
}

describe('sourceHierarchy', () => {
  it('groups source samples by registered root and relative folder', () => {
    const hierarchy = buildSourceHierarchy([
      sample('a', 'breaks', 'kick.wav'),
      sample('a', 'breaks', 'one shots/snare.wav'),
      sample('a', 'breaks', 'one shots/hats/open.wav'),
      sample('b', 'field', 'rain.wav'),
    ]);

    expect(hierarchy.roots.map((root) => [root.id, root.label, root.samples.length])).toEqual([
      ['a', 'breaks', 3],
      ['b', 'field', 1],
    ]);
    expect(hierarchy.roots[0]?.groups.map((group) => [group.label, group.breadcrumb, group.samples.map((item) => item.filename)])).toEqual([
      ['samples here', '', ['kick.wav']],
      ['one shots', 'one shots', ['snare.wav']],
      ['hats', 'one shots/hats', ['open.wav']],
    ]);
  });

  it('finds the root and group that contain a selected source sample', () => {
    const selected = sample('a', 'breaks', 'one shots/hats/open.wav');
    const hierarchy = buildSourceHierarchy([
      sample('a', 'breaks', 'kick.wav'),
      selected,
      sample('b', 'field', 'rain.wav'),
    ]);

    expect(findSourceHierarchySelection(hierarchy, selected.absolutePath)).toEqual({
      rootId: 'a',
      groupId: 'a:one shots/hats',
    });
  });

  it('builds folder-level drilldown columns for nested source folders', () => {
    const hierarchy = buildSourceHierarchy([
      sample('a', 'breaks', 'one shots/hats/open.wav'),
      sample('a', 'breaks', 'one shots/hats/closed.wav'),
      sample('a', 'breaks', 'one shots/snare.wav'),
      sample('a', 'breaks', 'loops/top.wav'),
    ]);
    const root = hierarchy.roots[0]!;
    const hats = root.groups.find((group) => group.breadcrumb === 'one shots/hats')!;

    const view = buildSourceHierarchyColumns(root, hats.id);

    expect(view.selectedGroup?.breadcrumb).toBe('one shots/hats');
    expect(view.columns.map((column) => column.groups.map((group) => group.breadcrumb))).toEqual([
      ['loops', 'one shots'],
      ['one shots/hats'],
    ]);
    expect(view.selectedGroup?.samples.map((item) => item.filename)).toEqual([
      'closed.wav',
      'open.wav',
    ]);
  });

  it('keeps parent-only directories navigable without showing empty root clutter', () => {
    const hierarchy = buildSourceHierarchy([
      sample('a', 'breaks', 'deep/folder/kick.wav'),
    ]);
    const root = hierarchy.roots[0]!;

    expect(root.groups.map((group) => [group.label, group.breadcrumb, group.directSampleCount, group.totalSampleCount])).toEqual([
      ['deep', 'deep', 0, 1],
      ['folder', 'deep/folder', 1, 1],
    ]);
  });

  it('builds folder-level drilldown columns for nested source presets', () => {
    const hierarchy = buildSourcePresetHierarchy([
      preset('a', 'packs', 'drums/kicks/nt-punch.preset'),
      preset('a', 'packs', 'drums/snares/nt-crack.preset'),
      preset('a', 'packs', 'keys/nt-mellow.preset'),
    ]);
    const root = hierarchy.roots[0]!;
    const kicks = root.groups.find((group) => group.breadcrumb === 'drums/kicks')!;

    const view = buildSourcePresetHierarchyColumns(root, kicks.id);

    expect(view.selectedGroup?.breadcrumb).toBe('drums/kicks');
    expect(view.columns.map((column) => column.groups.map((group) => group.breadcrumb))).toEqual([
      ['drums', 'keys'],
      ['drums/kicks', 'drums/snares'],
    ]);
    expect(view.selectedGroup?.presets.map((item) => item.name)).toEqual(['nt-punch']);
  });
});
