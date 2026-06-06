import { useAppContext } from '../../context/AppContext';
import { DrumTool } from '../drum/DrumTool';
import { MultisampleTool } from '../multisample/MultisampleTool';
import { DevicePage } from '../device/DevicePage';
import { TabNavigation } from './TabNavigation';
import type { AppTab } from '../../types/opxy';

export function MainTabs() {
  const { state, dispatch } = useAppContext();

  const handleTabChange = (tab: AppTab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  };

  const panelStyle = {
    background: 'var(--color-bg-primary)',
    borderRadius: '15px',
    border: '1px solid var(--color-border-subtle)',
    borderTop: 'none',
    minHeight: '500px',
    overflow: 'hidden' as const,
  };

  return (
    <div role="tabpanel" aria-label="main application content" style={{ marginBottom: '2rem' }}>
      <TabNavigation currentTab={state.currentTab} onTabChange={handleTabChange} />

      {state.currentTab === 'device' && (
        <div role="tabpanel" id="device-tabpanel" style={panelStyle}>
          <DevicePage />
        </div>
      )}
      {state.currentTab === 'drum' && (
        <div role="tabpanel" id="drum-tabpanel" style={panelStyle}>
          <DrumTool />
        </div>
      )}
      {state.currentTab === 'multisample' && (
        <div role="tabpanel" id="multisample-tabpanel" style={panelStyle}>
          <MultisampleTool />
        </div>
      )}
    </div>
  );
}
