import { bucket } from './arithmetic.mjs';
export const ids = [
  'opening',
  'identity',
  'registry',
  'offline',
  'shadow',
  'sticky',
  'live',
  'recovery',
  'capacity',
];
export const promptBytes = [
  'Serve only claims supported by the admitted record.',
  'Check each claim against the admitted record before serving.',
  'Check every claim and withhold unsupported approval.',
];
export // Spoken clause onsets; each measured beat span includes its hold.
const CUES = {
  identity: {
    span: 22.946,
    edit: 4.2,
  },
  registry: {
    span: 19.586,
    promote: 1.0875,
    restore: 2.75,
    stale: 10.9375,
  },
  live: {
    span: 23.474,
    experience: 8.725,
    useful: 12.6375,
    decision: 21.45,
  },
};
export const readTools = new Set(['read policy', 'lookup status']);
export const readCapabilities = new Set(['policy:read', 'status:read']);
export const stableConversation = Array.from(
  {
    length: 100,
  },
  (_, i) => 'thread-' + i,
).find((id) => bucket(id) >= 10);
export const canaryConversation = Array.from(
  {
    length: 100,
  },
  (_, i) => 'thread-' + i,
).find((id) => bucket(id) < 10);
export const INVENTORIES = Object.fromEntries(
  ['incomplete', 'complete', 'unsafe'].map((kind) => [
    kind,
    new Set(
      Array.from(
        {
          length: kind === 'complete' ? 1200 : 600,
        },
        (_, i) => kind + '-' + i,
      ),
    ),
  ]),
);
