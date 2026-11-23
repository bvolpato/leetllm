import { createCueTrack } from 'vizmatic';
export const SCENES = [
  'opening',
  'evidence',
  'sequence',
  'timeline',
  'tradeoff',
  'canary',
  'reflection',
  'practice',
];
export const tracks = Object.fromEntries(
  SCENES.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-decision`,
        snapshot: {
          step: 0,
        },
      },
      cues: [
        {
          id: `${id}-evidence`,
          beat: 1,
          at: 0,
          snapshot: {
            step: 1,
          },
        },
      ],
    }),
  ]),
);
export const CASES = Object.freeze(['acl-denied-snippet', 'acl-denied-citation']);
export const PASSING_CASES = Object.freeze({
  'acl-denied-snippet': true,
  'acl-denied-citation': true,
});
export const PHASES = Object.freeze([
  '09:12',
  'reproduce',
  'hold',
  'repair',
  'offline gate',
  'canary',
  'review',
]);
export const TIMELINE = Object.freeze({
  domain: [0, 6],
  lanes: [
    {
      id: 'candidate',
      label: 'candidate build',
    },
    {
      id: 'traffic',
      label: 'user traffic',
    },
    {
      id: 'service',
      label: 'service owner',
    },
    {
      id: 'release',
      label: 'release owner',
    },
  ],
  intervals: [
    {
      id: 'failing-cases',
      lane: 'candidate',
      start: 0,
      end: 2.7,
      label: 'two access cases fail',
      color: '#ef9ac8',
    },
    {
      id: 'offline-pass',
      lane: 'candidate',
      start: 3.6,
      end: 4.6,
      label: 'offline verification',
      color: '#8cdeb5',
    },
    {
      id: 'zero-traffic',
      lane: 'traffic',
      start: 0,
      end: 4.8,
      label: 'candidate held at 0%',
      color: '#79aaff',
    },
    {
      id: 'canary-traffic',
      lane: 'traffic',
      start: 4.8,
      end: 6,
      label: 'approved 5% canary',
      color: '#f4d477',
    },
    {
      id: 'repair',
      lane: 'service',
      start: 2.7,
      end: 3.6,
      label: 'auth repair',
      color: '#63deec',
    },
    {
      id: 'review',
      lane: 'release',
      start: 4.6,
      end: 6,
      label: 'review window and gates',
      color: '#8cdeb5',
    },
  ],
});
export const LATENCY_ILLUSTRATION = Object.freeze([
  110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 300, 360, 420,
  900,
]);
