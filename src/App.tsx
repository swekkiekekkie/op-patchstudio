import { AppContextProvider } from './context/AppContext';
import { ShellApp } from './app/ShellApp';
import './theme/device-themes.scss';

/** Desktop app: no mobile rotate overlay — run callback immediately. */
export function triggerRotateOverlay(zoomCallback?: () => void): void {
  zoomCallback?.();
}

export default function App() {
  return (
    <AppContextProvider>
      <ShellApp />
    </AppContextProvider>
  );
}
