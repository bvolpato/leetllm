import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  IMAGE,
  KERNEL,
  channelSnapshot,
  correlate,
  draw,
  scanSnapshot,
  stridePaddingFrame,
  validateModel,
} from '../animations/convolution.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState } from '../lib/lesson.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';

registerLessonFonts();
const cue = (progress) => ({
  progress,
  reveal: progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  active: false,
  strength: 0,
  targets: [],
});
function render(id, beat, cues = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'Convolution' },
    { beat, beatP: 0.95, t: 12, duration: 30, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return {
    ...audit,
    pixels: (x, y, w, h) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, w, h).data)
        .digest('hex'),
  };
}

test('equal brightness totals give different responses when the arrangement changes', () => {
  assert(validateModel());
  const uniform = Array.from({ length: 3 }, () => [2 / 3, 2 / 3, 2 / 3]);
  const edge = IMAGE.slice(0, 3).map((row) => row.slice(1, 4));
  assert(Math.abs(uniform.flat().reduce((a, b) => a + b, 0) - 6) < 1e-12);
  assert.equal(
    edge.flat().reduce((a, b) => a + b, 0),
    6,
  );
  assert.equal(correlate(uniform, KERNEL)[0][0], 0);
  assert.equal(correlate(edge, KERNEL)[0][0], 3);
});

test('the padded sweep visits distinct selected patches and records their matching responses', () => {
  const selected = new Set();
  for (const progress of [0.04, 0.08, 0.12, 0.16, 0.2, 0.4, 0.8, 1]) {
    const frame = stridePaddingFrame(2, progress),
      [r, c] = frame.output;
    selected.add(frame.active.join(','));
    assert.equal(frame.sum, frame.result[r][c]);
    assert(frame.visible.includes(r * 5 + c));
  }
  assert(selected.size >= 5);
  assert.equal(stridePaddingFrame(1, 1).sum, 2);
  assert.equal(stridePaddingFrame(2, 1).visible.length, 25);
  assert.equal(scanSnapshot(IMAGE, KERNEL, 1).count, 9);
});

test('two channel contributions accumulate and a changed filter preserves the input data', () => {
  const first = channelSnapshot(0),
    second = channelSnapshot(1);
  assert.deepEqual(first.images, second.images);
  assert.deepEqual(first.sums, [3, 3]);
  assert.deepEqual(second.sums, [-3, 3]);
  assert.equal(first.total, 6);
  assert.equal(second.total, 0);
});

test('the opening keeps all response answers unknown during the learner prediction', () => {
  const frame = render('intro', 1, { 'opening-image': cue(1), 'opening-choice': cue(1) });
  const answers = frame.labels.filter((label) => label.x > 1100 && label.y > 400 && label.y < 650);
  assert.equal(answers.length, 3);
  assert(answers.every((label) => label.text.endsWith('?')));
});

test('the completed patch value enters its exact output cell only after the deposit arrives', () => {
  const before = render('patch', 1, { 'patch-deposit': cue(0) });
  const moving = render('patch', 1, { 'patch-deposit': cue(0.5) });
  const after = render('patch', 1, { 'patch-deposit': cue(1) });
  const firstCell = (frame) =>
    frame.labels.filter(
      (label) => label.x > 1240 && label.x < 1370 && label.y > 430 && label.y < 550,
    );
  assert(!firstCell(before).some((label) => label.text === '3'));
  assert(!firstCell(moving).some((label) => label.text === '3'));
  assert(firstCell(after).some((label) => label.text === '3'));
  assert.notEqual(before.pixels(1250, 345, 120, 85), moving.pixels(1250, 345, 120, 85));
  assert.notEqual(before.pixels(1250, 430, 110, 110), after.pixels(1250, 430, 110, 110));
});

test('the bright-window payoff preserves the first result and earns zero before the sweep starts', () => {
  const frame = render('slide', 0, { 'bright-window-result': cue(1), 'sliding-sweep': cue(0) });
  const firstRow = frame.labels.filter(
    (label) => label.x > 1240 && label.x < 1590 && label.y > 430 && label.y < 550,
  );
  assert.deepEqual(
    firstRow.map((label) => label.text),
    ['3', '?', '0'],
  );
});

test('the reversal prediction retains the already established original feature map', () => {
  const frame = render('transfer', 0, { 'reverse-prediction': cue(1) });
  const cells = frame.labels.filter(
    (label) => label.x > 1240 && label.x < 1600 && label.y > 430 && label.y < 770,
  );
  assert.deepEqual(
    cells.map((label) => label.text),
    ['3', '3', '0', '3', '3', '0', '3', '3', '0'],
  );
});

test('each revealed ReLU output is already clamped even partway through the activation', () => {
  const frame = render('transfer', 2, { 'reverse-edge': cue(1), 'apply-relu': cue(0.5) });
  const cells = frame.labels.filter(
    (label) => label.x > 1440 && label.x < 1750 && label.y > 410 && label.y < 720,
  );
  assert.equal(cells.length, 9);
  assert(cells.some((label) => label.text === '0'));
  assert(cells.every((label) => label.text === '0' || label.text === '?'));
});

