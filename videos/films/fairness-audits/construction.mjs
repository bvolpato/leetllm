import { toyRoutingScore } from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const thresholdTrack = createCueTrack({
  initial: {
    id: 'baseline-lenient',
    snapshot: {
      threshold: 0.5,
      variant: 'baseline',
    },
  },
  cues: [
    {
      id: 'baseline-all-review',
      beat: 1,
      at: 0,
      snapshot: {
        threshold: 0.95,
        variant: 'baseline',
      },
    },
    {
      id: 'candidate-rate-check',
      beat: 2,
      at: 0,
      snapshot: {
        threshold: 0.7,
        variant: 'candidate',
      },
    },
  ],
});
export const stageTrack = createCueTrack({
  initial: {
    id: 'judge-router',
    snapshot: {
      firstChanged: 'judge or router',
      serverGate: false,
    },
  },
  cues: [
    {
      id: 'trusted-server-policy',
      beat: 2,
      at: 0,
      snapshot: {
        firstChanged: 'server eligibility check',
        serverGate: true,
      },
    },
  ],
});
assert.equal(toyRoutingScore(false), 0.78);
assert.equal(toyRoutingScore(true).toFixed(2), '.67'.replace('.', '0.'));
assert.equal(toyRoutingScore(true, 0), 0.78);
