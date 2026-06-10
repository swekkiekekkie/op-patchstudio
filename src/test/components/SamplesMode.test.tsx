// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SamplesMode } from '../../modes/samples/SamplesMode';
import { AppShellProvider } from '../../navigation/AppShellContext';
import type { CacheSampleEntry, SourceFolderEntry, SourcePresetEntry, SourceSampleEntry } from '../../types/opxy';

const folder: SourceFolderEntry = {
  id: 'breaks-root',
  path: 'C:/samples/breaks',
  label: 'breaks',
  sampleCount: 3,
  presetCount: 0,
  lastScannedAt: 1,
  flags: [],
};

function sourceSample(relativePath: string): SourceSampleEntry {
  const filename = relativePath.split('/').at(-1) ?? relativePath;
  return {
    id: `breaks-root:${relativePath}`,
    folderId: folder.id,
    folderLabel: folder.label,
    absolutePath: `${folder.path}/${relativePath}`,
    relativePath,
    filename,
    extension: filename.split('.').at(-1) ?? 'wav',
    sizeBytes: 1,
    mtimeMs: 1,
    alreadyInSet: false,
  };
}

function sourcePreset(relativePath: string, overrides: Partial<SourcePresetEntry> = {}): SourcePresetEntry {
  const folderName = relativePath.split('/').at(-1) ?? relativePath;
  return {
    id: `breaks-root:${relativePath}`,
    folderId: folder.id,
    folderLabel: folder.label,
    absolutePath: `${folder.path}/${relativePath}`,
    relativePath,
    folderName,
    name: folderName.replace(/\.preset$/i, ''),
    type: 'drum',
    sampleRefs: [],
    availableSampleRefs: [],
    missingSampleRefs: [],
    mtimeMs: 1,
    alreadyInSet: false,
    flags: [],
    ...overrides,
  };
}

