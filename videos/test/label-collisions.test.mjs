import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { findLabelCollisions, auditSceneLabels } from '../lib/label-collisions.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { labelAuditExitCode, validateLabelTimeline } from '../audit-labels.mjs';

registerLessonFonts();

const label = (text, x = 0, y = 0, width = 100, height = 100, alpha = 1) => ({
  text,
  x,
  y,
  width,
  height,
  alpha,
});

function addInk(label, pixels) {
  const width = Math.ceil(label.width),
    height = Math.ceil(label.height),
    data = new Uint8Array(width * height);
  for (const [pixelX, pixelY] of pixels) {
    const x = Math.floor(pixelX + 0.5 - label.x),
      y = Math.floor(pixelY + 0.5 - label.y);
    if (x >= 0 && y >= 0 && x < width && y < height) data[y * width + x] = 255;
  }
  Object.defineProperty(label, 'ink', {
    value: {
      width,
      height,
      data,
      origin: { x: label.x, y: label.y },
      axisX: { x: 1, y: 0 },
      axisY: { x: 0, y: 1 },
    },
  });
  return label;
}

test('the confirmed shallow PCA overlap is a candidate with its actual bounds', () => {
  const labels = [
    label('coordinate 2', 211, 336, 185.541, 23),
    label('PCA header', 326.815, 321, 447.985, 19),
  ];
  const [candidate] = findLabelCollisions(labels);
  assert.deepEqual(candidate.labels, labels);
  assert(Math.abs(candidate.overlap.width - 69.726) < 1e-9);
  assert.equal(candidate.overlap.height, 4);
  assert(candidate.overlap.fraction > 0.065 && candidate.overlap.fraction < 0.066);
});

test('live glyph masks catch the archived linear-regression footer overlap below the bounds cutoff', () => {
  const labels = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { title: 'Check the fit' },
    { t: 1, duration: 2, opacity: 1 },
    (ctx, _scene, _state, api) => {
      // Recreate the archived shallow overlap from fit/b2/p75 with the lesson font's metrics.
      api.text(ctx, 'context in hundreds of tokens', 1196.055, 862, 30, '#e9efff');
      api.text(ctx, 'Gradient step 1,800 · MSE 2.80 ms²', 727.095, 875, 29, '#e9efff');
    },
  ).labels;
  const axisLabel = labels.find((item) => item.text === 'context in hundreds of tokens');
  const footer = labels.find((item) => item.text.startsWith('Gradient step 1,800'));

  const boundsOnly = [axisLabel, footer].map(({ ink, ...item }) => item);
  assert.deepEqual(
    findLabelCollisions(boundsOnly),
    [],
    'the 4% bounds rule misses this shallow overlap',
  );
  const [candidate] = findLabelCollisions([axisLabel, footer]);
  assert(candidate, 'shared native glyph pixels should flag this shallow overlap');
  assert(candidate.overlap.fraction > 0 && candidate.overlap.fraction < 0.04);
  assert(candidate.overlap.inkPixels > 0);
  assert(
    candidate.labels.every((item) => !Object.hasOwn(item, 'ink')),
    'large typed masks stay out of the report',
  );
});

test('live masks suppress blank bounds overlap while unmasked labels keep the fallback threshold', () => {
  const axisLabel = label('context in hundreds of tokens', 1197.055, 839, 446.2607, 23);
  const footer = label('Gradient step', 702.095, 853, 515.1831, 28);
  addInk(axisLabel, [[1200, 845]]);
  addInk(footer, [[1200, 870]]);
  assert.deepEqual(
    findLabelCollisions([axisLabel, footer]),
    [],
    'the box overlap contains no shared glyph pixels',
  );
  assert.deepEqual(
    findLabelCollisions([
      {
        text: axisLabel.text,
        x: axisLabel.x,
        y: axisLabel.y,
        width: axisLabel.width,
        height: axisLabel.height,
      },
      { text: footer.text, x: footer.x, y: footer.y, width: footer.width, height: footer.height },
    ]),
    [],
    'serialized labels without masks retain the 4% bounds fallback',
  );
});

