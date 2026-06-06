import { Content, Theme } from '@carbon/react';
import { AppHeader } from './components/common/AppHeader';
import { MainTabs } from './components/common/MainTabs';
import { NotificationSystem } from './components/common/NotificationSystem';
import { AppContextProvider, useAppContext } from './context/AppContext';
import './theme/device-themes.scss';

/** Desktop app: no mobile rotate overlay — run callback immediately. */
export function triggerRotateOverlay(zoomCallback?: () => void): void {
  zoomCallback?.();
}

function AppContent() {
  const { state, dispatch } = useAppContext();

  return (
    <Theme theme="white" className="opxy-theme">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface-tertiary)' }}>
        <Content
          style={{
            padding: '1.5rem 2rem',
            backgroundColor: 'var(--color-surface-tertiary)',
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <AppHeader />
          <MainTabs />
          <NotificationSystem
            notifications={state.notifications}
            onDismiss={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })}
          />
        </Content>
      </div>
    </Theme>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}
