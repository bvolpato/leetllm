import { apiClamp } from './arithmetic.mjs';
import { createCueTrack } from 'vizmatic';
export function programPartIndex(beat, beatP) {
  return Math.min(3, Math.floor(apiClamp((beat + beatP) * 2, 0, 3)));
}
export const testRevealTrack = createCueTrack({
  initial: {
    id: 'test-sealed',
    snapshot: {
      visible: false,
    },
  },
  cues: [
    {
      id: 'held-out-results-open',
      beat: 1,
      at: 0.24,
      snapshot: {
        visible: true,
      },
    },
  ],
});
export function testResultsVisible(beat, beatP = 0) {
  return testRevealTrack.sample({
    beat,
    beatP,
  }).snapshot.visible;
}
export const demoTrack = createCueTrack({
  initial: {
    id: 'teacher-output',
    snapshot: {
      route: 'SERVE',
      recordId: 'approval-4412',
      question: 'Roll back payment-tests?',
      acceptedIds: [],
      rejectedId: null,
    },
  },
  cues: [
    {
      id: 'accepted-trace',
      beat: 1,
      at: 0,
      snapshot: {
        route: 'SERVE',
        recordId: 'approval-4412',
        question: 'Roll back payment-tests?',
        acceptedIds: ['rollback-101'],
        rejectedId: null,
      },
    },
    {
      id: 'rejected-trace',
      beat: 1,
      at: 0.55,
      snapshot: {
        route: 'SERVE',
        recordId: 'approval-4412',
        question: 'Deploy payment-service?',
        acceptedIds: ['rollback-101'],
        rejectedId: 'deploy-201',
      },
    },
  ],
});
export const splitTrack = createCueTrack({
  initial: {
    id: 'families-separated',
    snapshot: {
      rejectedId: null,
      family: null,
    },
  },
  cues: [
    {
      id: 'cross-split-copy-rejected',
      beat: 1,
      at: 0.3,
      snapshot: {
        rejectedId: 'rollback-102',
        family: 'rollback-tests',
      },
    },
  ],
});
export const artifactTrack = createCueTrack({
  initial: {
    id: 'loaded-model',
    snapshot: {
      compiledModel: 'teacher-model',
      runtimeModel: 'teacher-model',
      bound: false,
    },
  },
  cues: [
    {
      id: 'explicit-runtime-bind',
      beat: 1,
      at: 0,
      snapshot: {
        compiledModel: 'teacher-model',
        runtimeModel: 'serving-model',
        bound: true,
      },
    },
  ],
});
