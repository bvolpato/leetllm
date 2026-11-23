import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'ledger',
  'segments',
  'placement',
  'queue',
  'sync',
  'delta',
  'recovery',
];
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export const segmentTerms = Object.freeze([1, 3, 5, 7]);
export const tokens = [11, 12, 50, 51, 13, 14];
export const provenance = [
  'tool call',
  'tool call',
  'observation',
  'observation',
  'answer',
  'answer',
];
export const mask = [1, 1, 0, 0, 1, 1];
export const lp = [-0.2, -0.3, 0, 0, -0.4, -0.5];
export const old = [1, 2, 3, 4];
export const goal = [1, 2, 8, 4];
export const syncOutcome = {
  expectedVersion: 12,
  reload: {
    completedAt: 6,
    succeeded: true,
    loadedVersion: 12,
  },
  verification: {
    completedAt: 6.2,
    succeeded: true,
    observedVersion: 12,
  },
  resumeAt: 6.3,
};
export const checkpoint = {
  weight: 1,
  velocity: 0,
  step: 10,
};
export const slimeSentenceWeights = {
  'incident-receipt': [
    [6, 10, 17, 21],
    [22, 14, 10],
    [23, 13, 7, 10],
  ],
  'sample-checks': [
    [8, 27, 7, 10],
    [13, 16, 17, 7],
    [28, 6, 16],
  ],
  'native-append': [
    [15, 10, 12, 11],
    [17, 6, 9, 20],
    [13, 15, 8, 12],
  ],
  'identity-groups': [
    [10, 13, 11, 16],
    [10, 11, 12, 18],
    [17, 15, 17],
  ],
  'step-denominator': [
    [11, 9, 15, 8],
    [20, 14, 7, 12],
    [11, 8, 12, 21],
  ],
  'bundle-map': [
    [14, 13, 21],
    [16, 14, 12, 13],
    [9, 9, 8, 19],
  ],
  'router-session': [
    [14, 13, 21],
    [15, 13, 19],
    [19, 17, 14],
  ],
  'round-boundaries': [
    [19, 18, 10],
    [19, 7, 11, 10],
    [17, 11, 24],
  ],
  'async-future': [
    [6, 16, 17],
    [9, 14, 20],
    [10, 13, 14, 13],
  ],
  'queue-handoff': [
    [11, 7, 12, 5, 11],
    [12, 11, 22, 7],
    [11, 7, 12, 24],
  ],
  'sync-dispatch': [
    [7, 8, 6, 15],
    [18, 9, 12, 10],
    [18, 8, 18],
  ],
  'broadcast-lifecycle': [
    [18, 15, 19],
    [10, 7, 8, 17],
    [9, 11, 12, 17],
  ],
  'disk-retention': [
    [19, 13, 11],
    [9, 13, 10, 14],
    [10, 11, 19, 11],
  ],
  'delta-record': [
    [14, 9, 18],
    [22, 9, 11],
    [18, 9, 11, 13],
  ],
  'agent-hook': [
    [19, 16, 10],
    [22, 5, 8, 12],
    [16, 11, 23],
  ],
  'application-experiment': [
    [20, 20],
    [22, 8, 13],
    [11, 11, 17, 8],
  ],
  'failure-diagnosis': [
    [17, 15, 12],
    [16, 12, 12],
    [21, 6, 15],
  ],
  'retained-serving': [
    [15, 24, 20, 6, 14],
    [13, 15, 12, 13],
    [9, 16, 8, 14],
  ],
  'debug-replay': [
    [6, 13, 10, 13],
    [13, 14, 18],
    [16, 8, 22],
  ],
  'project-scope': [
    [8, 2, 12, 13, 11],
    [20, 7, 3, 17],
    [11, 15, 19],
  ],
  'source-route': [
    [16, 10, 13],
    [8, 13, 8, 13],
    [19, 9, 19],
  ],
  'fresh-replay': [
    [9, 9, 30, 18, 8, 14],
    [5, 17, 21, 17, 15],
    [16, 11, 26, 28],
  ],
};
