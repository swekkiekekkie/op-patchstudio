import type { SourcePresetEntry, SourceSampleEntry } from '../types/opxy';

export interface SourceHierarchyGroup {
  id: string;
  label: string;
  breadcrumb: string;
  parentId: string | null;
  childGroupIds: string[];
  depth: number;
  directSampleCount: number;
  totalSampleCount: number;
  samples: SourceSampleEntry[];
}

export interface SourceHierarchyRoot {
  id: string;
  label: string;
  samples: SourceSampleEntry[];
  groups: SourceHierarchyGroup[];
}

export interface SourceHierarchy {
  roots: SourceHierarchyRoot[];
}

export interface SourceHierarchyColumn {
  id: string;
  label: string;
  groups: SourceHierarchyGroup[];
  selectedGroupId: string | null;
}

export interface SourcePresetHierarchyGroup {
  id: string;
  label: string;
  breadcrumb: string;
  parentId: string | null;
  childGroupIds: string[];
  depth: number;
  directPresetCount: number;
  totalPresetCount: number;
  presets: SourcePresetEntry[];
}

export interface SourcePresetHierarchyRoot {
  id: string;
  label: string;
  presets: SourcePresetEntry[];
  groups: SourcePresetHierarchyGroup[];
}

export interface SourcePresetHierarchy {
  roots: SourcePresetHierarchyRoot[];
}

export interface SourcePresetHierarchyColumn {
  id: string;
  label: string;
  groups: SourcePresetHierarchyGroup[];
  selectedGroupId: string | null;
}

