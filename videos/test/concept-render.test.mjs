import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { Resvg } from '@resvg/resvg-js';
import { drawFrame, createLessonPainter } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { conceptCatalog, drawConcept, parseConceptSvg } from '../lib/concepts.mjs';

function paintError(actual, expected, size, softenEdges = false) {
  const premultiplied = Float64Array.from(actual, (value, i) =>
    i % 4 === 3 ? value : (value * actual[i - (i % 4) + 3]) / 255,
  );
  const blur = (pixels) => {
    const result = new Float64Array(pixels.length);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const xx = Math.max(0, Math.min(size - 1, x + dx)),
                yy = Math.max(0, Math.min(size - 1, y + dy));
              sum += pixels[(yy * size + xx) * 4 + c];
            }
          result[(y * size + x) * 4 + c] = sum / 9;
        }
    return result;
  };
  const a = softenEdges ? blur(premultiplied) : premultiplied,
    b = softenEdges ? blur(expected) : expected;
  let error = 0,
    signal = 0;
  for (let i = 0; i < a.length; i += 4) {
    signal += Math.max(a[i + 3], b[i + 3]);
    for (let c = 0; c < 4; c++) error += Math.abs(a[i + c] - b[i + c]);
  }
  return error / (signal * 4);
}

function drawObject(ctx, id, x, y, size, options = {}) {
  const painter = createLessonPainter(ctx);
  return drawConcept(painter.ctx, painter.api, id, x, y, size, { label: id, ...options });
}

test('labeled concept geometry stays audited and contained as a whole object', () => {
  const canvas = createCanvas(960, 540);
  for (const icon of conceptCatalog.icons)
    for (const opacity of [0, 0.2, 0.6, 1]) {
      const frame = drawFrame(
        canvas.getContext('2d'),
        {},
        { title: icon.title },
        { t: 1, duration: 10, opacity: 1 },
        (ctx, scene, state, painter) =>
          drawConcept(ctx, painter, icon.id, 600, 400, 128, {
            label: `Object: ${icon.title}`,
            opacity,
          }),
      );
      assert.deepEqual(layoutIssues(frame), [], `${icon.id} at ${opacity}`);
      assert.equal(
        frame.paths.length > 0,
        opacity > 0,
        `${icon.id} must register its painted geometry`,
      );
      assert.equal(
        frame.labels.some((label) => label.text === `Object: ${icon.title}` && label.alpha > 0),
        opacity > 0,
      );
    }
});

test('concept objects require their visible name and reject decorative outline progress', () => {
  const canvas = createCanvas(960, 540),
    painter = createLessonPainter(canvas.getContext('2d'));
  for (const options of [{}, { label: '' }, { label: ' ' }, { label: 'Query', progress: 0.5 }]) {
    assert.throws(
      () => drawConcept(painter.ctx, painter.api, 'query', 400, 400, 80, options),
      /label|complete geometry/,
    );
  }
});

test('moving a concept object moves its full geometry and visible label together', () => {
  const canvas = createCanvas(1920, 1080);
  const render = (x) =>
    drawFrame(
      canvas.getContext('2d'),
      {},
      { title: 'Follow the query' },
      { t: 1, duration: 10, opacity: 1 },
      (ctx, scene, state, painter) =>
        drawConcept(ctx, painter, 'query', x, 400, 80, { label: 'Query', labelPosition: 'right' }),
    );
  const before = render(400),
    after = render(800);
  const a = before.labels.find((label) => label.text === 'Query'),
    b = after.labels.find((label) => label.text === 'Query');
  assert.equal(b.x - a.x, 400);
  assert.equal(b.y, a.y);
  assert.equal(before.paths.length, after.paths.length);
  for (let i = 0; i < before.paths.length; i++) {
    assert.equal(after.paths[i].closed, before.paths[i].closed);
    assert.equal(after.paths[i].points.length, before.paths[i].points.length);
    for (let j = 0; j < before.paths[i].points.length; j++) {
      assert.ok(Math.abs(after.paths[i].points[j].x - before.paths[i].points[j].x - 400) < 1e-9);
      assert.equal(after.paths[i].points[j].y, before.paths[i].points[j].y);
    }
  }
  assert.deepEqual(layoutIssues(before), []);
  assert.deepEqual(layoutIssues(after), []);
});

