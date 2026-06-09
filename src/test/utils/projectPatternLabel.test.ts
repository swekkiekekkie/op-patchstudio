import { describe, expect, it } from 'vitest';
import { formatPatternPresetLabel } from '../../utils/projectPatternLabel';

describe('formatPatternPresetLabel', () => {
  it('shows inferred custom preset names when available', () => {
    expect(formatPatternPresetLabel({ preset: 'nt-accord', kind: 'custom' })).toBe('nt-accord');
  });

  it('falls back to custom for unnamed custom pattern configs', () => {
    expect(formatPatternPresetLabel({ preset: '-', kind: 'custom' })).toBe('custom');
    expect(formatPatternPresetLabel({ preset: '—', kind: 'custom' })).toBe('custom');
    expect(formatPatternPresetLabel({ preset: '', kind: 'custom' })).toBe('custom');
  });

  it('keeps tweaked labels compact around a known base preset', () => {
    expect(formatPatternPresetLabel({ preset: 'nt-aeroplane', kind: 'tweaked' })).toBe(
      'tweaked (nt-aeroplane)',
    );
    expect(formatPatternPresetLabel({ preset: '-', kind: 'tweaked' })).toBe('tweaked');
  });
});
