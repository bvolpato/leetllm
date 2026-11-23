import { createCueTrack } from 'vizmatic';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const ids = ['intro', 'identity', 'quota', 'pages', 'fairness', 'cache', 'cost', 'recovery'];
export const tracks = track(ids);
export const quotaReceipt = Object.freeze({
  request: 'A-1',
  fingerprint: 'assembled-request-v1',
  input: 300,
  output: 120,
});
export const quotaBeatSeconds = 26.448 + 0.65;
export const settlementStart = 5.6 / quotaBeatSeconds;
export const settlementEnd = 11.2 / quotaBeatSeconds;
export const duplicateCue = 11.6125 / quotaBeatSeconds;
export const recoveryIdentity = Object.freeze({
  request: quotaReceipt.request,
  reservation: quotaReceipt.request,
  fingerprint: quotaReceipt.fingerprint,
  attempt: 'attempt-1',
});
export const MT_NEW_IDS = new Set([
  'sharing-contract',
  'stream-clocks',
  'goodput-contract',
  'trusted-envelope',
  'admission-dimensions',
  'admission-race',
  'idempotency-binding',
  'dispatch-commit',
  'kv-byte-shape',
  'kv-growth',
  'physical-references',
  'remote-kv',
  'iteration-boundary',
  'work-cost',
  'extra-work',
  'adapter-revisions',
  'reader-before-ranking',
  'prefix-trust',
  'runtime-trust',
  'usage-and-bill',
  'rollout-and-streams',
  'incident-evidence',
  'fresh-design-gate',
  'boundary-close',
]);
export const MULTITENANT_REQUESTS = Object.freeze([
  Object.freeze({
    id: 'R1',
    complete: true,
    first: 600,
    gap: 80,
  }),
  Object.freeze({
    id: 'R2',
    complete: true,
    first: 700,
    gap: 120,
  }),
  Object.freeze({
    id: 'R3',
    complete: true,
    first: 900,
    gap: 80,
  }),
  Object.freeze({
    id: 'R4',
    complete: false,
    first: 400,
    gap: 50,
  }),
  Object.freeze({
    id: 'R5',
    complete: true,
    first: 500,
    gap: 100,
  }),
]);