test('audited vectors preserve the original SVG silhouette and colors', () => {
  for (const icon of conceptCatalog.icons)
    for (const size of [64, 128]) {
      const svg = readFileSync(new URL(`../assets/concepts/${icon.file}`, import.meta.url), 'utf8');
      const expected = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().pixels;
      const canvas = createCanvas(size, size);
      drawObject(canvas.getContext('2d'), icon.id, 0, 0, size);
      const actual = canvas.getContext('2d').getImageData(0, 0, size, size).data;
      // Skia and Resvg assign thin edge coverage differently at the native 64px size.
      // A shared one-pixel blur isolates geometry and color; 128px keeps the raw check.
      const error = paintError(actual, expected, size, size === 64);
      assert.ok(error < 0.045, `${icon.id}/${size}: relative paint error ${error}`);
    }
});

test('native-size paint comparison detects displaced or missing geometry', () => {
  const size = 64,
    svg = readFileSync(new URL('../assets/concepts/query.svg', import.meta.url), 'utf8');
  const expected = new Resvg(svg).render().pixels;
  const moved = createCanvas(size, size),
    ctx = moved.getContext('2d');
  drawObject(ctx, 'query', 1, 0, size);
  assert.ok(paintError(ctx.getImageData(0, 0, size, size).data, expected, size, true) > 0.045);
  ctx.clearRect(0, 0, size, size);
  assert.ok(paintError(ctx.getImageData(0, 0, size, size).data, expected, size, true) > 0.045);
});

test('light theme changes the actual geometry colors and part opacity is controllable', () => {
  const render = (options) => {
    const canvas = createCanvas(64, 64);
    drawObject(canvas.getContext('2d'), 'query', 0, 0, 64, options);
    return canvas.getContext('2d').getImageData(0, 0, 64, 64).data;
  };
  const svg = readFileSync(new URL('../assets/concepts/query.svg', import.meta.url), 'utf8');
  const part = parseConceptSvg(svg).shapes.find((shape) => shape.fill !== 'none').part;
  const dark = render({}),
    light = render({ theme: 'light' }),
    hidden = render({ parts: { [part]: 0 } });
  assert.notDeepEqual(dark, light);
  const ink = (pixels) => pixels.reduce((sum, value, i) => sum + (i % 4 === 3 ? value : 0), 0);
  assert.ok(ink(hidden) < ink(dark));
});

test('SVG parsing rejects geometry the audit cannot faithfully represent', () => {
  const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
  for (const body of [
    '<image href="external.png"/>',
    '<path d="M0 0L10 10" transform="translate(2)"/>',
    '<path d="M0 0L10 0L10 10ZM2 2L3 3L4 2Z" fill="#111d34"/>',
    '<path d="M0 0L10 10" stroke="#ffffff" stroke-dasharray="1 2"/>',
    '<circle cx="20" cy="20" r="10" display="none"/>',
  ])
    assert.throws(() => parseConceptSvg(svg(body)));
  assert.throws(() => parseConceptSvg('<svg><path d="M0 0L1 1"/></svg>'), /viewBox/);
  assert.throws(
    () =>
      parseConceptSvg(
        '<svg viewBox="0 0 64 64" opacity="0.5"><rect x="5" y="5" width="40" height="40" fill="#ffffff"/><rect x="20" y="20" width="40" height="40" fill="#ffffff"/></svg>',
      ),
    /per-shape opacity/,
  );
  const curved = parseConceptSvg(
    svg('<path d="M10 20C-20 20 50 20 30 20" fill="none" stroke="#63deec"/>'),
  );
  assert.ok(
    curved.shapes[0].paths[0].points.some((p) => p.x < 10),
    'collinear control overshoot must survive flattening',
  );
});
