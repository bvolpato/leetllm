import { createCueTrack } from 'vizmatic';
export const SCENES = [
  'opening',
  'frontier',
  'claim',
  'expiry',
  'scheduler',
  'limiter',
  'ledger',
  'concurrency',
];
export const tracks = Object.fromEntries(
  SCENES.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-contract`,
        snapshot: {
          step: 0,
        },
      },
      cues: [
        {
          id: `${id}-follow-up`,
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
export const URLS = Object.freeze({
  start: 'https://repo.example/start',
  pages: {
    'https://repo.example/start': ['/guide', '/api#auth', 'https://other.example/private'],
    'https://repo.example/guide': ['/api', '/faq'],
    'https://repo.example/api': ['/start'],
    'https://repo.example/faq': [],
  },
});
export const CI_CHAPTERS = new Set([
  'contract-loop',
  'state-objects',
  'url-policy',
  'claim-failure',
  'ttl-reads',
  'cas-boundary',
  'graph-validation',
  'scheduler-workers',
  'bucket-contract',
  'ledger-lifetime',
  'lock-order',
  'parser-state',
  'worker-runtime',
  'fresh-worker-plan',
]);
