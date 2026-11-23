import test from 'node:test';
import assert from 'node:assert/strict';
import { preflightProblems } from '../verify-narration-preflight.mjs';
import { LAYOUT_AUDIT_RULES } from '../lib/frame-audit.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { cueVisibilityCoverage } from '../lib/narration-cue-audit.mjs';

function fixture() {
  const targetVisibility = {
    onsetGraceSeconds: 0.12,
    maximumGraceFraction: 0.2,
    checkedFrames: 50,
    checkedCueFrames: 50,
    checkedTargets: 50,
  };
  const expected = {
    toolSha256: 'tool',
    renderEngine: { entrySha256: 'engine' },
    frameworkSha256: { scene: 'framework' },
    animationSha256: 'animation',
    markupSha256: 'markup',
    baseline: {
      timelinePath: 'baseline/timeline.json',
      timelineSha256: 'timeline',
      receiptPath: 'baseline/verification.json',
      receiptSha256: 'receipt',
    },
    beats: 1,
    cues: 1,
    scenes: [{ id: 'trace', frames: 90, fps: 30, beats: 1, cues: 1, targetVisibility }],
  };
  const report = {
    allFrames: true,
    toolSha256: expected.toolSha256,
    renderEngine: structuredClone(expected.renderEngine),
    frameworkSha256: structuredClone(expected.frameworkSha256),
  };
  const row = {
    passed: true,
    animationSha256: 'animation',
    markupSha256: 'markup',
    beats: 1,
    cuedBeats: 1,
    cues: 1,
    baseline: structuredClone(expected.baseline),
    scenes: [
      {
        id: 'trace',
        beats: 1,
        cuedBeats: 1,
        cues: 1,
        frames: [{}, {}, {}],
        issues: [],
        allFrameAudit: {
          passed: true,
          frames: 90,
          fps: 30,
          issueFrames: 0,
          issues: [],
          ruleCoverage: LAYOUT_AUDIT_RULES,
        },
        allFrameTargetVisibility: { ...targetVisibility, issueFrames: 0 },
      },
    ],
  };
  return structuredClone({ expected, report, row });
}
test('production preflight requires exact current inputs, every frame and every explanatory beat', () => {
  const f = fixture();
  assert.deepEqual(preflightProblems(f.report, f.row, f.expected), []);
  for (const change of [
    (f) => {
      f.report.renderEngine.entrySha256 = 'changed';
    },
    (f) => {
      f.report.frameworkSha256.scene = 'changed';
    },
    (f) => {
      f.row.animationSha256 = 'changed';
    },
    (f) => {
      f.report.allFrames = false;
    },
    (f) => {
      f.row.baseline.timelineSha256 = 'shifted-timeline';
    },
    (f) => {
      f.row.scenes[0].allFrameAudit.frames--;
    },
    (f) => {
      f.row.scenes[0].allFrameAudit.issueFrames = 1;
    },
    (f) => {
      delete f.row.scenes[0].allFrameTargetVisibility;
    },
    (f) => {
      f.row.scenes[0].allFrameTargetVisibility.checkedTargets--;
    },
    (f) => {
      f.row.scenes[0].allFrameTargetVisibility.issueFrames = 1;
    },
    (f) => {
      f.row.scenes[0].frames.pop();
    },
    (f) => {
      f.row.cuedBeats = 0;
    },
    (f) => {
      f.row.scenes = [];
    },
  ]) {
    const altered = fixture();
    change(altered);
    assert(preflightProblems(altered.report, altered.row, altered.expected).length > 0);
  }
});

test('preflight rejects a one-frame word-timing shift even when aggregate coverage stays 56/56/56', () => {
  const scene = {
    id: 'trace',
    beats: [
      {
        say: 'Follow the gradient.',
        visual_cues: [
          { id: 'read-gradient', phrase: 'Follow the gradient', targets: ['gradient'] },
        ],
      },
    ],
  };
  const timeline = (shift) => ({
    beats: [{ say: scene.beats[0].say, start: 0, end: 2.5 }],
    sounds: [
      {
        beatIndex: 0,
        words: [
          { text: 'Follow', start: shift, end: 12 / 30 + shift },
          { text: 'the', start: 12 / 30 + shift, end: 21 / 30 + shift },
          { text: 'gradient.', start: 21 / 30 + shift, end: 60 / 30 + shift },
        ],
      },
    ],
  });
  const baselineCues = resolveSceneCues(scene, timeline(0));
  const shiftedCues = resolveSceneCues(scene, timeline(1 / 30));
  const coverage = (cues) => cueVisibilityCoverage(cues, 90, 30);
  assert.deepEqual(coverage(baselineCues), {
    onsetGraceSeconds: 0.12,
    maximumGraceFraction: 0.2,
    checkedFrames: 56,
    checkedCueFrames: 56,
    checkedTargets: 56,
  });
  assert.deepEqual(coverage(shiftedCues), coverage(baselineCues));
  assert.equal(shiftedCues[0].start - baselineCues[0].start, 1 / 30);

  const matching = fixture();
  assert.deepEqual(preflightProblems(matching.report, matching.row, matching.expected), []);
  const shiftedBaseline = structuredClone(matching.expected);
  shiftedBaseline.baseline.timelineSha256 = 'shifted-timeline';
  shiftedBaseline.baseline.receiptSha256 = 'shifted-receipt';
  assert(
    preflightProblems(matching.report, matching.row, shiftedBaseline).includes(
      'Measured baseline timeline or receipt changed',
    ),
  );
});
