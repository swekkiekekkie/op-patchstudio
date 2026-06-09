import { describe, expect, it } from 'vitest';
import type { CachePresetEntry } from '../../types/opxy';
import { buildPresetHierarchy, findPresetHierarchySelection, inferPresetPrefix } from '../../utils/presetHierarchy';

function preset(relativePath: string, name: string, overrides: Partial<CachePresetEntry> = {}): CachePresetEntry {
  return {
    relativePath,
    category: relativePath.split('/').at(-2) ?? 'presets',
    name,
    type: 'drum',
    sampleBased: true,
    sampleCount: 24,
    unnamedCount: 0,
    ...overrides,
  };
}

describe('presetHierarchy', () => {
  it('infers stable author prefixes without requiring a fixed folder structure', () => {
    expect(inferPresetPrefix('nt-cuckoo fx')).toBe('nt-cuckoo');
    expect(inferPresetPrefix('nt-cuckoo kicks')).toBe('nt-cuckoo');
    expect(inferPresetPrefix('clean kit')).toBeNull();
  });

  it('builds category and repeated-prefix groups from preset paths', () => {
    const hierarchy = buildPresetHierarchy([
      preset('presets/presets/fx/nt-cuckoo fx.preset', 'nt-cuckoo fx'),
      preset('presets/presets/kicks/nt-cuckoo kicks.preset', 'nt-cuckoo kicks'),
      preset('presets/presets/kicks/nt-kicks 01.preset', 'nt-kicks 01'),
      preset('presets/presets/kicks/nt-kicks 02.preset', 'nt-kicks 02'),
      preset('presets/presets/kicks/warm punch.preset', 'warm punch'),
    ]);

    expect(hierarchy.categories.map((category) => category.id)).toEqual(['fx', 'kicks']);
    const kicks = hierarchy.categories.find((category) => category.id === 'kicks');
    expect(kicks?.groups.map((group) => [group.id, group.presets.map((item) => item.name)])).toEqual([
      ['prefix:nt-cuckoo', ['nt-cuckoo kicks']],
      ['prefix:nt-kicks', ['nt-kicks 01', 'nt-kicks 02']],
      ['loose', ['warm punch']],
    ]);
  });

  it('finds the category and group that contain the selected preset', () => {
    const hierarchy = buildPresetHierarchy([
      preset('presets/presets/drum/nt-apes are us.preset', 'nt-apes are us'),
      preset('presets/presets/drum/nt-apes kit.preset', 'nt-apes kit'),
      preset('presets/presets/bass/nt-equinox.preset', 'nt-equinox', { type: 'prism', sampleBased: false, sampleCount: 0 }),
    ]);

    expect(findPresetHierarchySelection(hierarchy, 'presets/presets/drum/nt-apes kit.preset')).toEqual({
      categoryId: 'drum',
      groupId: 'prefix:nt-apes',
    });
  });
});
