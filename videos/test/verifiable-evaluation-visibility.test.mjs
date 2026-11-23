import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, arithmeticEvaluation } from '../animations/verifiable-rewards.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { evaluateContentVisibility } from '../audit-content-visibility.mjs';

const root = new URL('../../', import.meta.url).pathname;

async function measuredEvaluation() {
  const lesson = await readLesson(root + 'videos/lessons/verifiable-rewards.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === 'evaluate');
  const timing = makeSceneTimeline(scene, [18.168, 12.912, 10.488]);
  const windows = [
    [0.7375, 1.5875],
    [2.0625, 3.7375],
    [19.5305, 20.343],
    [23.143, 24.2555],
    [39.655, 40.705],
  ];
  timing.visualCues = scene.beats
    .flatMap((beat, beatIndex) =>
      beat.visual_cues.map((cue) => ({ ...cue, beat: beatIndex, color: 'cyan' })),
    )
    .map((cue, i) => ({ ...cue, start: windows[i][0], end: windows[i][1] }));
  timing.cueTiming = 'provider-words';
  return { lesson, scene, timing };
}

test('the evaluation fixture stays visible before its first spoken reward cue', async () => {
  registerLessonFonts();
  const { lesson, scene, timing } = await measuredEvaluation();
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (let frame = 16; frame <= 22; frame++) {
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      frameState(timing, frame / 30, 7, lesson.scenes.length),
      draw,
    );
    assert(
      audit.labels.some((label) => label.text === '167' && label.alpha > 0.9),
      'The visible context retains the initial policy answer.',
    );
    assert(
      audit.labels.some((label) => label.text === 'Verifier reward: 0 / 1' && label.alpha > 0.9),
      'The context must not show the trained reward early.',
    );
    assert.equal(
      evaluateContentVisibility(ctx.getImageData(0, 0, 1920, 1080).data).belowEncodedThreshold,
      false,
      `Evaluation context is blank at scene frame ${frame}, before the first .7375s reward cue.`,
    );
  }
  const fixture = arithmeticEvaluation();
  assert.equal(fixture.training.initialPolicyAnswer, 167);
  assert.equal(fixture.training.initialReward, 0);
  assert.equal(fixture.training.policyAnswer, 168);
  assert.equal(fixture.training.reward, 1);
});

test('same-output evaluation paints the current toy policy answer on training and held-out inputs', async () => {
  registerLessonFonts();
  const { lesson, scene, timing } = await measuredEvaluation();
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const frames = new Set([61, 79, 113, 275, 276, 293, 573, 698, 1221, 1314]);
  for (let frame = 62; frame <= 112; frame++) frames.add(frame);
  for (const frame of [...frames].sort((a, b) => a - b)) {
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      frameState(timing, frame / 30, 7, lesson.scenes.length),
      draw,
    );
    const current = audit.labels.find((label) => /^(167|168)$/.test(label.text) && label.x < 650);
    assert(
      current && current.alpha > 0.3,
      `The current training answer is painted at frame ${frame}.`,
    );
    const heldOut = audit.labels.filter(
      (label) => /^Policy answer \d+ · reward 0$/.test(label.text) && label.alpha > 0.3,
    );
    if (frame / 30 < timing.visualCues[1].start) {
      assert.equal(heldOut.length, 0, 'The held-out comparison waits for its spoken cue.');
      continue;
    }
    assert.equal(heldOut.length, 2, `Both held-out checks are painted at frame ${frame}.`);
    const before = frame < 276;
    assert.equal(current.text, before ? '167' : '168');
    assert(
      audit.labels.some(
        (label) => label.text === `Toy policy ${before ? 'before' : 'after'} training`,
      ),
    );
    for (const label of heldOut) {
      assert.equal(
        label.text,
        `Policy answer ${current.text} · reward 0`,
        `SAME OUTPUT must use the displayed policy at frame ${frame}.`,
      );
      const pixels = ctx.getImageData(
        Math.ceil(label.x),
        Math.ceil(label.y),
        Math.floor(label.width),
        Math.floor(label.height),
      ).data;
      let painted = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i] > pixels[i + 1] * 1.25 && pixels[i] > pixels[i + 2] * 1.25) painted++;
      assert(painted > 40, `The held-out answer has actual red glyph ink at frame ${frame}.`);
    }
    assert(audit.labels.some((label) => label.text === 'Held-out accuracy: 0 / 2'));
  }
});
