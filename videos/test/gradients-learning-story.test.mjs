import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, finiteDifference, validateModel } from '../animations/gradients-backprop.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/gradients-backprop.lesson.yaml', root);
function render(id, beat, beatP, cues, time = 10) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const scene = lesson.scenes.find((item) => item.id === id);
  const state = {
    t: time,
    duration: 60,
    p: (beat + beatP) / 3,
    beat,
    beatP,
    ...(cues ? { cues } : {}),
  };
  const audit = drawFrame(ctx, lesson, scene, state, draw);
  assert.deepEqual(layoutIssues(audit), [], `${id}/${beat}/${beatP}`);
  return {
    ...audit,
    labels: audit.labels.map((label) => label.text),
    pixels: (x, y, width, height) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, width, height).data)
        .digest('hex'),
  };
}

test('the finite nudge converges to four without division by zero', () => {
  assert(validateModel());
  for (const h of [0.1, 0.001, 0.00001]) assert(Math.abs(finiteDifference(h) - (4 + 4 * h)) < 1e-8);
  assert.throws(() => finiteDifference(0), RangeError);
});

test('the opening prediction runs past the observed stop before labeling its miss', () => {
  const at = (time) => render('subject-intro', 0, 0, undefined, time);
  const right = (frame, id) => {
    const target = frame.targets.find((target) => target.id === id);
    return target.x + target.width;
  };
  const cut = at(0),
    approach = at(0.4),
    crossing = at(1),
    stopped = at(2);
  const stop = right(cut, 'latency-target');
  assert(right(cut, 'second-prompt-block') < right(approach, 'second-prompt-block'));
  assert(right(approach, 'second-prompt-block') < stop);
  assert(right(crossing, 'second-prompt-block') > stop);
  assert(right(stopped, 'second-prompt-block') > right(crossing, 'second-prompt-block'));
  for (const frame of [cut, approach, crossing]) {
    assert(!frame.labels.includes('1 s late'));
    assert(!frame.labels.some((label) => label.includes('hat y=6')));
  }
  assert(stopped.labels.includes('1 s late'));
  assert(stopped.labels.some((label) => label.includes('hat y=6')));
});

test('turning the opening dial down changes its actual prediction by twice the amount', () => {
  const before = render('subject-intro', 1, 0.98),
    after = render('subject-intro', 2, 0.98);
  assert(before.labels.includes('3'));
  assert(after.labels.includes('2.99'));
  assert(after.labels.some((label) => label.includes('\\hat y=5.98')));
  assert.notEqual(before.pixels(700, 365, 260, 250), after.pixels(700, 365, 260, 250));
});

test('independent coordinate probes paint different losses for the same nudge', () => {
  const prompt = render('gradient-vector', 0, 0.98),
    queue = render('gradient-vector', 1, 0.98);
  for (const [frame, expected] of [
    [prompt, (2 * 2.01 + 2 - 5) ** 2],
    [queue, (2 * 2 + 2.01 - 5) ** 2],
  ]) {
    assert(frame.labels.some((label) => label.includes(expected.toFixed(4))));
    const arrow = frame.connectors.find(
      (edge) =>
        edge.kind === 'arrow' &&
        edge.from.x === 550 &&
        edge.from.y === 540 &&
        edge.to.x === 1350 &&
        edge.to.y === 540,
    );
    assert(arrow, 'the finite-difference displacement keeps its original vector');
    assert.deepEqual(
      arrow.head[0],
      arrow.to,
      'the triangular tip stays at the unchanged parameter point',
    );
    assertTipClear(frame, arrow, 'finite-difference displacement');
  }
  assert.notEqual(prompt.pixels(400, 400, 1100, 440), queue.pixels(400, 400, 1100, 440));
});

test('a moving loss uses approximate notation for the current unrounded weights', () => {
  for (const progress of [0.1, 0.492, 0.75, 1]) {
    const frame = render('gradient-geometry', 2, 0.5, {
      'reverse-gradient': {
        phase: progress === 1 ? 'after' : 'during',
        progress,
        strength: 0,
        targets: [],
      },
    });
    const expected = (1 - 0.8 * progress) ** 2;
    assert(
      frame.labels.includes(String.raw`L(w_p,w_q)\approx${expected.toFixed(2)}`),
      'rounded coordinate labels must not become an exact numeric substitution',
    );
  }
});