function sourceDir(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

function dirLabel(dir: string): string {
  if (!dir) return 'samples here';
  return dir.split('/').at(-1) ?? dir;
}

function presetDirLabel(dir: string): string {
  if (!dir) return 'presets here';
  return dirLabel(dir);
}

function groupId(folderId: string, dir: string): string {
  return `${folderId}:${dir || '.'}`;
}

function parentDir(dir: string): string | null {
  if (!dir) return null;
  const parts = dir.split('/').filter(Boolean);
  parts.pop();
  return parts.length > 0 ? parts.join('/') : null;
}

function ancestorDirs(dir: string): string[] {
  if (!dir) return [''];
  const parts = dir.split('/').filter(Boolean);
  const dirs: string[] = [];
  for (let i = 1; i <= parts.length; i += 1) {
    dirs.push(parts.slice(0, i).join('/'));
  }
  return dirs;
}

export function buildSourceHierarchy(samples: SourceSampleEntry[]): SourceHierarchy {
  const byRoot = new Map<string, SourceSampleEntry[]>();

  for (const sample of samples) {
    const list = byRoot.get(sample.folderId) ?? [];
    list.push(sample);
    byRoot.set(sample.folderId, list);
  }

  const roots = [...byRoot.entries()]
    .map(([folderId, items]) => {
      const sorted = items.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      const label = sorted[0]?.folderLabel ?? folderId;
      const byDir = new Map<string, SourceSampleEntry[]>();

      for (const sample of sorted) {
        const dir = sourceDir(sample.relativePath);
        for (const ancestor of ancestorDirs(dir)) {
          if (!byDir.has(ancestor)) byDir.set(ancestor, []);
        }
        byDir.get(dir)!.push(sample);
      }

      const childIdsByParent = new Map<string | null, string[]>();
      for (const dir of byDir.keys()) {
        const parent = parentDir(dir);
        const parentId = parent == null ? null : groupId(folderId, parent);
        const childIds = childIdsByParent.get(parentId) ?? [];
        childIds.push(groupId(folderId, dir));
        childIdsByParent.set(parentId, childIds);
      }

      const descendantCount = (dir: string): number => {
        const prefix = dir ? `${dir}/` : '';
        return sorted.filter((sample) => {
          const sampleDir = sourceDir(sample.relativePath);
          return sampleDir === dir || (prefix && sampleDir.startsWith(prefix));
        }).length;
      };

      return {
        id: folderId,
        label,
        samples: sorted,
        groups: [...byDir.entries()]
          .map(([dir, groupSamples]) => ({
            id: groupId(folderId, dir),
            label: dirLabel(dir),
            breadcrumb: dir,
            parentId: parentDir(dir) == null ? null : groupId(folderId, parentDir(dir)!),
            childGroupIds: (childIdsByParent.get(groupId(folderId, dir)) ?? [])
              .filter((id) => id !== groupId(folderId, dir))
              .sort(),
            depth: dir ? dir.split('/').filter(Boolean).length - 1 : 0,
            directSampleCount: groupSamples.length,
            totalSampleCount: descendantCount(dir),
            samples: groupSamples.sort((a, b) => a.filename.localeCompare(b.filename)),
          }))
          .sort((a, b) => a.breadcrumb.localeCompare(b.breadcrumb)),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return { roots };
}

export function findSourceHierarchySelection(hierarchy: SourceHierarchy, selectedSamplePath: string | null): {
  rootId: string | null;
  groupId: string | null;
} {
  if (hierarchy.roots.length === 0) return { rootId: null, groupId: null };

  if (selectedSamplePath) {
    for (const root of hierarchy.roots) {
      for (const group of root.groups) {
        if (group.samples.some((sample) => sample.absolutePath === selectedSamplePath)) {
          return { rootId: root.id, groupId: group.id };
        }
      }
    }
  }

  const root = hierarchy.roots[0]!;
  return {
    rootId: root.id,
    groupId: root.groups[0]?.id ?? null,
  };
}

export function buildSourceHierarchyColumns(
  root: SourceHierarchyRoot | null,
  selectedGroupId: string | null,
): {
  columns: SourceHierarchyColumn[];
  selectedGroup: SourceHierarchyGroup | null;
} {
  if (!root || root.groups.length === 0) {
    return { columns: [], selectedGroup: null };
  }

  const groupsById = new Map(root.groups.map((group) => [group.id, group]));
  const selectedGroup = (selectedGroupId ? groupsById.get(selectedGroupId) : null) ?? root.groups[0] ?? null;
  if (!selectedGroup) return { columns: [], selectedGroup: null };

  const selectedPath: SourceHierarchyGroup[] = [];
  let cursor: SourceHierarchyGroup | undefined = selectedGroup;
  while (cursor) {
    selectedPath.unshift(cursor);
    cursor = cursor.parentId ? groupsById.get(cursor.parentId) : undefined;
  }

  const siblingGroups = (parentId: string | null): SourceHierarchyGroup[] =>
    root.groups
      .filter((group) => group.parentId === parentId)
      .sort((a, b) => a.label.localeCompare(b.label) || a.breadcrumb.localeCompare(b.breadcrumb));

  const columns: SourceHierarchyColumn[] = [];
  let parentId: string | null = null;
  for (const pathGroup of selectedPath) {
    columns.push({
      id: `${root.id}:${parentId ?? 'root'}`,
      label: parentId == null ? 'folders' : groupsById.get(parentId)?.label ?? 'folders',
      groups: siblingGroups(parentId),
      selectedGroupId: pathGroup.id,
    });
    parentId = pathGroup.id;
  }

  const childGroups = siblingGroups(selectedGroup.id);
  if (childGroups.length > 0) {
    columns.push({
      id: `${root.id}:${selectedGroup.id}:children`,
      label: selectedGroup.label,
      groups: childGroups,
      selectedGroupId: null,
    });
  }

  return { columns, selectedGroup };
}

export function buildSourcePresetHierarchy(presets: SourcePresetEntry[]): SourcePresetHierarchy {
  const byRoot = new Map<string, SourcePresetEntry[]>();

  for (const preset of presets) {
    const list = byRoot.get(preset.folderId) ?? [];
    list.push(preset);
    byRoot.set(preset.folderId, list);
  }

  const roots = [...byRoot.entries()]
    .map(([folderId, items]) => {
      const sorted = items.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      const label = sorted[0]?.folderLabel ?? folderId;
      const byDir = new Map<string, SourcePresetEntry[]>();

      for (const preset of sorted) {
        const dir = sourceDir(preset.relativePath);
        for (const ancestor of ancestorDirs(dir)) {
          if (!byDir.has(ancestor)) byDir.set(ancestor, []);
        }
        byDir.get(dir)!.push(preset);
      }

      const childIdsByParent = new Map<string | null, string[]>();
      for (const dir of byDir.keys()) {
        const parent = parentDir(dir);
        const parentId = parent == null ? null : groupId(folderId, parent);
        const childIds = childIdsByParent.get(parentId) ?? [];
        childIds.push(groupId(folderId, dir));
        childIdsByParent.set(parentId, childIds);
      }

      const descendantCount = (dir: string): number => {
        const prefix = dir ? `${dir}/` : '';
        return sorted.filter((preset) => {
          const presetDir = sourceDir(preset.relativePath);
          return presetDir === dir || (prefix && presetDir.startsWith(prefix));
        }).length;
      };

      return {
        id: folderId,
        label,
        presets: sorted,
        groups: [...byDir.entries()]
          .map(([dir, groupPresets]) => ({
            id: groupId(folderId, dir),
            label: presetDirLabel(dir),
            breadcrumb: dir,
            parentId: parentDir(dir) == null ? null : groupId(folderId, parentDir(dir)!),
            childGroupIds: (childIdsByParent.get(groupId(folderId, dir)) ?? [])
              .filter((id) => id !== groupId(folderId, dir))
              .sort(),
            depth: dir ? dir.split('/').filter(Boolean).length - 1 : 0,
            directPresetCount: groupPresets.length,
            totalPresetCount: descendantCount(dir),
            presets: groupPresets.sort((a, b) => a.name.localeCompare(b.name)),
          }))
          .sort((a, b) => a.breadcrumb.localeCompare(b.breadcrumb)),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return { roots };
}

export function findSourcePresetHierarchySelection(hierarchy: SourcePresetHierarchy, selectedPresetId: string | null): {
  rootId: string | null;
  groupId: string | null;
} {
  if (hierarchy.roots.length === 0) return { rootId: null, groupId: null };

  if (selectedPresetId) {
    for (const root of hierarchy.roots) {
      for (const group of root.groups) {
        if (group.presets.some((preset) => preset.id === selectedPresetId)) {
          return { rootId: root.id, groupId: group.id };
        }
      }
    }
  }

  const root = hierarchy.roots[0]!;
  return {
    rootId: root.id,
    groupId: root.groups[0]?.id ?? null,
  };
}

export function buildSourcePresetHierarchyColumns(
  root: SourcePresetHierarchyRoot | null,
  selectedGroupId: string | null,
): {
  columns: SourcePresetHierarchyColumn[];
  selectedGroup: SourcePresetHierarchyGroup | null;
} {
  if (!root || root.groups.length === 0) {
    return { columns: [], selectedGroup: null };
  }

  const groupsById = new Map(root.groups.map((group) => [group.id, group]));
  const selectedGroup = (selectedGroupId ? groupsById.get(selectedGroupId) : null) ?? root.groups[0] ?? null;
  if (!selectedGroup) return { columns: [], selectedGroup: null };

  const selectedPath: SourcePresetHierarchyGroup[] = [];
  let cursor: SourcePresetHierarchyGroup | undefined = selectedGroup;
  while (cursor) {
    selectedPath.unshift(cursor);
    cursor = cursor.parentId ? groupsById.get(cursor.parentId) : undefined;
  }

  const siblingGroups = (parentId: string | null): SourcePresetHierarchyGroup[] =>
    root.groups
      .filter((group) => group.parentId === parentId)
      .sort((a, b) => a.label.localeCompare(b.label) || a.breadcrumb.localeCompare(b.breadcrumb));

  const columns: SourcePresetHierarchyColumn[] = [];
  let parentId: string | null = null;
  for (const pathGroup of selectedPath) {
    columns.push({
      id: `${root.id}:${parentId ?? 'root'}`,
      label: parentId == null ? 'folders' : groupsById.get(parentId)?.label ?? 'folders',
      groups: siblingGroups(parentId),
      selectedGroupId: pathGroup.id,
    });
    parentId = pathGroup.id;
  }

  const childGroups = siblingGroups(selectedGroup.id);
  if (childGroups.length > 0) {
    columns.push({
      id: `${root.id}:${selectedGroup.id}:children`,
      label: selectedGroup.label,
      groups: childGroups,
      selectedGroupId: null,
    });
  }

  return { columns, selectedGroup };
}
