import type { ProjectPatternCell } from '../types/sync';

export function formatPatternPresetLabel(cell: ProjectPatternCell | undefined): string {
  if (!cell) return 'empty';

  const name = cell.preset.trim();
  if (cell.kind === 'custom') return name && name !== '—' && name !== '-' ? name : 'custom';

  if (cell.kind === 'tweaked') {
    return name && name !== '—' && name !== '-' ? `tweaked (${name})` : 'tweaked';
  }

  if (!name || name === '—' || name === '-') return 'empty';
  return name;
}