test('the scalar update reserves its answer until the point moves and then supplies the forward receipt', () => {
  const question = render('update-step', 0, 0.98),
    moving = render('update-step', 1, 0.5),
    held = render('update-step', 2, 0.98);
  assert(question.labels.some((label) => label.includes('=\\;?')));
  assert(!question.labels.some((label) => label.includes('=2.6')));
  assert(!question.labels.includes('2.6'));
  assert.notEqual(question.pixels(285, 320, 915, 440), moving.pixels(285, 320, 915, 440));
  assert(held.labels.some((label) => label.includes('2.6\\times2=5.2')));
  assert(held.labels.some((label) => label.includes('(5.2-5)^2=0.04')));
  assert(held.labels.includes('2.6'));
});

test('the numeric batch accumulator retains the sum before dividing by its row count', () => {
  const partial = render('path-accumulation', 2, 0.4),
    complete = render('path-accumulation', 2, 0.98);
  assert(partial.labels.some((label) => label === '-5'));
  assert(!partial.labels.some((label) => label === '-36'));
  assert(complete.labels.some((label) => label === '-144'));
  assert(complete.labels.some((label) => label === '-36'));
  assert.notEqual(partial.pixels(770, 450, 980, 180), complete.pixels(770, 450, 980, 180));
});

test('the precision comparison paints the rounded operands responsible for its drifting result', () => {
  const reference = render('gradient-check', 1, 0.98),
    drift = render('gradient-check', 2, 0.98);
  assert(drift.labels.includes('L+ = 1.000003815'));
  assert(drift.labels.includes('L− = 0.999996185'));
  assert.notEqual(reference.pixels(1050, 800, 680, 70), drift.pixels(1050, 800, 680, 70));
});

test('the finite-difference comparison reaches all six completed runs before the final hold', () => {
  const during = render('reverse-mode', 2, 0.4),
    held = render('reverse-mode', 2, 0.98);
  assert(held.labels.includes('6/6\\;\\text{extra forward runs}'));
  assert.equal(
    held.shapes.filter(
      (shape) =>
        shape.kind === 'circle' && shape.fillAlpha > 0 && Math.abs(shape.width - 10) < 0.01,
    ).length,
    0,
  );
  assert.notEqual(during.pixels(1410, 360, 340, 410), held.pixels(1410, 360, 340, 410));
});

test('the final challenge keeps its solved training state while measuring a distinct unseen request', () => {
  const question = render('keep-the-model-honest', 0, 0.98),
    solved = render('keep-the-model-honest', 1, 0.98);
  const held = render('keep-the-model-honest', 2, 0.98);
  assert(question.labels.some((label) => label.includes('\\hat y=\\;?')));
  assert(!question.labels.some((label) => label.includes('(6,2)')));
  assert(solved.labels.some((label) => label.includes('(1.70,1.90)')));
  assert(solved.labels.some((label) => label.includes('\\hat y=7')));
  assert(solved.labels.some((label) => label.includes('L:1\\longrightarrow 0.000')));
  assert.equal(solved.pixels(150, 420, 1620, 200), held.pixels(150, 420, 1620, 200));
  assert(held.labels.some((label) => label.includes('1.7\\times1+1.9\\times2=5.5')));
});

const measured = await loadMeasuredTimeline('gradients-backprop');
function measuredScene(id) {
  const scene = lesson.scenes.find((item) => item.id === id),
    timing = measured.scenes.find((item) => item.id === id);
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const at = (time) => {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const state = frameState(timing, time, 0, 16);
    const audit = drawFrame(ctx, lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `${id} at ${time}`);
    return {
      ...audit,
      state,
      labels: audit.labels.map((label) => label.text),
      pixels: (x, y, width, height) =>
        createHash('sha256')
          .update(ctx.getImageData(x, y, width, height).data)
          .digest('hex'),
    };
  };
  return { at, cue: (id) => timing.visualCues.find((item) => item.id === id) };
}

test('the measured optimizer step keeps its learning rate clear of the stored-weights caption', () => {
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'pytorch-loop');
  const scene = lesson.scenes[sceneIndex],
    timing = measured.scenes.find((scene) => scene.id === 'pytorch-loop');
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const beat = timing.beats[1];
  for (const progress of [0.12, 0.5, 0.88]) {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const state = frameState(
      timing,
      beat.start + (beat.until - beat.start) * progress,
      sceneIndex,
      lesson.scenes.length,
    );
    const audit = drawFrame(ctx, lesson, scene, state, draw);
    const rate = audit.labels.find((label) => label.text === String.raw`\eta=0.1`);
    const caption = audit.labels.find((label) => label.text === 'stored weights');
    assert(rate && caption, 'both annotations must be visibly painted during the measured update');
    assert.deepEqual(layoutIssues(audit), []);
    assert(
      rate.x >= caption.x + caption.width + 24,
      'the learning rate needs a clear gap from the buffer caption',
    );
    assert(
      rate.x + rate.width <= 1710 - 24,
      'the annotation must fit inside the right-hand column',
    );
  }
});

