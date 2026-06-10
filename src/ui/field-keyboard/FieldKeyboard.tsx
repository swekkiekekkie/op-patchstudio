import { useCallback, useEffect, useMemo } from 'react';
import { FIELD_KB_BASE_MIDI, FIELD_KB_LAYOUT, type FieldKeyDef } from './layout';
import './field-keyboard.scss';

export interface FieldKeyState {
  loaded?: boolean;
  empty?: boolean;
  selected?: boolean;
  tag?: string;
}

export interface FieldKeyboardProps {
  compact?: boolean;
  captureKeys?: boolean;
  getKeyState?: (oct: number, semi: number, pad: number) => FieldKeyState;
  onPress?: (info: { oct: number; semi: number; pad: number; midi: number; key: string }) => void;
}

export function FieldKeyboard({
  compact = false,
  captureKeys = false,
  getKeyState,
  onPress,
}: FieldKeyboardProps) {
  const states = useMemo(() => {
    if (!getKeyState) return null;
    const map = new Map<string, FieldKeyState>();
    FIELD_KB_LAYOUT.forEach((oct, octIdx) => {
      [...oct.top, ...oct.bottom].forEach((k) => {
        const pad = octIdx * 12 + k.semi;
        map.set(`${octIdx}:${k.semi}`, getKeyState(octIdx, k.semi, pad));
      });
    });
    return map;
  }, [getKeyState]);

  const handlePress = useCallback(
    (octIdx: number, k: FieldKeyDef) => {
      const pad = octIdx * 12 + k.semi;
      const midi = FIELD_KB_BASE_MIDI + pad;
      onPress?.({ oct: octIdx, semi: k.semi, pad, midi, key: k.key });
    },
    [onPress],
  );

  useEffect(() => {
    if (!captureKeys || !onPress) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.repeat) return;
      const ch = e.key.length === 1 ? e.key.toLowerCase() : null;
      if (!ch) return;
      const info = FIELD_KB_LAYOUT.flatMap((oct, octIdx) =>
        [...oct.top, ...oct.bottom].map((k) => ({ octIdx, k })),
      ).find(({ k }) => k.key === ch);
      if (info) {
        e.preventDefault();
        handlePress(info.octIdx, info.k);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [captureKeys, onPress, handlePress]);

  return (
    <div className={`field-keyboard${compact ? ' field-keyboard--compact' : ''}`}>
      {FIELD_KB_LAYOUT.map((octDef, octIdx) => (
        <div key={octIdx} className="field-kb-octave">
          <div className="field-kb-row field-kb-row-top">
            {octDef.top.map((k) => {
              const st = states?.get(`${octIdx}:${k.semi}`) ?? {};
              return (
                <button
                  key={k.key}
                  type="button"
                  className={[
                    'field-kb-key field-kb-key--black',
                    k.narrow ? 'field-kb-key--narrow' : '',
                    st.loaded ? 'is-loaded' : '',
                    st.empty ? 'is-empty' : '',
                    st.selected ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  onPointerDown={(e) => { e.preventDefault(); handlePress(octIdx, k); }}
                >
                  {st.tag ? <span className="key-tag">{st.tag}</span> : null}
                  <span className="key-char">{k.key}</span>
                </button>
              );
            })}
          </div>
          <div className="field-kb-row field-kb-row-bottom">
            {octDef.bottom.map((k) => {
              const st = states?.get(`${octIdx}:${k.semi}`) ?? {};
              return (
                <button
                  key={k.key}
                  type="button"
                  className={[
                    'field-kb-key field-kb-key--white',
                    st.loaded ? 'is-loaded' : '',
                    st.empty ? 'is-empty' : '',
                    st.selected ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  onPointerDown={(e) => { e.preventDefault(); handlePress(octIdx, k); }}
                >
                  {st.tag ? <span className="key-tag">{st.tag}</span> : null}
                  <span className="key-char">{k.key}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
