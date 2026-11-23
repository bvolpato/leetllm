import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createPaintedTextCapture } from '../lib/painted-text.mjs';
import { findLabelCollisions } from '../lib/label-collisions.mjs';
import { drawFrame, text, C } from '../lib/scene.mjs';

registerLessonFonts();

const pixels = (canvas) =>
  canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
const pixelHash = (canvas) => createHash('sha256').update(pixels(canvas)).digest('hex');
const boundsOnly = (labels) => labels.map(({ ink, ...label }) => label);

function visibleBounds(canvas) {
  const data = pixels(canvas);
  let left = canvas.width,
    top = canvas.height,
    right = -1,
    bottom = -1;
  for (let index = 3; index < data.length; index += 4)
    if (data[index]) {
      const pixel = (index - 3) / 4,
        x = pixel % canvas.width,
        y = Math.floor(pixel / canvas.width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  return right < left
    ? null
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

test('the mixed-run Optimizers receipt has complete paint bounds without changing its pixels', () => {
  const plain = createCanvas(1920, 1080),
    captured = createCanvas(1920, 1080);
  const capture = createPaintedTextCapture(captured.getContext('2d'));
  const draw = (ctx, _scene, _state, api) => {
    api.text(ctx, 'a', 625, 972, 30, C.muted, 'center');
    api.text(ctx, 'Coupled g + λw = (100.1, 1.1)', 250, 990, 32, C.cyan);
  };
  const scene = { title: 'Inspect the same computed receipt' },
    state = { t: 1, duration: 2, opacity: 1 };
  drawFrame(plain.getContext('2d'), {}, scene, state, draw);
  drawFrame(capture.context, {}, scene, state, draw);
  assert.equal(pixelHash(captured), pixelHash(plain));
  assert.deepEqual(capture.issues, []);
  const receipt = capture.labels.find((label) => label.text.startsWith('Coupled'));
  const isolated = createCanvas(1920, 1080);
  text(isolated.getContext('2d'), receipt.text, 250, 990, 32, C.cyan);
  assert.deepEqual(
    { x: receipt.x, y: receipt.y, width: receipt.width, height: receipt.height },
    visibleBounds(isolated),
    'the capture includes every painted pixel of the mixed-script receipt',
  );
  const [candidate] = findLabelCollisions(boundsOnly(capture.labels));
  assert.deepEqual(
    candidate.labels.map((label) => label.text),
    ['a', 'Coupled g + λw = (100.1, 1.1)'],
  );
  assert(candidate.overlap.fraction > 0.35);
  assert.deepEqual(
    findLabelCollisions(capture.labels),
    [],
    'these particular glyphs interleave without sharing pixels',
  );
  assert(!JSON.stringify(capture.labels).includes('data'), 'large masks are non-enumerable');
});

test('captured masks match actual native glyph pixels through alignment, affine transforms and viewport normalization', () => {
  const cases = [
    {
      align: 'left',
      baseline: 'alphabetic',
      direction: 'ltr',
      matrix: [1, 0, 0, 1, 0.25, 0.5],
      size: [1920, 1080],
    },
    {
      align: 'center',
      baseline: 'middle',
      direction: 'ltr',
      matrix: [1.2, 0.25, -0.15, 0.9, 85.25, 70.5],
      size: [1920, 1080],
    },
    {
      align: 'right',
      baseline: 'bottom',
      direction: 'ltr',
      matrix: [0.9, -0.1, 0.2, 1.1, 50.5, 90.25],
      size: [1920, 1080],
    },
    {
      align: 'start',
      baseline: 'top',
      direction: 'rtl',
      matrix: [1, 0.2, -0.1, 1, 35.25, 30.5],
      size: [960, 540],
    },
  ];
  for (const item of cases) {
    const canvas = createCanvas(...item.size),
      capture = createPaintedTextCapture(canvas.getContext('2d'));
    const ctx = capture.context;
    ctx.font = '500 42px "Lesson Sans"';
    ctx.textAlign = item.align;
    ctx.textBaseline = item.baseline;
    ctx.direction = item.direction;
    ctx.setTransform(...item.matrix);
    ctx.fillStyle = '#fff';
    ctx.fillText('Glyphs λw', 500.25, 350.5);
    assert.deepEqual(capture.issues, []);
    assert.equal(capture.labels.length, 1);
    const [label] = capture.labels,
      actual = visibleBounds(canvas);
    const sx = 1920 / canvas.width,
      sy = 1080 / canvas.height;
    assert.deepEqual(
      { x: label.x, y: label.y, width: label.width, height: label.height },
      { x: actual.x * sx, y: actual.y * sy, width: actual.width * sx, height: actual.height * sy },
    );
    const rgba = pixels(canvas);
    for (let y = 0; y < actual.height; y++)
      for (let x = 0; x < actual.width; x++) {
        assert.equal(
          label.ink.data[y * actual.width + x],
          rgba[((actual.y + y) * canvas.width + actual.x + x) * 4 + 3],
        );
      }
  }
});

test('the wrapper retains effective alpha and reports raw and API text without capturing empty paint', () => {
  const canvas = createCanvas(1920, 1080),
    capture = createPaintedTextCapture(canvas.getContext('2d'));
  const ctx = capture.context;
  ctx.font = '32px "Lesson Sans"';
  ctx.fillStyle = 'rgba(255, 255, 255, .5)';
  ctx.globalAlpha = 0.5;
  ctx.fillText('Faint context', 100, 100);
  ctx.fillText('   ', 100, 150);
  ctx.fillStyle = 'transparent';
  ctx.fillText('Hidden context', 100, 200);
  assert.equal(capture.labels.length, 1);
  assert(Math.abs(capture.labels[0].alpha - 0.25) < 1 / 255);
  assert.deepEqual(capture.issues, []);
});

test('unsupported maxWidth, clipping and non-solid text still paint and are reported explicitly', () => {
  const plain = createCanvas(1920, 1080),
    canvas = createCanvas(1920, 1080);
  const capture = createPaintedTextCapture(canvas.getContext('2d'));
  const draw = (ctx) => {
    ctx.font = '32px "Lesson Sans"';
    ctx.fillStyle = '#fff';
    ctx.fillText('Compressed', 100, 100, 90);
    ctx.save();
    ctx.beginPath();
    ctx.rect(100, 120, 100, 50);
    ctx.clip();
    ctx.fillText('Clipped text', 100, 150);
    ctx.restore();
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#f00');
    ctx.fillStyle = gradient;
    ctx.fillText('Gradient text', 100, 200);
    ctx.fillStyle = '#fff';
    ctx.fillText('Restored text', 100, 250);
    ctx.strokeStyle = '#fff';
    ctx.strokeText('Outlined text', 100, 300);
  };
  draw(plain.getContext('2d'));
  draw(capture.context);
  assert.equal(pixelHash(canvas), pixelHash(plain));
  assert.deepEqual(
    capture.labels.map((label) => label.text),
    ['Restored text'],
  );
  assert.deepEqual(
    capture.issues.map((issue) => issue.reason),
    [
      'maxWidth is not audited',
      'active clipping is not audited',
      'gradient or pattern text is not audited',
      'stroke text is not audited',
    ],
  );
});

test('filtered, shadowed and composited text cannot produce an unsupported all-clear', () => {
  const capture = createPaintedTextCapture(createCanvas(1920, 1080).getContext('2d'));
  const ctx = capture.context;
  ctx.font = '32px "Lesson Sans"';
  ctx.fillStyle = '#fff';
  ctx.filter = 'blur(1px)';
  ctx.fillText('Filtered', 100, 100);
  ctx.filter = 'none';
  ctx.shadowBlur = 3;
  ctx.fillText('Transparent shadow', 100, 125);
  ctx.shadowColor = '#000';
  ctx.fillText('Shadowed', 100, 150);
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'copy';
  ctx.fillText('Composited', 100, 200);
  assert.deepEqual(
    capture.labels.map((label) => label.text),
    ['Transparent shadow'],
  );
  assert.deepEqual(
    capture.issues.map((issue) => issue.reason),
    [
      'filtered text is not audited',
      'text shadows are not audited',
      'text compositing is not audited',
    ],
  );
});

test('complete glyph bounds expose text clipped by the canvas edge', () => {
  const plain = createCanvas(1920, 1080),
    canvas = createCanvas(1920, 1080);
  const capture = createPaintedTextCapture(canvas.getContext('2d'));
  for (const ctx of [plain.getContext('2d'), capture.context]) {
    ctx.font = '32px "Lesson Sans"';
    ctx.fillStyle = '#fff';
    ctx.fillText('A clipped receipt', 1900, 100);
  }
  assert.equal(pixelHash(canvas), pixelHash(plain));
  assert(capture.labels[0].x + capture.labels[0].width > 1920);
  assert.deepEqual(
    capture.issues.map((issue) => issue.reason),
    ['glyphs extend beyond the canvas'],
  );
});

test('reset preserves pixels and cached glyphs while the cache remains bounded', () => {
  const canvas = createCanvas(1920, 1080),
    capture = createPaintedTextCapture(canvas.getContext('2d'), { cacheBytes: 16000 });
  const ctx = capture.context;
  ctx.font = '32px "Lesson Sans"';
  ctx.fillStyle = '#fff';
  for (let index = 0; index < 20; index++) {
    capture.reset();
    ctx.fillText(`Receipt ${index}`, 100, 100);
    assert(capture.cacheStats().bytes <= 16000);
  }
  const beforeReset = pixelHash(canvas),
    beforeRepeat = capture.cacheStats();
  capture.reset();
  assert.deepEqual(capture.labels, []);
  assert.deepEqual(capture.issues, []);
  assert.equal(pixelHash(canvas), beforeReset);
  ctx.fillText('Receipt 19', 100, 100);
  assert.equal(capture.cacheStats().hits, beforeRepeat.hits + 1);
  assert(capture.cacheStats().evictions > 0);
});
