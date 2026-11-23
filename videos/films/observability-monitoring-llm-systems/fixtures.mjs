import { createCueTrack } from 'vizmatic';
export const ids = [
  'opening',
  'join',
  'denominators',
  'latency',
  'trace',
  'cost',
  'privacy',
  'sampling',
  'budget',
];
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          beat: 0,
        },
      },
      cues: [0, 1].map((beat) => ({
        id: id + '-' + beat,
        beat,
        at: 0,
        snapshot: {
          beat,
        },
      })),
    }),
  ]),
);
export const EVENTS = [
  {
    id: '201',
    route: 'serve',
    served: true,
    unsafe: false,
    stage: 'passed',
    escape: null,
    input: 188,
    cached: 80,
    output: 27,
    ttft: 172,
    total: 410,
  },
  {
    id: '202',
    route: 'abstain',
    served: false,
    unsafe: false,
    stage: 'generation',
    escape: null,
    input: 196,
    cached: 80,
    output: 20,
    ttft: 181,
    total: 395,
  },
  {
    id: '203',
    route: 'abstain',
    served: false,
    unsafe: false,
    stage: 'generation',
    escape: null,
    input: 192,
    cached: 80,
    output: 21,
    ttft: 188,
    total: 402,
  },
  {
    id: '204',
    route: 'abstain',
    served: false,
    unsafe: false,
    stage: 'evidence',
    escape: null,
    input: 160,
    cached: 64,
    output: 15,
    ttft: 205,
    total: 382,
  },
  {
    id: '205',
    route: 'serve',
    served: true,
    unsafe: true,
    stage: 'generation',
    escape: 'gate',
    input: 198,
    cached: 80,
    output: 29,
    ttft: 218,
    total: 430,
  },
  {
    id: '206',
    route: 'serve',
    served: true,
    unsafe: true,
    stage: 'generation',
    escape: 'gate',
    input: 201,
    cached: 80,
    output: 30,
    ttft: 240,
    total: 455,
  },
];
export const RATE = {
  id: 'internal-fixture-2026-05-27',
  uncached: 1,
  cached: 0.1,
  output: 5,
};
export const inventory = {
  request: new Set(['206']),
  prompt: new Set(['deploy-answerer-v1.1']),
  evidence: new Set(['deploy-policy@17']),
};
export const fields = ['request', 'prompt', 'evidence', 'route', 'input', 'output'];
export const MONITOR_POLICY = {
  maxP95: 500,
  maxWindowCost: 0.002,
};
export const receipts = EVENTS.map((e) => ({
  id: e.id,
  unsafe: e.unsafe,
}));