test('all three overlap thresholds are strict and separated or edge-touching labels are clear', () => {
  const a = label('A');
  for (const b of [label('B', 100), label('B', 98), label('B', 0, 98), label('B', 80, 80)]) {
    assert.deepEqual(findLabelCollisions([a, b]), []);
  }
  assert.equal(findLabelCollisions([a, label('B', 79.99, 79.99)]).length, 1);
});

test('faint labels and identical emphasis overlays are ignored while displaced or distinct text is inspected', () => {
  assert.deepEqual(findLabelCollisions([label('A'), label('B', 0, 0, 100, 100, 0.25)]), []);
  assert.equal(findLabelCollisions([label('A'), label('B', 0, 0, 100, 100, 0.251)]).length, 1);
  assert.deepEqual(findLabelCollisions([label('A'), label('A', 0.5, 0.5)]), []);
  assert.equal(findLabelCollisions([label('A'), label('A', 2, 2)]).length, 1);
  assert.equal(findLabelCollisions([label('A'), label('B', 0.5, 0.5)]).length, 1);
  assert.throws(() => findLabelCollisions([label('A', NaN)]), /finite/);
});

function fixture() {
  const scene = {
    id: 'labels',
    title: 'Check the plotted labels',
    beats: [
      { say: 'Compare labels near the same point.', hold: 0.4 },
      { say: 'Separate them so each remains readable.', hold: 0.4 },
    ],
  };
  const lesson = { id: 'label-fixture', scenes: [scene] };
  const timing = makeSceneTimeline(scene, [1, 1], 30);
  const draw = (ctx, _scene, state, api) => {
    api.text(ctx, 'Coordinate two', 300, 450, 36, '#e9efff');
    api.text(ctx, 'PCA component', state.beat ? 850 : 320, 460, 36, '#63deec');
  };
  return { scene, lesson, timing, draw };
}

test('real native registered text overlaps in one beat and separates in the next', () => {
  const canvas = createCanvas(1920, 1080);
  const result = auditSceneLabels({ canvas, ...fixture(), sceneIndex: 0, sceneCount: 1 });
  assert.equal(result.sampledFrames, 6);
  assert.equal(result.warnings.length, 3);
  assert(
    result.warnings.every(
      (warning) =>
        warning.beat === 0 &&
        warning.labels[0].text === 'Coordinate two' &&
        warning.labels[1].text === 'PCA component' &&
        warning.overlap.width > 2 &&
        warning.overlap.height > 2,
    ),
  );
  assert(
    result.samples.filter((sample) => sample.beat === 1).every((sample) => sample.candidates === 0),
  );
  const pixels = canvas.getContext('2d').getImageData(300, 410, 400, 70).data;
  let brightPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] > 180 && pixels[index + 1] > 180 && pixels[index + 2] > 180) brightPixels++;
  }
  assert(brightPixels > 50, 'The registered labels also paint visible native text');
  assert.throws(
    () =>
      auditSceneLabels({
        canvas: createCanvas(960, 540),
        ...fixture(),
        sceneIndex: 0,
        sceneCount: 1,
      }),
    /native 1920x1080/,
  );
});

test('measured timing rejects changed narration and holds instead of silently using estimates', () => {
  const { lesson, timing } = fixture(),
    timeline = { id: lesson.id, fps: 30, scenes: [timing] };
  validateLabelTimeline(lesson, timeline);
  const staleText = structuredClone(timeline);
  staleText.scenes[0].beats[0].say += ' Extra speech.';
  assert.throws(() => validateLabelTimeline(lesson, staleText), /stale or invalid beat timing/);
  const staleHold = structuredClone(timeline);
  staleHold.scenes[0].beats[0].hold += 0.1;
  assert.throws(() => validateLabelTimeline(lesson, staleHold), /stale or invalid beat timing/);
  const staleRate = structuredClone(timeline);
  staleRate.scenes[0].fps = 60;
  assert.throws(() => validateLabelTimeline(lesson, staleRate), /timeline geometry differs/);
});

