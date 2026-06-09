import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addSourceFolder,
  copySourcePresetsToSet,
  copySourceSamplesToSet,
  listSourceFolders,
  removeSourceFolder,
  scanSourceFolders,
} from '../../../electron/main/sourceLibrary';

describe('source library', () => {
  let root: string;
  let userDataRoot: string;
  let cacheRoot: string;
  let sourceRoot: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'opxy-source-library-'));
    userDataRoot = path.join(root, 'user-data');
    cacheRoot = path.join(root, 'cache');
    sourceRoot = path.join(root, 'source');
    fs.mkdirSync(path.join(cacheRoot, 'samples', 'user'), { recursive: true });
    fs.mkdirSync(path.join(sourceRoot, 'nested'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('indexes registered PC folders and marks files already present in the set', () => {
    fs.writeFileSync(path.join(sourceRoot, 'kick-c2-1.wav'), 'source-kick');
    fs.writeFileSync(path.join(sourceRoot, 'nested', 'hat-c3-2.aif'), 'source-hat');
    fs.writeFileSync(path.join(sourceRoot, 'notes.txt'), 'ignore me');
    fs.writeFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'set-kick');

    const addResult = addSourceFolder(userDataRoot, sourceRoot);
    expect(addResult.ok).toBe(true);

    const scan = scanSourceFolders(userDataRoot, cacheRoot);
    expect(scan.folders).toHaveLength(1);
    expect(scan.folders[0]?.sampleCount).toBe(2);
    expect(scan.samples.map((sample) => sample.filename).sort()).toEqual(['hat-c3-2.aif', 'kick-c2-1.wav']);
    expect(scan.samples.find((sample) => sample.filename === 'kick-c2-1.wav')?.alreadyInSet).toBe(true);
  });

  it('indexes source preset folders alongside source samples', () => {
    const sourcePreset = path.join(sourceRoot, 'drums', 'nt-cuckoo.preset');
    const setPreset = path.join(cacheRoot, 'presets', 'drum', 'nt-cuckoo.preset');
    fs.mkdirSync(sourcePreset, { recursive: true });
    fs.mkdirSync(setPreset, { recursive: true });
    fs.writeFileSync(path.join(sourceRoot, 'kick-c2-1.wav'), 'source-kick');
    fs.writeFileSync(path.join(cacheRoot, 'samples', 'user', 'snare-d2-2.wav'), 'set-snare');
    fs.writeFileSync(
      path.join(sourcePreset, 'patch.json'),
      JSON.stringify({
        type: 'drum',
        regions: [
          { sample: 'kick-c2-1.wav' },
          { sample: 'snare-d2-2.wav' },
          { sample: 'missing-f2-3.wav' },
        ],
      }),
    );
    fs.writeFileSync(path.join(setPreset, 'patch.json'), JSON.stringify({ type: 'drum', regions: [] }));

    addSourceFolder(userDataRoot, sourceRoot);

    const scan = scanSourceFolders(userDataRoot, cacheRoot);
    expect(scan.folders[0]?.presetCount).toBe(1);
    expect(scan.presets).toHaveLength(1);
    expect(scan.presets[0]).toMatchObject({
      folderName: 'nt-cuckoo.preset',
      name: 'nt-cuckoo',
      type: 'drum',
      alreadyInSet: true,
      flags: ['already_in_set', 'missing_refs'],
    });
    expect(scan.presets[0]?.sampleRefs.sort()).toEqual(['kick-c2-1.wav', 'missing-f2-3.wav', 'snare-d2-2.wav']);
    expect(scan.presets[0]?.availableSampleRefs.sort()).toEqual(['kick-c2-1.wav', 'snare-d2-2.wav']);
    expect(scan.presets[0]?.missingSampleRefs).toEqual(['missing-f2-3.wav']);
  });

  it('copies staged source samples into samples/user and reports conflicts', () => {
    const kick = path.join(sourceRoot, 'kick-c2-1.wav');
    const hat = path.join(sourceRoot, 'hat-c3-2.wav');
    fs.writeFileSync(kick, 'source-kick');
    fs.writeFileSync(hat, 'source-hat');
    fs.writeFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'set-kick');

    addSourceFolder(userDataRoot, sourceRoot);

    const result = copySourceSamplesToSet(userDataRoot, cacheRoot, [kick, hat]);
    expect(result.ok).toBe(true);
    expect(result.copied).toEqual([{ sourcePath: hat, targetRelativePath: 'samples/user/hat-c3-2.wav' }]);
    expect(result.replaced).toEqual([]);
    expect(result.conflicts).toEqual([{ sourcePath: kick, targetRelativePath: 'samples/user/kick-c2-1.wav' }]);
    expect(fs.readFileSync(path.join(cacheRoot, 'samples', 'user', 'hat-c3-2.wav'), 'utf8')).toBe('source-hat');
    expect(fs.readFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'utf8')).toBe('set-kick');
  });

  it('can replace conflicting set samples when explicitly requested', () => {
    const kick = path.join(sourceRoot, 'kick-c2-1.wav');
    fs.writeFileSync(kick, 'source-kick');
    fs.writeFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'set-kick');

    addSourceFolder(userDataRoot, sourceRoot);

    const result = copySourceSamplesToSet(userDataRoot, cacheRoot, [kick], { conflict: 'replace' });
    expect(result.ok).toBe(true);
    expect(result.copied).toEqual([]);
    expect(result.replaced).toEqual([{ sourcePath: kick, targetRelativePath: 'samples/user/kick-c2-1.wav' }]);
    expect(result.conflicts).toEqual([]);
    expect(fs.readFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'utf8')).toBe('source-kick');
  });

  it('copies source preset folders into presets/user and reports conflicts', () => {
    const sourcePreset = path.join(sourceRoot, 'packs', 'nt-mellow.preset');
    fs.mkdirSync(sourcePreset, { recursive: true });
    fs.writeFileSync(path.join(sourcePreset, 'patch.json'), JSON.stringify({ type: 'prism', regions: [] }));
    fs.mkdirSync(path.join(cacheRoot, 'presets', 'user', 'nt-mellow.preset'), { recursive: true });
    fs.writeFileSync(path.join(cacheRoot, 'presets', 'user', 'nt-mellow.preset', 'patch.json'), 'set-version');

    addSourceFolder(userDataRoot, sourceRoot);

    const conflict = copySourcePresetsToSet(userDataRoot, cacheRoot, [sourcePreset]);
    expect(conflict.ok).toBe(true);
    expect(conflict.copied).toEqual([]);
    expect(conflict.conflicts).toEqual([{ sourcePath: sourcePreset, targetRelativePath: 'presets/user/nt-mellow.preset' }]);
    expect(conflict.sampleResult.copied).toEqual([]);
    expect(fs.readFileSync(path.join(cacheRoot, 'presets', 'user', 'nt-mellow.preset', 'patch.json'), 'utf8')).toBe('set-version');

    const replaced = copySourcePresetsToSet(userDataRoot, cacheRoot, [sourcePreset], { conflict: 'replace' });
    expect(replaced.replaced).toEqual([{ sourcePath: sourcePreset, targetRelativePath: 'presets/user/nt-mellow.preset' }]);
    expect(fs.readFileSync(path.join(cacheRoot, 'presets', 'user', 'nt-mellow.preset', 'patch.json'), 'utf8')).toBe(JSON.stringify({ type: 'prism', regions: [] }));
  });

  it('copies available referenced samples when copying a source preset folder', () => {
    const sourcePreset = path.join(sourceRoot, 'drums', 'nt-cuckoo.preset');
    fs.mkdirSync(sourcePreset, { recursive: true });
    fs.writeFileSync(path.join(sourceRoot, 'kick-c2-1.wav'), 'source-kick');
    fs.writeFileSync(path.join(sourceRoot, 'nested', 'snare-d2-2.wav'), 'source-snare');
    fs.writeFileSync(
      path.join(sourcePreset, 'patch.json'),
      JSON.stringify({
        type: 'drum',
        regions: [
          { sample: 'kick-c2-1.wav' },
          { sample: 'snare-d2-2.wav' },
          { sample: 'missing-f2-3.wav' },
        ],
      }),
    );

    addSourceFolder(userDataRoot, sourceRoot);

    const result = copySourcePresetsToSet(userDataRoot, cacheRoot, [sourcePreset]);

    expect(result.ok).toBe(true);
    expect(result.copied).toEqual([{ sourcePath: sourcePreset, targetRelativePath: 'presets/user/nt-cuckoo.preset' }]);
    expect(result.sampleResult.copied.map((item) => path.basename(item.sourcePath)).sort()).toEqual(['kick-c2-1.wav', 'snare-d2-2.wav']);
    expect(result.missingSampleRefs).toEqual([{ sourcePath: sourcePreset, ref: 'missing-f2-3.wav' }]);
    expect(fs.readFileSync(path.join(cacheRoot, 'samples', 'user', 'kick-c2-1.wav'), 'utf8')).toBe('source-kick');
    expect(fs.readFileSync(path.join(cacheRoot, 'samples', 'user', 'snare-d2-2.wav'), 'utf8')).toBe('source-snare');
  });

  it('skips invalid source preset copy requests', () => {
    const outsideRoot = path.join(root, 'outside');
    const outsidePreset = path.join(outsideRoot, 'outside.preset');
    const notPreset = path.join(sourceRoot, 'ordinary-folder');
    fs.mkdirSync(outsidePreset, { recursive: true });
    fs.mkdirSync(notPreset, { recursive: true });

    addSourceFolder(userDataRoot, sourceRoot);

    const result = copySourcePresetsToSet(userDataRoot, cacheRoot, [
      outsidePreset,
      notPreset,
      path.join(sourceRoot, 'missing.preset'),
    ]);

    expect(result.ok).toBe(true);
    expect(result.copied).toEqual([]);
    expect(result.skipped).toEqual([
      { sourcePath: outsidePreset, reason: 'Source preset is not in a registered folder' },
      { sourcePath: notPreset, reason: 'Source folder is not a .preset folder' },
      { sourcePath: path.join(sourceRoot, 'missing.preset'), reason: 'Source preset folder not found' },
    ]);
  });

  it('removes a source folder from the registry without deleting files on disk', () => {
    const samplePath = path.join(sourceRoot, 'kick-c2-1.wav');
    fs.writeFileSync(samplePath, 'source-kick');
    const addResult = addSourceFolder(userDataRoot, sourceRoot);
    const folderId = addResult.folder?.id;
    expect(folderId).toBeTruthy();

    const result = removeSourceFolder(userDataRoot, folderId!);
    expect(result.ok).toBe(true);
    expect(result.folders).toEqual([]);
    expect(listSourceFolders(userDataRoot)).toEqual([]);
    expect(fs.existsSync(samplePath)).toBe(true);

    const scan = scanSourceFolders(userDataRoot, cacheRoot);
    expect(scan.samples).toEqual([]);
  });

  it('reports an error when removing an unknown source folder', () => {
    const result = removeSourceFolder(userDataRoot, 'missing-folder');
    expect(result).toEqual({ ok: false, error: 'Source folder not found' });
  });

  it('skips unregistered, missing, and unsupported source files without copying them', () => {
    const outsideRoot = path.join(root, 'outside');
    fs.mkdirSync(outsideRoot);
    const outside = path.join(outsideRoot, 'outside-c2-1.wav');
    const unsupported = path.join(sourceRoot, 'readme.txt');
    const missing = path.join(sourceRoot, 'missing-c2-1.wav');
    fs.writeFileSync(outside, 'outside');
    fs.writeFileSync(unsupported, 'not audio');

    addSourceFolder(userDataRoot, sourceRoot);

    const result = copySourceSamplesToSet(userDataRoot, cacheRoot, [outside, unsupported, missing]);
    expect(result.ok).toBe(true);
    expect(result.copied).toEqual([]);
    expect(result.replaced).toEqual([]);
    expect(result.skipped).toEqual([
      { sourcePath: outside, reason: 'Source is not in a registered folder' },
      { sourcePath: unsupported, reason: 'Unsupported audio extension' },
      { sourcePath: missing, reason: 'Source file not found' },
    ]);
    expect(fs.readdirSync(path.join(cacheRoot, 'samples', 'user'))).toEqual([]);
  });
});
