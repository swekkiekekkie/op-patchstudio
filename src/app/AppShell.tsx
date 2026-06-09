import type { ReactNode } from 'react';
import type { AppMode } from '../types/navigation';
import { ModeTabs } from './ModeTabs';
import { ModeViewport } from './ModeViewport';
import { StatusStrip } from './StatusStrip';
import '../ui/ui-kit.scss';
import '../theme/shell.scss';
import '../theme/mode-screens.scss';
import '../theme/data-projects.scss';
import '../theme/preset-editor.scss';

interface AppShellProps {
  connected: boolean;
  meta?: string;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  modes: Record<AppMode, ReactNode>;
}

export function AppShell({
  connected,
  meta,
  mode,
  onModeChange,
  modes,
}: AppShellProps) {
  return (
    <div className={`app-shell shell-mode-${mode}`}>
      <StatusStrip connected={connected} meta={meta} />
      <main className="shell-content">
        <ModeViewport mode={mode}>{modes}</ModeViewport>
      </main>
      <ModeTabs mode={mode} onModeChange={onModeChange} />
    </div>
  );
}