// Measured provider-word timings from the approved 326.433-second lesson.
const transferTimings = [
  {
    'id': 'patch',
    'duration': 37.333333333333336,
    'cueTiming': 'provider-words',
    'beats': [
      {
        'start': 0.4,
        'until': 13.748,
      },
      {
        'start': 13.748,
        'until': 25.6,
      },
      {
        'start': 25.6,
        'until': 37.028000000000006,
      },
    ],
    'visualCues': [
      {
        'id': 'patch-accumulate',
        'phrase':
          'Multiply each pixel by its matching weight, then add the products. Follow the highlighted pairs into the running sum',
        'targets': ['patch-products'],
        'color': 'green',
        'beat': 0,
        'start': 2.9375,
        'end': 9.375,
        'linger': 0.65,
      },
      {
        'id': 'patch-deposit',
        'phrase': 'Carry that result into the first cell',
        'targets': ['patch-sum'],
        'color': 'green',
        'beat': 1,
        'start': 15.1855,
        'end': 17.185499999999998,
        'linger': 0.65,
      },
      {
        'id': 'uniform-question',
        'phrase': 'Predict its response',
        'targets': ['sliding-window'],
        'color': 'yellow',
        'beat': 2,
        'start': 29.400000000000002,
        'end': 30.462500000000002,
        'linger': 0.65,
      },
    ],
  },
  {
    'id': 'translation',
    'duration': 32.46666666666667,
    'cueTiming': 'provider-words',
    'beats': [
      {
        'start': 0.4,
        'until': 15.232,
      },
      {
        'start': 15.232,
        'until': 32.147999999999996,
      },
    ],
    'visualCues': [
      {
        'id': 'translated-edge',
        'phrase': 'Move the boundary one pixel right',
        'targets': ['translated-input'],
        'color': 'blue',
        'beat': 0,
        'start': 0.5,
        'end': 2.175,
        'linger': 0.65,
      },
      {
        'id': 'max-aggregate',
        'phrase': 'Scan the actual cells into this accumulator',
        'targets': ['translated-response'],
        'color': 'green',
        'beat': 1,
        'start': 18.5195,
        'end': 20.9945,
        'linger': 0.65,
      },
    ],
  },
];
const partialFrames = {
  patch: [450, 486, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 532],
  translation: [554, 560, 572, 580, 588, 598, 605, 613, 621, 630, 650],
};
const closePoint = (actual, expected) => {
  assert(Math.abs(actual.x - expected.x) < 1e-9);
  assert(Math.abs(actual.y - expected.y) < 1e-9);
};
function measuredTransferFrames(check) {
  for (const timing of transferTimings)
    for (const frame of partialFrames[timing.id]) {
      const canvas = createCanvas(1920, 1080),
        ctx = canvas.getContext('2d');
      const state = frameState(timing, frame / 30, timing.id === 'patch' ? 3 : 5, 9);
      const audit = drawFrame(ctx, {}, { id: timing.id, title: 'Convolution' }, state, draw);
      assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
      const progress =
        state.cues[timing.id === 'patch' ? 'patch-deposit' : 'max-aggregate'].progress;
      check({
        timing,
        frame,
        ctx,
        audit,
        progress: timing.id === 'patch' || progress === 1 ? progress : (progress * 9) % 1,
      });
    }
}

test('measured scalar transfers advance the arrow and actual value together before arrival', () => {
  measuredTransferFrames(({ timing, audit, progress }) => {
    const cueId = timing.id === 'patch' ? 'patch-deposit' : 'max-aggregate';
    const full = render(timing.id, 1, {
      [cueId]: cue(1),
      'translated-edge': cue(1),
    }).connectors.find((c) => c.kind === 'arrow' || c.kind === 'connect');
    const arrows = audit.connectors.filter((c) => c.kind === 'arrow' || c.kind === 'connect');
    assert.deepEqual(
      findArrowheadOcclusions(audit),
      [],
      timing.id + ': the full head must remain clear',
    );
    if (progress === 0) {
      assert.equal(arrows.length, 0);
      return;
    }
    assert.equal(arrows.length, 1);
    const arrow = arrows[0];
    closePoint(arrow.from, full.from);
    closePoint(arrow.to, {
      x: full.from.x + (full.to.x - full.from.x) * progress,
      y: full.from.y + (full.to.y - full.from.y) * progress,
    });
    if (progress === 1) return;
    const value = audit.labels.find(
      (label) =>
        label.fontSize === 32 &&
        /^\d$/.test(label.text) &&
        label.x > arrow.to.x + 20 &&
        label.x < arrow.to.x + 60 &&
        Math.abs(label.y - arrow.to.y) < 25,
    );
    assert(value, timing.id + ': the actual scalar must travel beside the clear arrow front');
    assert(['0', '3'].includes(value.text));
  });
});

test('native directed transfers retain painted triangles through every measured arrival state', () => {
  measuredTransferFrames(({ timing, frame, ctx, audit, progress }) => {
    if (progress === 0) return;
    const arrow = audit.connectors.find((c) => c.kind === 'arrow' || c.kind === 'connect');
    assert(arrow);
    assert.deepEqual(
      findArrowheadOcclusions(audit),
      [],
      timing.id + '/' + frame + ': no fill or ring stroke may cross the triangle',
    );
    const greenAt = (point) => {
      const [r, g, b] = ctx.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
      return g - r > 20 && g - b > 10;
    };
    const triangleCenter = arrow.head.reduce(
      (p, vertex) => ({ x: p.x + vertex.x / 3, y: p.y + vertex.y / 3 }),
      { x: 0, y: 0 },
    );
    assert(
      greenAt(triangleCenter),
      timing.id + '/' + frame + ': the actual triangle must remain painted',
    );
  });
});

test('reversing the input preserves the sign prediction until the numeric result is spoken', () => {
  const labels = (frame) =>
    frame.labels
      .filter((l) => l.x >= 1030 && l.x < 1340 && l.y > 410 && l.y < 720)
      .map((l) => l.text);
  assert.deepEqual(
    labels(render('transfer', 1, { 'reverse-edge': cue(1), 'reverse-result': cue(0) })),
    Array(9).fill('?'),
  );
  assert.deepEqual(
    labels(render('transfer', 1, { 'reverse-edge': cue(1), 'reverse-result': cue(1) })),
    ['-3', '-3', '0', '-3', '-3', '0', '-3', '-3', '0'],
  );
});
