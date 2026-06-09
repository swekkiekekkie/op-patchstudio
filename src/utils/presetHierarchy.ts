import type { CachePresetEntry } from '../types/opxy';

export interface PresetHierarchyGroup {
  id: string;
  label: string;
  presets: CachePresetEntry[];
  kind: 'prefix' | 'loose';
}

export interface PresetHierarchyCategory {
  id: string;
  label: string;
  presets: CachePresetEntry[];
  groups: PresetHierarchyGroup[];
}

export interface PresetHierarchy {
  categories: PresetHierarchyCategory[];
}

function pathKey(path: string): string {
  return path.replace(/\\/g, '/');
}

function presetFolder(preset: CachePresetEntry): string {
  const parts = pathKey(preset.relativePath).split('/').filter(Boolean);
  parts.pop();
  while (parts[0] === 'presets') parts.shift();
  while (parts[0] === 'presets') parts.shift();
  return parts.join('/') || preset.category || 'presets';
}

export function inferPresetPrefix(name: string): string | null {
  const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const hyphenMatch = clean.match(/^([a-z0-9]+-[a-z0-9]+)(?:[\s-].+)?$/);
  if (hyphenMatch?.[1]) return hyphenMatch[1];

  const words = clean.split(' ').filter(Boolean);
  if (words.length >= 3 && words[0]!.length <= 4) return `${words[0]} ${words[1]}`;
  return null;
}

function groupPresets(presets: CachePresetEntry[], repeatedPrefixes: Set<string>): PresetHierarchyGroup[] {
  const byPrefix = new Map<string, CachePresetEntry[]>();
  const loose: CachePresetEntry[] = [];

  for (const preset of presets) {
    const prefix = inferPresetPrefix(preset.name);
    if (!prefix) {
      loose.push(preset);
      continue;
    }
    const list = byPrefix.get(prefix) ?? [];
    list.push(preset);
    byPrefix.set(prefix, list);
  }

  const groups: PresetHierarchyGroup[] = [];
  for (const [prefix, items] of byPrefix) {
    if (!repeatedPrefixes.has(prefix)) {
      loose.push(...items);
      continue;
    }
    groups.push({
      id: `prefix:${prefix}`,
      label: prefix,
      kind: 'prefix',
      presets: items.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  if (loose.length > 0) {
    groups.push({
      id: 'loose',
      label: 'presets',
      kind: 'loose',
      presets: loose.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return groups.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'prefix' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export function buildPresetHierarchy(presets: CachePresetEntry[]): PresetHierarchy {
  const byCategory = new Map<string, CachePresetEntry[]>();
  const prefixCounts = new Map<string, number>();

  for (const preset of presets) {
    const folder = presetFolder(preset);
    const list = byCategory.get(folder) ?? [];
    list.push(preset);
    byCategory.set(folder, list);

    const prefix = inferPresetPrefix(preset.name);
    if (prefix) prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
  }

  const repeatedPrefixes = new Set(
    [...prefixCounts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([prefix]) => prefix),
  );

  const categories = [...byCategory.entries()]
    .map(([folder, items]) => {
      const sorted = items.sort((a, b) => pathKey(a.relativePath).localeCompare(pathKey(b.relativePath)));
      return {
        id: folder,
        label: folder.split('/').at(-1) ?? folder,
        presets: sorted,
        groups: groupPresets(sorted, repeatedPrefixes),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return { categories };
}

export function findPresetHierarchySelection(hierarchy: PresetHierarchy, selectedPath: string | null): {
  categoryId: string | null;
  groupId: string | null;
} {
  if (hierarchy.categories.length === 0) return { categoryId: null, groupId: null };
  const normalized = selectedPath ? pathKey(selectedPath) : null;

  if (normalized) {
    for (const category of hierarchy.categories) {
      for (const group of category.groups) {
        if (group.presets.some((preset) => pathKey(preset.relativePath) === normalized)) {
          return { categoryId: category.id, groupId: group.id };
        }
      }
    }
  }

  const category = hierarchy.categories[0]!;
  return {
    categoryId: category.id,
    groupId: category.groups[0]?.id ?? null,
  };
}
