import type { SetSummary } from '../types/sync';

export const MOCK_SETS: SetSummary[] = [
  {
    id: 'techno-liveset',
    name: 'techno liveset',
    usage: { presets: 1.4, samples: 2.1, projects: 0.2, other: 0.1 },
    stats: { presets: 198, samples: 312, projects: 8 },
    commits: ['initial pull', 'after preset edits', 'pre-gig snapshot', 'post-gig', 'current'],
    lastPushedToDevice: true,
  },
  {
    id: 'dnb-session',
    name: 'dnb session',
    usage: { presets: 1.8, samples: 2.6, projects: 0.3, other: 0.1 },
    stats: { presets: 241, samples: 388, projects: 11 },
    commits: ['initial pull', 'break edits', 'current'],
    lastPushedToDevice: false,
  },
  {
    id: 'studio-master',
    name: 'studio master',
    usage: { presets: 2.0, samples: 3.0, projects: 0.35, other: 0.15 },
    stats: { presets: 275, samples: 421, projects: 12 },
    commits: ['full mirror', 'sample cleanup', 'preset pass', 'current'],
    lastPushedToDevice: false,
  },
];

export const CACHE_BACKED_SET_INDEX = 2;

export const DEVICE_USAGE = { presets: 2.1, samples: 3.2, projects: 0.4, other: 1.7 };
