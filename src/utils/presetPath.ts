/** Category folder under cache `presets/` (e.g. drum, user, factory). */
export function categoryFromPresetPath(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  const presetsIdx = parts.indexOf('presets');
  if (presetsIdx >= 0 && parts.length > presetsIdx + 2) {
    return parts[presetsIdx + 1]!;
  }
  return parts[1] ?? 'user';
}
