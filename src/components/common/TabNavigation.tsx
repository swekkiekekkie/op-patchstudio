import { useState } from 'react';
import type { AppTab } from '../../types/opxy';
import { UI_CONSTANTS } from '../../utils/constants';

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
  const [hoveredTab, setHoveredTab] = useState<AppTab | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

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
    minHeight: `${UI_CONSTANTS.TOUCH_TARGET_MIN}px`,
  };

  const activeTabStyle = {
    ...tabStyle,
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    marginBottom: '-1px',
  };

  const hoveredTabStyle = {
    ...tabStyle,
    background: 'var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabId: AppTab) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === tabId);
    if (currentIndex < 0) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onTabChange(TABS[(currentIndex + 1) % TABS.length].id);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onTabChange(TABS[(currentIndex - 1 + TABS.length) % TABS.length].id);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onTabChange(TABS[0].id);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      onTabChange(TABS[TABS.length - 1].id);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTabChange(tabId);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="main navigation tabs"
      aria-orientation="horizontal"
      style={{
        display: 'flex',
        marginBottom: 0,
        borderBottom: '1px solid var(--color-border-subtle)',
        marginLeft: isMobile ? '8px' : '16px',
        marginRight: isMobile ? '8px' : undefined,
      }}
    >
      {TABS.map(({ id, label }) => {
        const isActive = currentTab === id;
        const isHovered = hoveredTab === id && !isActive;

        return (
          <button
            key={id}
            id={`${id}-tab`}
            type="button"
            role="tab"
            aria-label={`${label} tab`}
            aria-selected={isActive}
            aria-controls={`${id}-panel`}
            tabIndex={isActive ? 0 : -1}
            style={isActive ? activeTabStyle : isHovered ? hoveredTabStyle : tabStyle}
            onClick={() => onTabChange(id)}
            onKeyDown={(event) => handleKeyDown(event, id)}
            onMouseEnter={() => setHoveredTab(id)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