test('the measured queue-component cue paints the growing segment before its arrowhead fits', () => {
  const { at, cue } = measuredScene('gradient-vector'),
    timing = cue('queue-slope');
  for (
    let frame = Math.floor(timing.start * 30);
    frame <= Math.ceil((timing.end + timing.linger) * 30);
    frame++
  ) {
    const audit = at(frame / 30),
      progress = audit.state.cues['queue-slope'].progress;
    if (progress > 0) {
      const target = audit.targets.find((item) => item.id === 'queue-component');
      assert(
        target && target.markCounts.connectors > 0,
        'the actual growing component must be painted',
      );
      assert(target.height >= 200 * progress, 'the component must reach its interpolated endpoint');
    }
  }
});

function arrowAt(frame, predicate, description) {
  const arrow = frame.connectors.find((edge) => edge.kind === 'arrow' && predicate(edge));
  assert(arrow, `${description} arrow remains painted`);
  assert.deepEqual(
    arrow.head[0],
    arrow.to,
    `${description} triangular tip stays at its original endpoint`,
  );
  return arrow;
}

function assertTipClear(frame, arrow, description) {
  const ring = frame.shapes.find(
    (shape) =>
      shape.kind === 'circle' &&
      shape.fillAlpha === 0 &&
      shape.strokeAlpha >= 0.25 &&
      shape.order > arrow.order &&
      Math.hypot(shape.center.x - arrow.to.x, shape.center.y - arrow.to.y) <=
        Math.max(
          Math.hypot(shape.axisX.x, shape.axisX.y),
          Math.hypot(shape.axisY.x, shape.axisY.y),
        ) +
          shape.strokeWidth / 2,
  );
  assert(!ring, `${description} must leave its triangular tip free of a surrounding ring`);
}

test('source-audited moving and endpoint markers leave their arrow tips visible', () => {
  const why = render('why-train', 0, 0.7822300937200207);
  const predictionArrow = arrowAt(
    why,
    (edge) => edge.from.x === 931 && edge.from.y === 500 && edge.to.x === 1250 && edge.to.y === 500,
    'prediction flow',
  );
  assertTipClear(why, predictionArrow, 'prediction flow');
  assert.equal(predictionArrow.to.x, 1250, 'the prediction arrow endpoint remains unchanged');

  const transmit = render('path-accumulation', 0, 0.35775239595641334);
  const returning = arrowAt(
    transmit,
    (edge) => edge.from.x === 1570 && edge.from.y === 555,
    'backward transmission',
  );
  assertTipClear(transmit, returning, 'backward transmission');

  const geometry = render('gradient-geometry', 2, 0.14888496711054078, {
    'reverse-gradient': { progress: 0.07210526315789129 },
  });
  const descent = arrowAt(
    geometry,
    (edge) => edge.from.x === 650 && edge.from.y === 520 && edge.to.x < 650 && edge.to.y > 520,
    'downhill update',
  );
  assertTipClear(geometry, descent, 'downhill update');

  const rowStates = [
    [370, 0.37979620077997245],
    [485, 0.4154400972868708],
    [600, 0.4510839937937692],
    [715, 0.48463119050614356],
  ];
  for (const [rowY, beatP] of rowStates) {
    const frame = render('path-accumulation', 2, beatP);
    const contribution = arrowAt(
      frame,
      (edge) => edge.from.x === 650 && edge.from.y === rowY,
      `row ${rowY} gradient contribution`,
    );
    assertTipClear(frame, contribution, `row ${rowY} gradient contribution`);
  }
});

test('the measured nudge keeps its future loss unknown until the moving point arrives', () => {
  const probe = measuredScene('probe-neighbor'),
    cue = probe.cue('nudged-weight-b1-1');
  const before = probe.at(cue.start - 1 / 30),
    during = probe.at((cue.start + cue.end) / 2),
    held = probe.at(cue.end + 0.4);
  assert(before.labels.includes('L(3) = 1       L(3.001) = ?'));
  assert(during.labels.includes('L(3) = 1       L(3.001) = ?'));
  assert(held.labels.includes('L(3) = 1       L(3.001) = 1.004004'));
  assert.notEqual(before.pixels(660, 500, 350, 160), during.pixels(660, 500, 350, 160));
  assert.notEqual(during.pixels(660, 500, 350, 160), held.pixels(660, 500, 350, 160));
});

