import type { AppMode } from '../types/navigation';
import { MODE_ORDER, MODE_TAB_LABELS } from '../types/navigation';

interface ModeTabsProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <nav className="mode-tabs" role="tablist" aria-label="mode navigation">
      {MODE_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          className={`mode-tab${mode === m ? ' active' : ''}`}
          data-mode={m}
          aria-selected={mode === m}
          onClick={() => onModeChange(m)}
        >
          {MODE_TAB_LABELS[m]}
        </button>
      ))}
    </nav>
  );
}
