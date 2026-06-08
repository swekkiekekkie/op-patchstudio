import type { ProjectPatternCell } from '../types/sync';

export function formatPatternPresetLabel(cell: ProjectPatternCell | undefined): string {
  if (!cell) return 'custom';

  if (cell.kind === 'custom') return 'custom';

  if (cell.kind === 'tweaked') {
    const base = cell.preset.trim();
    return base && base !== '—' ? `tweaked (${base})` : 'tweaked';
  }

  const name = cell.preset.trim();
  if (!name || name === '—') return 'custom';
  return name;
}
