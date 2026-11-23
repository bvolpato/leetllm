import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame, prepareCanvasImage } from '../lib/scene.mjs';
import { canvasImagePlacement } from '../lib/canvas-image.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

function imageAsset(width = 100, height = 20, paint) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (paint) paint(ctx);
  else {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width / 2, height);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(width / 2, 0, width / 2, height);
  }
  const bytes = canvas.toBuffer('image/png');
  return {
    src: `data:image/png;base64,${bytes.toString('base64')}`,
    mediaType: 'image/png',
    width,
    height,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

function frame(draw) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { title: 'Images' },
    {
      t: 1,
      duration: 10,
      opacity: 1,
    },
    draw,
  );
  return { canvas, ctx, audit };
}

function pixel(ctx, x, y) {
  return Array.from(ctx.getImageData(x, y, 1, 1).data);
}

test('prepared images paint contain, cover, and explicit crops with real pixels', async () => {
  const asset = await prepareCanvasImage(imageAsset());
  const { ctx, audit } = frame((ctx, scene, state, api) => {
    api.image(ctx, asset, { x: 300, y: 300, width: 200, height: 200 });
    api.image(ctx, asset, { x: 700, y: 300, width: 200, height: 200, fit: 'cover' });
    api.image(ctx, asset, {
      x: 1100,
      y: 300,
      width: 200,
      height: 200,
      crop: { x: 50, y: 0, width: 50, height: 20 },
    });
  });
  assert.deepEqual(pixel(ctx, 310, 390), [255, 0, 0, 255]);
  assert.deepEqual(pixel(ctx, 490, 390), [0, 0, 255, 255]);
  assert.deepEqual(pixel(ctx, 310, 310), [11, 12, 16, 255]);
  assert.deepEqual(pixel(ctx, 710, 310), [255, 0, 0, 255]);
  assert.deepEqual(pixel(ctx, 890, 490), [0, 0, 255, 255]);
  assert.deepEqual(pixel(ctx, 1110, 390), [0, 0, 255, 255]);
  assert.deepEqual(
    audit.shapes.map(({ x, y, width, height }) => ({ x, y, width, height })),
    [
      { x: 300, y: 380, width: 200, height: 40 },
      { x: 700, y: 300, width: 200, height: 200 },
      { x: 1100, y: 360, width: 200, height: 80 },
    ],
  );
  assert.deepEqual(layoutIssues(audit), []);
});

test('image geometry follows Canvas transforms, opacity, containers, and focus', async () => {
  const asset = await prepareCanvasImage(imageAsset());
  const { audit } = frame((ctx, scene, state, api) => {
    ctx.save();
    ctx.translate(300, 300);
    ctx.scale(2, 2);
    ctx.globalAlpha = 0.8;
    api.focus.target('paper', () =>
      api.image(ctx, asset, {
        x: 0,
        y: 0,
        width: 100,
        opacity: 0.5,
      }),
    );
    ctx.restore();
  });
  assert.deepEqual(
    audit.targets.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
    [{ id: 'paper', x: 300, y: 300, width: 200, height: 40 }],
  );
  assert.equal(audit.shapes[0].alpha, 0.4);
  assert.deepEqual(layoutIssues(audit), []);
  const overflowing = frame((ctx, scene, state, api) => {
    api.container(
      ctx,
      { x: 300, y: 300, width: 100, height: 100 },
      () => {
        api.image(ctx, asset, { x: 380, y: 340, width: 100 });
      },
      { id: 'paper-panel', padding: 0 },
    );
    api.image(ctx, asset, { x: 1900, y: 600, width: 100 });
  });
  const issues = layoutIssues(overflowing.audit);
  assert.ok(
    issues.some((issue) => issue.type === 'shape-overflow' && issue.group === 'paper-panel'),
  );
  assert.ok(issues.some((issue) => issue.type === 'clipped-shape'));
  assert.ok(!issues.some((issue) => issue.type === 'untracked-paint'));
});

