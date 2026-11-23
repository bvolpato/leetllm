import { PATCH_KV } from '../fixtures.mjs';
import { patchAttention } from '../model.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawClipText, rackPhoto } from '../defaults.mjs';

const names = ['Tag stroke', 'Vent edge', 'Door frame'];
const q1 = [Math.SQRT2, 0],
  q2 = [0, Math.SQRT2];
const vector = (values, digits) =>
  '[' + values.map((v) => (digits === undefined ? v : v.toFixed(digits))).join(', ') + ']';

function publishedScale(ctx, api, amount) {
  const { C } = api;
  drawClipText(ctx, api, 'BLIP-2   ·   published ViT example', 960, 286, 39);
  for (let i = 0; i < 257; i++) {
    api.rect(ctx, 250 + (i % 17) * 35, 384 + Math.floor(i / 17) * 28, 24, 18, C.cyan, undefined, 2);
  }
  for (let i = 0; i < 32; i++) {
    api.rect(
      ctx,
      1165 + (i % 8) * 67,
      473 + Math.floor(i / 8) * 77,
      47,
      50,
      i < Math.floor(32 * amount) ? C.yellow : C.panel,
      C.muted,
      4,
    );
  }
  drawClipText(ctx, api, '257 vision features × 1,024', 548, 920, 35, C.cyan);
  drawClipText(ctx, api, '32 query slots × 768', 1430, 920, 35, C.yellow);
}

export function drawQueryBottleneck(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const amount = (id, b) => spokenProgress(state, id, b);
  if (beat === 5) {
    api.focus.target('query-compressor', () =>
      publishedScale(ctx, api, amount('query-extract', 5)),
    );
    return;
  }
  const colors = [C.yellow, C.blue, C.muted];
  if (beat === 0) {
    const x = 174,
      y = 338,
      w = 690,
      h = 525;
    const areas = rackPhoto(ctx, api, x, y, w, h);
    const samples = [areas.tag, areas.vent, areas.layout];
    api.focus.target('query-patches', () => {
      samples.forEach(([u, v, width, height], i) => {
        // Take a small feature sample from the appropriate physical part of the door.
        const sx = x + w * (u + width * [0.36, 0.26, 0][i]);
        const sy = y + h * (v + height * [0.52, 0.45, 0.85][i]);
        if (i === 0) {
          const tagBottom = y + h * (v + height);
          api.arrow(ctx, sx - 24, tagBottom + 50, sx, tagBottom - 4, colors[i], 5);
        } else {
          api.circle(ctx, sx, sy, 19, 'transparent', colors[i], 5);
        }
        drawClipText(ctx, api, names[i], 1120, 462 + i * 150, 38, colors[i]);
        drawClipText(ctx, api, vector(PATCH_KV[i].key), 1460, 462 + i * 150, 36);
        drawClipText(ctx, api, vector(PATCH_KV[i].value), 1705, 462 + i * 150, 36);
      });
    });
    for (const [x, label] of [
      [1120, 'Patch'],
      [1460, 'Key'],
      [1705, 'Value'],
    ])
      drawClipText(ctx, api, label, x, 349, 32, C.muted);
    drawClipText(ctx, api, 'One attention head   ·   supplied features', 960, 972, 35, C.muted);
    return;
  }

  const change = amount('query-reverse', 4);
  const first = patchAttention([q1[0] * (1 - 2 * change), 0]);
  const second = patchAttention(q2);
  const secondActive = beat === 2;
  const active = secondActive ? second : first;
  const secondReady = amount('query-slot-two', 2) > 0;
  const firstReady = amount('query-slot-one', 1) > 0;
  const showWeights = beat !== 1 || amount('query-weights', 1) > 0;
  const activeLabel = secondActive
    ? 'Slot 2     q = [0, √2]'
    : beat === 3
      ? 'Slot 1     [√2, 0] → [-√2, 0]  ?'
      : beat === 4
        ? 'Slot 1     q = ' + vector(active.query, 3)
        : 'Slot 1     q = [√2, 0]';
  drawClipText(ctx, api, activeLabel, 960, 287, 43, secondActive ? C.blue : C.yellow);
  const cols = [306, 568, 793, 1027, 1270];
  ['Patch', 'Key', 'Value', 'q · k / √2', 'Weight'].forEach((v, i) =>
    drawClipText(ctx, api, v, cols[i], 389, 31, C.muted),
  );
  api.focus.target('query-weights-table', () => {
    PATCH_KV.forEach((patch, i) => {
      const y = 486 + i * 105;
      const fields = [
        names[i],
        vector(patch.key),
        vector(patch.value),
        active.scores[i].toFixed(2),
      ];
      fields.forEach((v, j) =>
        drawClipText(ctx, api, v, cols[j], y, 35, j === 0 ? colors[i] : C.ink),
      );
      if (showWeights) {
        drawClipText(ctx, api, active.weights[i].toFixed(3), cols[4], y, 38, colors[i]);
        api.rect(ctx, 1383, y - 35, 445 * active.weights[i], 33, colors[i], undefined, 3);
      }
    });
  });
  api.focus.target('query-outputs', () => {
    drawClipText(
      ctx,
      api,
      'Slot 1     ' + (firstReady ? vector(first.output, 3) : '[  ?  ,  ?  ]'),
      538,
      866,
      41,
      C.yellow,
    );
    drawClipText(
      ctx,
      api,
      'Slot 2     ' + (secondReady ? vector(second.output, 3) : '[  ?  ,  ?  ]'),
      1390,
      866,
      41,
      C.blue,
    );
  });
  const footer =
    beat === 3
      ? 'Which slot can change? Which patch gains weight?'
      : beat === 4
        ? 'Same patch values and second query throughout the change'
        : 'Output = tag weight × [2, 0] + vent weight × [0, 2] + frame weight × [0, 0]';
  drawClipText(ctx, api, footer, 960, 981, 32, C.ink);
}

export default {
  id: 'query-bottleneck',
  draw: drawQueryBottleneck,
  cues: [
    'query-keys',
    'query-weights',
    'query-slot-one',
    'query-slot-two',
    'query-reverse',
    'query-extract',
  ],
};
