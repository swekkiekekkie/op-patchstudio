import type { ReactNode } from 'react';
import type { AppMode } from '../types/navigation';
import { MODE_ORDER } from '../types/navigation';

interface ModeViewportProps {
  mode: AppMode;
  children: Record<AppMode, ReactNode>;
}

export function ModeViewport({ mode, children }: ModeViewportProps) {
  const index = MODE_ORDER.indexOf(mode);
  const offset = index >= 0 ? index * 25 : 0;

  return (
    <div className="mode-viewport">
      <div
        className="mode-track"
        style={{ transform: `translateX(-${offset}%)` }}
      >
        {MODE_ORDER.map((m) => (
          <div key={m} className="mode-panel" data-mode={m}>
            {children[m]}
          </div>
        ))}
      </div>
    </div>
  );
}
