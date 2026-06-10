import type { CacheSampleEntry } from '../types/opxy';

export interface SetSampleGroup {
  id: string;
  label: string;
  folderId: string;
  samples: CacheSampleEntry[];
  sampleCount: number;
  unnamedCount: number;
  noteSummary: string;
}

export interface SetSampleFolder {
  id: string;
  label: string;
  path: string;
  samples: CacheSampleEntry[];
  groups: SetSampleGroup[];
  sampleCount: number;
  unnamedCount: number;
}

export interface SetSampleHierarchy {
  folders: SetSampleFolder[];
}

function sampleDir(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

function folderLabel(path: string): string {
  if (!path) return 'samples';
  return path.split('/').filter(Boolean).join(' / ');
}

function sortSamples(a: CacheSampleEntry, b: CacheSampleEntry): number {
  return a.base.localeCompare(b.base) || a.note.localeCompare(b.note) || a.idx - b.idx || a.filename.localeCompare(b.filename);
}

function noteSummary(samples: CacheSampleEntry[]): string {
  const notes = [...new Set(samples.map((sample) => sample.note).filter(Boolean))];
  if (notes.length === 0) return `${samples.length} files`;
  if (notes.length <= 3) return notes.join(' · ');
  return `${notes[0]}-${notes[notes.length - 1]}`;
}

export function buildSetSampleHierarchy(samples: CacheSampleEntry[]): SetSampleHierarchy {
  const foldersByPath = new Map<string, CacheSampleEntry[]>();

  for (const sample of samples) {
    const dir = sampleDir(sample.relativePath);
    const list = foldersByPath.get(dir) ?? [];
    list.push(sample);
    foldersByPath.set(dir, list);
  }

  const folders = [...foldersByPath.entries()]
    .map(([path, folderSamples]) => {
      const sortedSamples = [...folderSamples].sort(sortSamples);
      const groupsByBase = new Map<string, CacheSampleEntry[]>();

      for (const sample of sortedSamples) {
        const list = groupsByBase.get(sample.base) ?? [];
        list.push(sample);
        groupsByBase.set(sample.base, list);
      }

      const folderId = path || '.';
      // Real variant groups need 2+ files sharing a parsed base-note-idx base;
      // everything else (unparsed names, singletons) goes into one loose group
      // instead of useless one-file pseudo-groups.
      const looseSamples: CacheSampleEntry[] = [];
      const groups: SetSampleGroup[] = [];

      for (const [base, groupSamples] of groupsByBase.entries()) {
        const sortedGroupSamples = [...groupSamples].sort(sortSamples);
        const isVariantGroup = sortedGroupSamples.length >= 2 && sortedGroupSamples.some((sample) => sample.note);
        if (!isVariantGroup) {
          looseSamples.push(...sortedGroupSamples);
          continue;
        }
        groups.push({
          id: `${folderId}:${base}`,
          label: base,
          folderId,
          samples: sortedGroupSamples,
          sampleCount: sortedGroupSamples.length,
          unnamedCount: sortedGroupSamples.filter((sample) => sample.isUnnamed).length,
          noteSummary: noteSummary(sortedGroupSamples),
        });
      }

      groups.sort((a, b) => a.label.localeCompare(b.label));

      if (looseSamples.length > 0) {
        const sortedLoose = looseSamples.sort(sortSamples);
        groups.push({
          id: `${folderId}:__loose`,
          label: 'loose files',
          folderId,
          samples: sortedLoose,
          sampleCount: sortedLoose.length,
          unnamedCount: sortedLoose.filter((sample) => sample.isUnnamed).length,
          noteSummary: `${sortedLoose.length} files`,
        });
      }

      return {
        id: folderId,
        label: folderLabel(path),
        path,
        samples: sortedSamples,
        groups,
        sampleCount: sortedSamples.length,
        unnamedCount: sortedSamples.filter((sample) => sample.isUnnamed).length,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return { folders };
}

export function findSetSampleHierarchySelection(
  hierarchy: SetSampleHierarchy,
  selectedRelativePath: string | null,
): {
  folderId: string | null;
  groupId: string | null;
} {
  if (hierarchy.folders.length === 0) return { folderId: null, groupId: null };

  if (selectedRelativePath) {
    for (const folder of hierarchy.folders) {
      for (const group of folder.groups) {
        if (group.samples.some((sample) => sample.relativePath === selectedRelativePath)) {
          return { folderId: folder.id, groupId: group.id };
        }
      }
    }
  }

  const folder = hierarchy.folders[0]!;
  return { folderId: folder.id, groupId: folder.groups[0]?.id ?? null };
}