test('the measured replay delivers each factor and the product with its spoken clause', () => {
  const replay = measuredScene('chain-rule');
  const square = replay.at(replay.cue('replay-square').end + 1 / 30);
  const subtraction = replay.at(replay.cue('replay-subtraction').end + 1 / 30);
  const feature = replay.at(replay.cue('replay-feature').end + 1 / 30);
  const result = replay.at(replay.cue('replay-result').end + 1 / 30);
  assert(square.labels.includes(String.raw`\vphantom{x_p}1\times2`));
  assert(subtraction.labels.includes(String.raw`\vphantom{x_p}1\times2\times1`));
  assert(feature.labels.includes(String.raw`\vphantom{x_p}1\times2\times1\times2`));
  assert(!feature.labels.some((label) => label.includes('times2=4')));
  assert(result.labels.includes(String.raw`\vphantom{x_p}1\times2\times1\times2=4`));
  assert.notEqual(square.pixels(300, 850, 470, 75), result.pixels(300, 850, 470, 75));
});

test('the measured rounded ratio marker arrives with its estimate and holds the true endpoint', () => {
  const check = measuredScene('gradient-check'),
    cue = check.cue('rounded-slope-b3-1');
  const before = check.at(cue.start - 1 / 30),
    during = check.at((cue.start + cue.end) / 2);
  const held = check.at(cue.end + 1 / 30);
  assert(!during.labels.includes('float32 · 3.815'));
  assert(held.labels.includes('float32 · 3.815'));
  const expected = 1080 + ((3.814697 - 3.7) / 0.4) * 600;
  const marker = held.targets.find((target) => target.id === 'rounded-slope');
  assert(Math.abs(marker.x + marker.width / 2 - expected) < 0.1);
  assert.notEqual(before.pixels(1050, 800, 680, 160), during.pixels(1050, 800, 680, 160));
  assert.notEqual(during.pixels(1050, 800, 680, 160), held.pixels(1050, 800, 680, 160));
});

test('new measured narration gates computed values, parameter updates, and the unseen result', () => {
  const forward = measuredScene('forward-graph'),
    product = forward.cue('graph-node-4-b2-1');
  const beforeProduct = forward.at(product.start - 1 / 30),
    afterProduct = forward.at(product.end + 1 / 30);
  assert(!beforeProduct.labels.includes('2 × 2 = 4'));
  assert(afterProduct.labels.includes('2 × 2 = 4'));
  const productBounds = afterProduct.targets.find((target) => target.id === 'graph-node-4');
  assert(
    afterProduct.connectors.some(
      (edge) =>
        edge.kind === 'arrow' &&
        edge.from.x < productBounds.x &&
        Math.abs(edge.to.x - productBounds.x) < 0.1 &&
        edge.to.y > productBounds.y &&
        edge.to.y < productBounds.y + productBounds.height,
    ),
    'the incoming signal must reach the product before its computed value appears',
  );
  assert.notEqual(
    beforeProduct.pixels(675, 360, 250, 120),
    afterProduct.pixels(675, 360, 250, 120),
  );
  const loop = measuredScene('pytorch-loop'),
    step = loop.cue('stored-weights-b2-2');
  const beforeStep = loop.at(step.start - 1 / 30),
    afterStep = loop.at(step.end + 0.2);
  assert(beforeStep.labels.includes('(4,2)'));
  assert(beforeStep.labels.includes('(2,2)'));
  assert(afterStep.labels.includes('(1.6,1.8)'));
  assert.notEqual(beforeStep.pixels(1060, 760, 650, 115), afterStep.pixels(1060, 760, 650, 115));
  const challenge = measuredScene('keep-the-model-honest'),
    result = challenge.cue('challenge-unseen-result');
  const beforeResult = challenge.at(result.start - 1 / 30),
    afterResult = challenge.at(result.end + 0.2);
  assert(beforeResult.labels.some((label) => label.includes('1.7\\times1+1.9\\times2=?')));
  assert(afterResult.labels.some((label) => label.includes('1.7\\times1+1.9\\times2=5.5')));
  assert.notEqual(beforeResult.pixels(1050, 905, 650, 70), afterResult.pixels(1050, 905, 650, 70));
});
