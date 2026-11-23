import { hash, tuple } from './arithmetic.mjs';
import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'state',
  'evidence',
  'policy',
  'parallel',
  'ledger',
  'handoff',
  'evaluation',
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
export const original = {
  ticket: '48291',
  customer: 'Alex',
  authenticated: true,
  owner: 'Alex',
  invoice: 'A10234',
  item: 'gpu-usage',
  invoiceItem: 'gpu-usage',
  total: 90000,
  amount: 90000,
  age: 9,
  duplicate: true,
  revision: 4,
  region: 'US',
  intent: 'duplicate-credit',
  policy: 'US-v3',
  confirmed: null,
};
export const policyText = 'US duplicate-credit policy v3: 30 days; specialist at 500 USD.';
export const policyDigest = hash(policyText);
export const documents = [
  {
    id: 'US-v3',
    region: 'US',
    kind: 'published',
    topic: 'duplicate-credit',
    current: true,
    publisher: true,
    text: policyText,
    digest: policyDigest,
  },
  {
    id: 'EU-v2',
    region: 'EU',
    kind: 'published',
    topic: 'duplicate-credit',
    current: true,
    publisher: true,
    text: 'European policy',
    digest: hash('European policy'),
  },
  {
    id: 'Private note',
    region: 'US',
    kind: 'private',
    topic: 'duplicate-credit',
    current: true,
    publisher: false,
    text: 'Internal note',
    digest: hash('Internal note'),
  },
  {
    id: 'US-v2',
    region: 'US',
    kind: 'published',
    topic: 'duplicate-credit',
    current: false,
    publisher: true,
    text: 'Old policy',
    digest: hash('Old policy'),
  },
];
export const small = {
  ...original,
  amount: 3500,
};
export const confirmed = {
  ...small,
  confirmed: hash(tuple(small)),
};
export const serial = [
  {
    id: 'policy',
    lane: 'policy',
    start: 0,
    end: 2,
  },
  {
    id: 'invoice',
    lane: 'invoice',
    start: 2,
    end: 5,
  },
  {
    id: 'merge',
    lane: 'merge',
    start: 5,
    end: 6,
  },
];
export const parallel = [
  {
    id: 'policy',
    lane: 'policy',
    start: 0,
    end: 2,
  },
  {
    id: 'invoice',
    lane: 'invoice',
    start: 0,
    end: 3,
  },
  {
    id: 'merge',
    lane: 'merge',
    start: 3,
    end: 4,
  },
];
export const timeout = [
  {
    id: 'policy',
    lane: 'policy',
    start: 0,
    end: 2,
  },
  {
    id: 'invoice',
    lane: 'invoice',
    start: 0,
    end: 3,
  },
];
export const freshExpectedPayload = {
  customer: 'Maya',
  invoice: 'M240',
  item: 'gpu-usage',
  amount: 24000,
  policy: 'US-v3',
  revision: 4,
  status: 'pending',
  evidence: policyDigest,
};
