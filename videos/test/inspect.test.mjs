import test from 'node:test';
import assert from 'node:assert/strict';
import { DecodedFrameAudit, inspectionTargets } from '../inspect.mjs';

function scan(blankFrame) {
  const timeline = {
    fps: 30,
    intro: { id: 'leetllm-intro', start: 0, duration: 4, frames: 120 },
    scenes: [
      { id: 'explanation', start: 4, duration: 3, frames: 90, beats: [{ start: 0.4, until: 2.6 }] },
    ],
  };
  const audit = new DecodedFrameAudit(timeline, 32, 18);
  for (let frame = 0; frame < 210; frame++) {
    const introFade = frame < 10 || (frame >= 118 && frame < 120);
    audit.observe(Buffer.alloc(32 * 18, introFade || frame === blankFrame ? 10 : 180));
  }
  return audit.finish();
}

test('an unexpected single blank frame fails encoded inspection while retaining its exact position', () => {
  const report = scan(160);
  assert.equal(report.decodePassed, true);
  assert.equal(report.passed, false);
  assert.deepEqual(report.unexplainedBlankRuns, [
    { firstFrame: 160, lastFrame: 160, scene: 'explanation', knownTransition: false },
  ]);
});

test('the known brand entrance remains valid and decoded coverage still must be complete', () => {
  const report = scan();
  assert.equal(report.passed, true);
  assert.deepEqual(report.unexplainedBlankRuns, []);
  assert.equal(report.blankRuns[0].knownTransition, true);
  const incomplete = new DecodedFrameAudit(
    { fps: 30, scenes: [{ id: 'short', start: 0, duration: 1, frames: 30 }] },
    32,
    18,
  );
  incomplete.observe(Buffer.alloc(32 * 18));
  assert.throws(() => incomplete.finish(), /Decoded 1\/30 video frames/);
});

test('a blank frame in the middle of the brand intro is unexpected', () => {
  const report = scan(60);
  assert.equal(report.passed, false);
  assert.deepEqual(report.unexplainedBlankRuns, [
    { firstFrame: 60, lastFrame: 60, scene: 'leetllm-intro', knownTransition: false },
  ]);
});

test('long content holds become review candidates while motion separates them', () => {
  const timeline = {
    fps: 30,
    scenes: [
      {
        id: 'explanation',
        start: 0,
        duration: 18,
        frames: 540,
        beats: [{ start: 0.4, until: 17.5 }],
      },
    ],
  };
  const audit = new DecodedFrameAudit(timeline, 32, 18);
  for (let frame = 0; frame < 540; frame++) {
    const moving = frame >= 240 && frame < 330;
    audit.observe(Buffer.alloc(32 * 18, moving && frame % 2 ? 120 : 180));
  }
  const report = audit.finish();
  assert.equal(report.passed, true);
  assert.equal(report.stillRuns.length, 2);
  assert.ok(report.stillRuns.every((run) => run.duration >= 6));
  assert.ok(report.stillRuns[0].lastFrame <= 240);
  assert.ok(report.stillRuns[1].firstFrame >= 330);
  const targets = inspectionTargets(timeline, report.peakChanges, report.stillRuns);
  assert.equal(
    targets.filter((sample) => sample.targets.some((target) => target.phase === 'long-hold'))
      .length,
    2,
  );
});

test('brand intro and short reading pauses do not become long content holds', () => {
  assert.deepEqual(scan().stillRuns, []);
});