function setSample(relativePath: string, overrides: Partial<CacheSampleEntry> = {}): CacheSampleEntry {
  const filename = relativePath.split('/').at(-1) ?? relativePath;
  return {
    relativePath,
    filename,
    base: filename.replace(/-[a-g]#?\d+-\d+\.\w+$/i, ''),
    note: filename.match(/-([a-g]#?\d+)-\d+\.\w+$/i)?.[1]?.toLowerCase() ?? '',
    idx: Number(filename.match(/-(\d+)\.\w+$/)?.[1] ?? 0),
    isUnnamed: false,
    ...overrides,
  };
}

describe('SamplesMode', () => {
  it('groups set samples by folder and base before showing suffix variants', () => {
    render(
      <AppShellProvider>
        <SamplesMode
          samples={[
            setSample('samples/user/kit-a-c3-0.wav', { base: 'kit-a', note: 'c3', idx: 0 }),
            setSample('samples/user/kit-a-c3-1.wav', { base: 'kit-a', note: 'c3', idx: 1, isUnnamed: true }),
            setSample('samples/user/kit-b-d3-0.wav', { base: 'kit-b', note: 'd3', idx: 0 }),
          ]}
          sourceFolders={[]}
          sourceSamples={[]}
          sourcePresets={[]}
          busy={false}
          onRefresh={vi.fn()}
          onAddSourceFolder={vi.fn()}
          onRemoveSourceFolder={vi.fn()}
          onScanSourceFolders={vi.fn()}
          onCopySourceSamplesToSet={vi.fn()}
          onCopySourcePresetsToSet={vi.fn()}
        />
      </AppShellProvider>,
    );

    expect(screen.getByLabelText('set sample folders')).toHaveTextContent('samples / user');
    expect(screen.getByLabelText('set sample groups')).toHaveTextContent('kit-a');
    expect(screen.getByLabelText('set sample groups')).toHaveTextContent('loose files');
    expect(screen.getByLabelText('set sample files')).toHaveTextContent('kit-a-c3-0.wav');
    expect(screen.getByLabelText('set sample files')).toHaveTextContent('kit-a-c3-1.wav');
    expect(screen.getByLabelText('set sample files')).not.toHaveTextContent('kit-b-d3-0.wav');

    fireEvent.click(within(screen.getByLabelText('set sample groups')).getByText('loose files'));

    expect(screen.getByLabelText('set sample files')).toHaveTextContent('kit-b-d3-0.wav');
    expect(screen.getByLabelText('set sample files')).not.toHaveTextContent('kit-a-c3-0.wav');
  });

  it('drills into nested source sample folders one level at a time', () => {
    render(
      <AppShellProvider>
        <SamplesMode
          samples={[]}
          sourceFolders={[folder]}
          sourceSamples={[
            sourceSample('one shots/hats/open.wav'),
            sourceSample('one shots/snare.wav'),
            sourceSample('loops/top.wav'),
          ]}
          sourcePresets={[]}
          busy={false}
          onRefresh={vi.fn()}
          onAddSourceFolder={vi.fn()}
          onRemoveSourceFolder={vi.fn()}
          onScanSourceFolders={vi.fn()}
          onCopySourceSamplesToSet={vi.fn()}
          onCopySourcePresetsToSet={vi.fn()}
        />
      </AppShellProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'source' }));

    const rootFolders = screen.getByLabelText('source folders in selected root');
    expect(within(rootFolders).getByText('loops')).toBeInTheDocument();
    expect(within(rootFolders).getByText('one shots')).toBeInTheDocument();
    expect(within(rootFolders).queryByText('hats')).not.toBeInTheDocument();

    fireEvent.click(within(rootFolders).getByText('one shots'));

    expect(screen.getByLabelText('source folders in one shots')).toHaveTextContent('hats');
    expect(screen.getByLabelText('source samples')).toHaveTextContent('snare');
    expect(screen.getByLabelText('source samples')).not.toHaveTextContent('open');

    fireEvent.click(within(screen.getByLabelText('source folders in one shots')).getByText('hats'));

    expect(screen.getByLabelText('source samples')).toHaveTextContent('open');
    expect(screen.getByLabelText('source samples')).not.toHaveTextContent('snare');
  });

  it('drills into nested source preset folders one level at a time', () => {
    render(
      <AppShellProvider>
        <SamplesMode
          samples={[]}
          sourceFolders={[{ ...folder, sampleCount: 0, presetCount: 3 }]}
          sourceSamples={[]}
          sourcePresets={[
            sourcePreset('drums/kicks/nt-punch.preset'),
            sourcePreset('drums/snares/nt-crack.preset'),
            sourcePreset('keys/nt-mellow.preset'),
          ]}
          busy={false}
          onRefresh={vi.fn()}
          onAddSourceFolder={vi.fn()}
          onRemoveSourceFolder={vi.fn()}
          onScanSourceFolders={vi.fn()}
          onCopySourceSamplesToSet={vi.fn()}
          onCopySourcePresetsToSet={vi.fn()}
        />
      </AppShellProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'source' }));
    fireEvent.click(screen.getByRole('tab', { name: 'presets' }));

    const rootFolders = screen.getByLabelText('source preset folders in selected root');
    expect(within(rootFolders).getByText('drums')).toBeInTheDocument();
    expect(within(rootFolders).getByText('keys')).toBeInTheDocument();
    expect(within(rootFolders).queryByText('kicks')).not.toBeInTheDocument();

    fireEvent.click(within(rootFolders).getByText('drums'));

    expect(screen.getByLabelText('source preset folders in drums')).toHaveTextContent('kicks');
    expect(screen.getByLabelText('source presets')).not.toHaveTextContent('nt-punch');

    fireEvent.click(within(screen.getByLabelText('source preset folders in drums')).getByText('kicks'));

    expect(screen.getByLabelText('source presets')).toHaveTextContent('nt-punch');
    expect(screen.getByLabelText('source presets')).not.toHaveTextContent('nt-crack');
  });

  it('copies the selected source preset folder into the set', () => {
    const copySourcePresetsToSet = vi.fn().mockResolvedValue({
      ok: true,
      copied: [{ sourcePath: `${folder.path}/keys/nt-mellow.preset`, targetRelativePath: 'presets/user/nt-mellow.preset' }],
      replaced: [],
      skipped: [],
      conflicts: [],
      sampleResult: { ok: true, copied: [], replaced: [], skipped: [], conflicts: [] },
      missingSampleRefs: [],
    });

    render(
      <AppShellProvider>
        <SamplesMode
          samples={[]}
          sourceFolders={[{ ...folder, sampleCount: 0, presetCount: 1 }]}
          sourceSamples={[]}
          sourcePresets={[sourcePreset('keys/nt-mellow.preset')]}
          busy={false}
          onRefresh={vi.fn()}
          onAddSourceFolder={vi.fn()}
          onRemoveSourceFolder={vi.fn()}
          onScanSourceFolders={vi.fn()}
          onCopySourceSamplesToSet={vi.fn()}
          onCopySourcePresetsToSet={copySourcePresetsToSet}
        />
      </AppShellProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'source' }));
    fireEvent.click(screen.getByRole('tab', { name: 'presets' }));
    fireEvent.click(screen.getByRole('button', { name: 'copy preset to set' }));

    expect(copySourcePresetsToSet).toHaveBeenCalledWith([`${folder.path}/keys/nt-mellow.preset`], undefined);
  });

  it('allows an in-set source preset to enter the replace-conflict flow', async () => {
    const copySourcePresetsToSet = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        copied: [],
        replaced: [],
        skipped: [],
        conflicts: [{ sourcePath: `${folder.path}/keys/nt-mellow.preset`, targetRelativePath: 'presets/user/nt-mellow.preset' }],
        sampleResult: { ok: true, copied: [], replaced: [], skipped: [], conflicts: [] },
        missingSampleRefs: [],
      })
      .mockResolvedValueOnce({
        ok: true,
        copied: [],
        replaced: [{ sourcePath: `${folder.path}/keys/nt-mellow.preset`, targetRelativePath: 'presets/user/nt-mellow.preset' }],
        skipped: [],
        conflicts: [],
        sampleResult: { ok: true, copied: [], replaced: [], skipped: [], conflicts: [] },
        missingSampleRefs: [],
      });

    render(
      <AppShellProvider>
        <SamplesMode
          samples={[]}
          sourceFolders={[{ ...folder, sampleCount: 0, presetCount: 1 }]}
          sourceSamples={[]}
          sourcePresets={[sourcePreset('keys/nt-mellow.preset', { alreadyInSet: true, flags: ['already_in_set'] })]}
          busy={false}
          onRefresh={vi.fn()}
          onAddSourceFolder={vi.fn()}
          onRemoveSourceFolder={vi.fn()}
          onScanSourceFolders={vi.fn()}
          onCopySourceSamplesToSet={vi.fn()}
          onCopySourcePresetsToSet={copySourcePresetsToSet}
        />
      </AppShellProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'source' }));
    fireEvent.click(screen.getByRole('tab', { name: 'presets' }));

    const copyButton = screen.getByRole('button', { name: 'copy preset to set' });
    expect(copyButton).toBeEnabled();
    fireEvent.click(copyButton);

    const replaceButton = await screen.findByRole('button', { name: 'replace conflict' });
    expect(copySourcePresetsToSet).toHaveBeenCalledWith([`${folder.path}/keys/nt-mellow.preset`], undefined);

    fireEvent.click(replaceButton);

    await waitFor(() => {
      expect(copySourcePresetsToSet).toHaveBeenCalledWith([`${folder.path}/keys/nt-mellow.preset`], { conflict: 'replace' });
    });
  });
});
