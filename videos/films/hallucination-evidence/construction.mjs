import { draftClaims, resolvedClaim } from './fixtures.mjs';
import { safeAnswer } from './arithmetic.mjs';
import { createCueTrack } from 'vizmatic';
export const claimsTrack = createCueTrack({
  initial: {
    id: 'three-supported',
    snapshot: {
      includeEta: false,
      includeContradiction: false,
      visibleClaimCount: 3,
    },
  },
  cues: [
    {
      id: 'unsupported-eta',
      beat: 1,
      at: 0,
      snapshot: {
        includeEta: true,
        includeContradiction: false,
        visibleClaimCount: 4,
      },
    },
    {
      id: 'contradictory-status',
      beat: 2,
      at: 0,
      snapshot: {
        includeEta: true,
        includeContradiction: true,
        visibleClaimCount: 5,
      },
    },
  ],
});
export const routeTrack = createCueTrack({
  initial: {
    id: 'serve-supported',
    snapshot: {
      kind: 'clean',
      route: safeAnswer(draftClaims.slice(0, 3)).route,
    },
  },
  cues: [
    {
      id: 'shorten-eta',
      beat: 1,
      at: 0,
      snapshot: {
        kind: 'eta',
        route: safeAnswer(draftClaims).route,
      },
    },
    {
      id: 'abstain-contradiction',
      beat: 2,
      at: 0,
      snapshot: {
        kind: 'contradiction',
        route: safeAnswer([resolvedClaim]).route,
      },
    },
  ],
});
export const sampleTrack = createCueTrack({
  initial: {
    id: 'unstable',
    snapshot: {
      samples: ['investigating', 'investigating', 'mitigated', 'resolved'],
      label: 'varying answers',
    },
  },
  cues: [
    {
      id: 'repeat-unsupported',
      beat: 1,
      at: 0,
      snapshot: {
        samples: ['14:30 UTC', '14:30 UTC', '14:30 UTC', '14:30 UTC'],
        label: 'same unsupported ETA',
      },
    },
  ],
});
