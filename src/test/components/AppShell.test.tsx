// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppShell } from '../../app/AppShell';

const modes = {
  data: <div>data panel content</div>,
  projects: <div>projects panel content</div>,
  presets: <div>presets panel content</div>,
  samples: <div>samples panel content</div>,
};

describe('AppShell', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders all 4 mode labels in tab bar', () => {
    render(
      <AppShell
        connected
        mode="data"
        onModeChange={vi.fn()}
        modes={modes}
      />,
    );

    expect(screen.getByRole('tab', { name: 'data' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'proj' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'pre' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'smp' })).toBeInTheDocument();
  });

  it('clicking pre calls onModeChange with presets', () => {
    const onModeChange = vi.fn();
    render(
      <AppShell
        connected
        mode="data"
        onModeChange={onModeChange}
        modes={modes}
      />,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.click(within(tablist).getByRole('tab', { name: /^pre$/ }));
    expect(onModeChange).toHaveBeenCalledWith('presets');
  });

  it('active mode panel content visible', () => {
    render(
      <AppShell
        connected
        mode="presets"
        onModeChange={vi.fn()}
        modes={modes}
      />,
    );

    const panel = document.querySelector('[data-mode="presets"]');
    expect(panel).not.toBeNull();
    expect(
      within(panel as HTMLElement).getByText('presets panel content'),
    ).toBeVisible();
  });
});