test('transparent image pixels do not hide text or suppress line collisions', async () => {
  const asset = await prepareCanvasImage(
    imageAsset(100, 20, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 50, 20);
    }),
  );
  const { audit } = frame((ctx, scene, state, api) => {
    api.text(ctx, 'COVERED', 320, 420, 44);
    api.text(ctx, 'HOLE', 750, 420, 44);
    api.line(ctx, 720, 400, 910, 400, '#ff0000', 4);
    api.image(ctx, asset, { x: 300, y: 350, width: 700 });
  });
  const issues = layoutIssues(audit);
  assert.ok(issues.some((issue) => issue.type === 'label-occluded' && issue.text === 'COVERED'));
  assert.ok(!issues.some((issue) => issue.type === 'label-occluded' && issue.text === 'HOLE'));
  assert.ok(issues.some((issue) => issue.type === 'label-connector' && issue.text === 'HOLE'));
});

test('fully transparent and faded images add no visible geometry', async () => {
  const transparent = await prepareCanvasImage(imageAsset(10, 10, () => {}));
  const opaque = await prepareCanvasImage(imageAsset());
  const { audit } = frame((ctx, scene, state, api) => {
    api.image(ctx, transparent, { x: 3000, y: 3000 });
    api.image(ctx, opaque, { x: 3000, y: 3000, opacity: 0 });
  });
  assert.deepEqual(audit.shapes, []);
  assert.deepEqual(layoutIssues(audit), []);
});

test('opaque overlays hiding a paper image fail while an unfilled highlight stays safe', async () => {
  const asset = await prepareCanvasImage(imageAsset());
  const render = (fill) =>
    frame((ctx, scene, state, api) => {
      api.image(ctx, asset, { x: 300, y: 300, width: 700 });
      api.rect(ctx, 320, 320, 250, 90, fill, '#b36a00', 0);
    });
  const obscured = layoutIssues(render('#15171d').audit);
  assert.ok(
    obscured.some(
      (issue) =>
        issue.type === 'image-occluded' &&
        issue.image.sha256 === asset.sha256 &&
        issue.coveredImageFraction > 0.2,
    ),
  );
  assert.deepEqual(layoutIssues(render(null).audit), []);
});

test('image preparation rejects missing, external, changed, and oversized assets', async () => {
  await assert.rejects(prepareCanvasImage(), /prepared, embedded PNG/);
  await assert.rejects(
    prepareCanvasImage({ mediaType: 'image/png', src: 'https://example.com/paper.png' }),
    /prepared, embedded PNG/,
  );
  const asset = imageAsset();
  await assert.rejects(prepareCanvasImage({ ...asset, width: 99 }), /dimensions differ/);
  await assert.rejects(prepareCanvasImage({ ...asset, sha256: '0'.repeat(64) }), /SHA-256 differs/);
  const bytes = Buffer.from(asset.src.split(',')[1], 'base64');
  bytes.writeUInt32BE(100_000, 16);
  bytes.writeUInt32BE(100_000, 20);
  await assert.rejects(
    prepareCanvasImage({ ...asset, src: `data:image/png;base64,${bytes.toString('base64')}` }),
    /at most/,
  );
});

test('prepared image state survives caller mutation and rejects invalid placements', async () => {
  const input = imageAsset();
  const asset = await prepareCanvasImage(input);
  input.src = '';
  input.width = 1;
  assert.ok(Object.isFrozen(asset));
  const { ctx } = frame((ctx, scene, state, api) => api.image(ctx, asset, { x: 300, y: 300 }));
  assert.deepEqual(pixel(ctx, 310, 310), [255, 0, 0, 255]);
  for (const options of [
    { x: NaN },
    { width: 0 },
    { height: Infinity },
    { opacity: -1 },
    { fit: 'stretch' },
    { crop: { x: 90, y: 0, width: 20, height: 10 } },
  ])
    assert.throws(() => canvasImagePlacement(asset, options), /Image/);
  assert.throws(() => canvasImagePlacement(input, {}), /Prepare Canvas images/);
});