test('warnings are diagnostic by default, strict only when explicitly requested, and errors always fail', () => {
  assert.equal(labelAuditExitCode({ errorCount: 0, warningCount: 2 }), 0);
  assert.equal(labelAuditExitCode({ errorCount: 0, warningCount: 2 }, true), 1);
  assert.equal(labelAuditExitCode({ errors: [{ id: 'stale' }], warningCount: 0 }), 1);
  assert.equal(labelAuditExitCode({ errorCount: 0, warningCount: 0 }, true), 0);
});

test('every-frame inspection catches a brief collision between the usual beat samples', () => {
  const scene = {
    id: 'brief-overlap',
    title: 'Inspect the changing receipt',
    beats: [{ say: 'Watch the result change.', hold: 0.4 }],
  };
  const lesson = { id: 'brief-overlap', scenes: [scene] };
  const timing = makeSceneTimeline(scene, [1], 30);
  const draw = (ctx, _scene, state, api) => {
    api.text(ctx, 'Coordinate two', 300, 450, 36, '#e9efff');
    api.text(
      ctx,
      'PCA component',
      state.t >= 0.35 && state.t < 0.45 ? 320 : 900,
      460,
      36,
      '#63deec',
    );
  };
  const input = {
    canvas: createCanvas(1920, 1080),
    scene,
    lesson,
    timing,
    draw,
    sceneIndex: 0,
    sceneCount: 1,
  };
  assert.deepEqual(
    auditSceneLabels(input).warnings,
    [],
    'the three usual samples miss the brief overlap',
  );
  const everyFrame = auditSceneLabels({ ...input, allFrames: true });
  assert.equal(everyFrame.sampledFrames, timing.frames);
  assert.equal(everyFrame.coverage, 'all-authored-scene-frames');
  assert.deepEqual([...new Set(everyFrame.warnings.map((warning) => warning.frame))], [11, 12, 13]);
  assert.equal(everyFrame.issueFrames, 3);
  assert.equal(everyFrame.samples.at(-1).frame, timing.frames - 1);
  assert(everyFrame.warnings.every((warning) => warning.overlap.inkPixels > 0));
  assert.throws(
    () => auditSceneLabels({ ...input, timing: { ...timing, fps: 60 }, allFrames: true }),
    /frame count, duration and frame rate/,
  );
});

test('painted-text inspection flags crowding between the axis label and the interleaved receipt', () => {
  const scene = {
    id: 'receipt',
    title: 'Keep the axis separate from the result',
    beats: [{ say: 'Compare the coupled gradient.', hold: 0.4 }],
  };
  const input = {
    canvas: createCanvas(1920, 1080),
    lesson: { id: 'receipt', scenes: [scene] },
    scene,
    timing: makeSceneTimeline(scene, [1], 30),
    sceneIndex: 0,
    sceneCount: 1,
    draw: (ctx, _scene, _state, api) => {
      api.text(ctx, 'a', 625, 972, 30, '#8d9cb9', 'center');
      api.text(ctx, 'Coupled g + λw = (100.1, 1.1)', 250, 990, 32, '#63deec');
    },
  };
  assert.deepEqual(auditSceneLabels(input).warnings, []);
  const result = auditSceneLabels({ ...input, paintedText: true });
  assert(result.warnings.length > 0);
  for (const warning of result.warnings) {
    assert.equal(warning.type, 'label-crowding');
    const [axis, receipt] = warning.labels;
    assert.equal(axis.text, 'a');
    assert.equal(receipt.text, 'Coupled g + λw = (100.1, 1.1)');
    assert.equal(warning.overlap.width, axis.width);
    assert(warning.overlap.height > 0 && warning.overlap.height < axis.height);
  }
});
