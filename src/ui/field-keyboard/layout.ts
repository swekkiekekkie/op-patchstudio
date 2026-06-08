export const FIELD_KB_BASE_MIDI = 53;

export const PAD_LABELS = [
  'kd1', 'kd2', 'sd1', 'sd2', 'rim', 'clp', 'tb', 'sh', 'ch', 'cl1', 'oh', 'cab',
  'lt1', 'rd', 'mt', 'cr', 'ht', 'cb', 'tri', 'lt2', 'lc', 'ws', 'hc', 'gui',
] as const;

export interface FieldKeyDef {
  key: string;
  semi: number;
  narrow?: boolean;
}

export interface FieldOctaveDef {
  top: FieldKeyDef[];
  bottom: FieldKeyDef[];
}

export const FIELD_KB_LAYOUT: FieldOctaveDef[] = [
  {
    top: [
      { key: 's', semi: 1 },
      { key: 'd', semi: 3, narrow: true },
      { key: 'f', semi: 5 },
      { key: 'h', semi: 8 },
      { key: 'j', semi: 10 },
    ],
    bottom: [
      { key: 'z', semi: 0 }, { key: 'x', semi: 2 }, { key: 'c', semi: 4 },
      { key: 'v', semi: 6 }, { key: 'b', semi: 7 }, { key: 'n', semi: 9 }, { key: 'm', semi: 11 },
    ],
  },
  {
    top: [
      { key: '2', semi: 1 },
      { key: '3', semi: 3, narrow: true },
      { key: '4', semi: 5 },
      { key: '6', semi: 8 },
      { key: '7', semi: 10 },
    ],
    bottom: [
      { key: 'q', semi: 0 }, { key: 'w', semi: 2 }, { key: 'e', semi: 4 },
      { key: 'r', semi: 6 }, { key: 't', semi: 7 }, { key: 'y', semi: 9 }, { key: 'u', semi: 11 },
    ],
  },
];

export const fieldKbKeyIndex: Record<string, { oct: number; semi: number; pad: number }> = {};
FIELD_KB_LAYOUT.forEach((oct, octIdx) => {
  [...oct.top, ...oct.bottom].forEach((k) => {
    fieldKbKeyIndex[k.key] = { oct: octIdx, semi: k.semi, pad: octIdx * 12 + k.semi };
  });
});
