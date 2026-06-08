/** In-memory dirty tracking for cache edits (per preset path). */
const dirtyPresets = new Set<string>();

export function markPresetDirty(relativePath: string): void {
  dirtyPresets.add(relativePath.replace(/\\/g, '/'));
}

export function clearPresetDirty(relativePath: string): void {
  dirtyPresets.delete(relativePath.replace(/\\/g, '/'));
}

export function isPresetDirty(relativePath: string): boolean {
  return dirtyPresets.has(relativePath.replace(/\\/g, '/'));
}

export function listDirtyPresets(): string[] {
  return [...dirtyPresets];
}

export function clearAllDirty(): void {
  dirtyPresets.clear();
}
