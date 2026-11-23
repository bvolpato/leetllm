import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { aggregateOcclusion } from '../lib/aggregate-occlusion.mjs';

registerLessonFonts();

function render(paint) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    {},
    { title: 'Occlusion regression' },
    { t: 1, duration: 10, opacity: 1 },
    paint,
  );
}

function stripes(y, alpha = 1, before = false) {
  return render((ctx, scene, state, api) => {
    const tiles = () => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      // Each tile covers less than 8% of the subtitle ink. Their union crosses the cutoff.
      for (let row = 0; row < 3; row++)
        for (let column = 0; column < 7; column++) {
          api.rect(ctx, 1140 + column * 50, y + row * 12, 20, 7, api.C.yellow, undefined, 2);
        }
      ctx.restore();
    };
    if (before) tiles();
    api.text(ctx, 'trainable correction', 1320, 542.8, 28, api.C.muted, 'center');
    if (!before) tiles();
  });
}

test('several individually small later fills jointly obscure actual glyph ink', () => {
  const audit = stripes(535);
  assert.ok(!layoutIssues(audit).some((issue) => issue.type === 'label-occluded'));
  const issue = aggregateOcclusion(audit).find((issue) => issue.text === 'trainable correction');
  assert.ok(issue, 'the LoRA subtitle stripe regression must be detected');
  assert.ok(issue.fills.length > 1);
  assert.ok(issue.coveredInkFraction >= 0.08);
  assert.ok(issue.fills.every((fill) => fill.coveredInkFraction < 0.08));
});

test('reserved lower rows, earlier backgrounds and partial fades keep text readable', () => {
  assert.deepEqual(aggregateOcclusion(stripes(566)), []);
  assert.deepEqual(aggregateOcclusion(stripes(535, 1, true)), []);
  assert.deepEqual(aggregateOcclusion(stripes(535, 0.5)), []);
});

test('overlapping fills count the union once and paths honor their clip', () => {
  const single = render((ctx, scene, state, api) => {
    api.text(ctx, 'Visible text', 350, 450, 44);
    api.rect(ctx, 350, 405, 110, 60, api.C.yellow);
  });
  const duplicate = render((ctx, scene, state, api) => {
    api.text(ctx, 'Visible text', 350, 450, 44);
    api.rect(ctx, 350, 405, 110, 60, api.C.yellow);
    api.rect(ctx, 350, 405, 110, 60, api.C.yellow);
  });
  assert.equal(
    aggregateOcclusion(single)[0].hiddenSamples,
    aggregateOcclusion(duplicate)[0].hiddenSamples,
  );
  const clipped = render((ctx, scene, state, api) => {
    api.text(ctx, 'Visible text', 350, 450, 44);
    api.path(
      ctx,
      [
        { x: 340, y: 390 },
        { x: 700, y: 390 },
        { x: 700, y: 470 },
        { x: 340, y: 470 },
      ],
      {
        closed: true,
        fill: api.C.yellow,
        width: 0,
        clip: { x: 100, y: 390, width: 100, height: 80 },
      },
    );
  });
  assert.deepEqual(aggregateOcclusion(clipped), []);
});

test('spaces between real glyphs do not create false occlusion', () => {
  const audit = render((ctx, scene, state, api) => {
    api.text(ctx, 'A                    B', 300, 450, 44);
    api.rect(ctx, 375, 390, 80, 70, api.C.yellow);
  });
  assert.deepEqual(aggregateOcclusion(audit), []);
});
