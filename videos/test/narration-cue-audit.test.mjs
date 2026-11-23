import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { FrameAudit } from '../lib/frame-audit.mjs';
import {
  cueTargetIssues,
  narratedTargetsAtTime,
  cueVisibilityCoverage,
} from '../lib/narration-cue-audit.mjs';

registerLessonFonts();
const canvas = createCanvas(1920, 1080);
const cue = { id: 'read-gradient', targets: ['gradient'], start: 0.2, end: 2.2 };
function paint(time, defect) {
  return drawFrame(
    canvas.getContext('2d'),
    {},
    { id: 'gradient', title: 'Follow the gradient' },
    { opacity: 1, beat: 0, beatP: 0.5, cues: {} },
    (ctx, scene, state, api) => {
      const gap = time >= 0.6 && time < 0.8;
      if (gap && defect === 'missing') return;
      ctx.save();
      ctx.globalAlpha = gap && defect === 'faint' ? 0.1 : 1;
      api.focus.target('gradient', () =>
        api.text(ctx, 'Gradient reaches this weight', 300, 400, 36),
      );
      ctx.restore();
    },
  );
}

function paintTextTarget(x, y) {
  return drawFrame(
    canvas.getContext('2d'),
    {},
    { id: 'gradient', title: 'Follow the gradient' },
    { opacity: 1, beat: 0, beatP: 0.5, cues: {} },
    (ctx, scene, state, api) => {
      api.focus.target('gradient', () => api.text(ctx, 'Gradient reaches this weight', x, y, 36));
    },
  );
}

for (const [defect, expected] of [
  ['faint', 'faint-narrated-target'],
  ['missing', 'unpainted-narrated-target'],
]) {
  test(`a ${defect} target between phrase samples is detected across the spoken frames`, () => {
    for (const time of [0.28, 1.2, 2.16])
      assert.deepEqual(cueTargetIssues(paint(time, defect), cue), []);
    const failingFrames = [];
    for (let frame = 0; frame < 75; frame++) {
      const result = narratedTargetsAtTime(paint(frame / 30, defect), [cue], frame / 30);
      if (result.issues.length) {
        assert(
          result.issues.every((issue) => issue.type === expected && issue.target === 'gradient'),
        );
        failingFrames.push(frame);
      }
    }
    assert.deepEqual(failingFrames, [18, 19, 20, 21, 22, 23]);
    assert.deepEqual(narratedTargetsAtTime(paint(0.7), [cue], 0.7).issues, []);
  });
}

test('the onset allowance is bounded even for short phrases and stops at the spoken end', () => {
  const missing = { targets: [] },
    short = { ...cue, start: 1, end: 1.1 };
  assert.equal(narratedTargetsAtTime(missing, [cue], 0.3).checkedCues, 0);
  assert.equal(narratedTargetsAtTime(missing, [cue], 0.34).issues.length, 1);
  assert.equal(narratedTargetsAtTime(missing, [short], 1.01).checkedCues, 0);
  assert.equal(narratedTargetsAtTime(missing, [short], 1.03).issues.length, 1);
  assert.equal(narratedTargetsAtTime(missing, [short], 1.1).checkedCues, 0);
});

test('per-frame reports retain separate cue and target failures', () => {
  const cues = [cue, { ...cue, id: 'read-bias', targets: ['bias'] }];
  const result = narratedTargetsAtTime({ targets: [] }, cues, 1);
  const audit = new FrameAudit('gradient', 30);
  audit.observe(0, { issues: result.issues });
  const report = audit.finish(1);
  assert.equal(result.checkedTargets, 2);
  assert.equal(report.issues.length, 2);
  assert.deepEqual(
    report.issues.map((issue) => [issue.cue, issue.target]),
    [
      ['read-gradient', 'gradient'],
      ['read-bias', 'bias'],
    ],
  );
});

test('coverage distinguishes shared frames from overlapping phrases and multiple targets', () => {
  const cues = [
    { ...cue, start: 0, end: 1 },
    { ...cue, start: 0.5, end: 1.5, targets: ['weight', 'bias'] },
  ];
  assert.deepEqual(cueVisibilityCoverage(cues, 60, 30), {
    onsetGraceSeconds: 0.12,
    maximumGraceFraction: 0.2,
    checkedFrames: 41,
    checkedCueFrames: 52,
    checkedTargets: 78,
  });
});

test('real text-only targets that are partly or fully clipped by the frame fail bounds checks', () => {
  const partial = paintTextTarget(-24, 400).targets.find((part) => part.id === 'gradient');
  assert(partial.x < 0 && partial.x + partial.width > 0);
  assert.equal(
    partial.markCounts.shapes + partial.markCounts.connectors + partial.markCounts.paths,
    0,
  );
  assert.deepEqual(
    cueTargetIssues({ targets: [partial] }, cue).map((issue) => issue.type),
    ['clipped-narrated-target'],
  );

  const fullyClipped = paintTextTarget(2200, 400).targets.find((part) => part.id === 'gradient');
  assert(fullyClipped.x > 1920);
  assert.deepEqual(
    cueTargetIssues({ targets: [fullyClipped] }, cue).map((issue) => issue.type),
    ['clipped-narrated-target'],
  );
});

test('narrated target bounds must be finite and positive', () => {
  for (const bounds of [
    { x: -200, y: 200, width: 400, height: 40 },
    { x: 20, y: 20, width: 0, height: 40 },
    { x: 20, y: 20, width: Number.NaN, height: 40 },
  ]) {
    const issues = cueTargetIssues({ targets: [{ id: 'gradient', ...bounds, alpha: 1 }] }, cue);
    assert(
      issues.some((issue) =>
        ['invalid-narrated-target-bounds', 'clipped-narrated-target'].includes(issue.type),
      ),
    );
  }
});
