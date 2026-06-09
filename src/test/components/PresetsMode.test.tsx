// @vitest-environment jsdom

import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShellProvider, useAppShell } from '../../navigation/AppShellContext';
import type { CachePresetEntry } from '../../types/opxy';

vi.mock('../../modes/presets/PresetDetailPane', () => ({
  PresetDetailPane: () => <div data-testid="preset-detail" />,
}));

import { PresetsMode } from '../../modes/presets/PresetsMode';

const presets: CachePresetEntry[] = [
  {
    relativePath: 'presets/synth/low choir.preset',
    category: 'synth',
    name: 'low choir',
    type: 'prism',
    sampleBased: false,
    sampleCount: 0,
  },
  {
    relativePath: 'presets/drum/clean kit.preset',
    category: 'drum',
    name: 'clean kit',
    type: 'drum',
    sampleBased: true,
    sampleCount: 24,
  },
];

function PresetsModeWithSearch({ query }: { query: string }) {
  const { navigate } = useAppShell();

  useEffect(() => {
    navigate({ mode: 'presets', presetSearchQuery: query });
  }, [navigate, query]);

  return (
    <PresetsMode
      presets={presets}
      dirtyPresets={[]}
      busy={false}
      onRenamed={vi.fn()}
    />
  );
}

describe('PresetsMode', () => {
  it('applies preset search from navigation state', async () => {
    render(
      <AppShellProvider>
        <PresetsModeWithSearch query="low choir" />
      </AppShellProvider>,
    );

    expect(await screen.findByDisplayValue('low choir')).toBeInTheDocument();
    expect(screen.getByText('low choir')).toBeInTheDocument();
    expect(screen.queryByText('clean kit')).not.toBeInTheDocument();
  });
});
