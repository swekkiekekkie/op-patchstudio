import type { AppTab } from '../../types/opxy';

interface TabNavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'device', label: 'device' },
  { id: 'drum', label: 'drum' },
  { id: 'multisample', label: 'multisample' },
];

export function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  const tabStyle = {
    padding: '0.75rem 1.5rem',
    border: '1px solid var(--color-border-subtle)',
    borderBottom: 'none',
    borderRadius: '15px 15px 0 0',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    cursor: 'pointer',
    marginRight: '2px',
  };

  const activeTabStyle = {
    ...tabStyle,
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    marginBottom: '-1px',
  };

  return (
    <div
      role="tablist"
      aria-label="main navigation tabs"
      style={{
        display: 'flex',
        marginBottom: 0,
        borderBottom: '1px solid var(--color-border-subtle)',
        marginLeft: '16px',
      }}
    >
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={currentTab === id}
          style={currentTab === id ? activeTabStyle : tabStyle}
          onClick={() => onTabChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
