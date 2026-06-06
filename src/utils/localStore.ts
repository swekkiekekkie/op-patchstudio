/** Desktop-local persistence (replaces browser cookies). */

const PREFIX = 'opxy-mtp:';

export const STORE_KEYS = {
  LAST_TAB: 'last-tab',
  MIDI_NOTE_MAPPING: 'midi-note-mapping',
  DRUM_KEYBOARD_PINNED: 'drum-keyboard-pinned',
  MULTISAMPLE_KEYBOARD_PINNED: 'multisample-keyboard-pinned',
  DRUM_DEFAULT_SETTINGS: 'drum-default-settings',
  MULTISAMPLE_DEFAULT_SETTINGS: 'multisample-default-settings',
} as const;

export const localStore = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch {
      // ignore quota / privacy mode
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },
};
