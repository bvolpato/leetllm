import {
  extensionCode,
  foot,
  math,
  target,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';

function paintShapeChange(ctx, api, C, s) {
  const batch = s.halfBatch ? 2 : 4;
  const positions = s.short ? 4 : 8;
  const features = 16;
  text(ctx, api, C, 'Ticket inputs', 485, 290, 44, C.cyan, 'center');
  text(ctx, api, C, 'One cell holds sixteen float32 features', 485, 350, 29, C.ink, 'center');
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 8; column++) {
      const present = row < batch && column < positions;
      api.rect(
        ctx,
        205 + column * 70,
        422 + row * 62,
        62,
        54,
        present ? C.cyan : C.bg,
        present ? C.cyan : C.panel,
        3,
      );
    }
  }
  const inputKiB = (batch * positions * features * 4) / 1024;
  extensionCode(
    ctx,
    api,
    C,
    batch + ' × ' + positions + ' × ' + features + '   /   ' + inputKiB + ' KiB',
    485,
    810,
    35,
    C.cyan,
  );

  if (!s.attention) {
    text(ctx, api, C, 'After mean pooling', 1350, 290, 44, C.blue, 'center');
    for (let row = 0; row < batch; row++)
      for (let column = 0; column < features; column++)
        api.rect(ctx, 1095 + column * 32, 422 + row * 62, 27, 54, C.blue, C.blue, 2);
    text(ctx, api, C, batch + ' tickets × 16 pooled features', 1350, 810, 34, C.blue, 'center');
    return;
  }

  text(ctx, api, C, 'Full score matrix in memory', 1350, 290, 42, C.blue, 'center');
  text(ctx, api, C, 'One ticket, one attention head', 1350, 350, 30, C.ink, 'center');
  const cell = 49;
  const left = 1154;
  const top = 384;
  for (let q = 0; q < positions; q++)
    for (let k = 0; k < positions; k++)
      api.rect(ctx, left + k * cell, top + q * cell, cell - 5, cell - 5, C.blue, C.blue, 2);
  if (s.short) {
    const farX = left + 8 * cell - 5;
    const farY = top + 8 * cell - 5;
    api.line(ctx, farX, farY - 46, farX, farY, C.muted, 2);
    api.line(ctx, farX - 46, farY, farX, farY, C.muted, 2);
    text(ctx, api, C, '8 × 8 before', farX - 12, farY - 13, 28, C.muted, 'right');
  }
  text(
    ctx,
    api,
    C,
    positions + ' queries × ' + positions + ' keys',
    1350,
    843,
    35,
    C.blue,
    'center',
  );
  if (s.short)
    text(
      ctx,
      api,
      C,
      s.quarterScore ? positions ** 2 + ' of 64 scores remain' : 'How much of the square remains?',
      1350,
      930,
      38,
      C.yellow,
      'center',
    );
}

function paintScoreTile(ctx, api, C, tile) {
  const side = 4;
  const tileSide = 2;
  const tilesPerRow = side / tileSide;
  const firstQ = Math.floor(tile / tilesPerRow) * tileSide;
  const firstK = (tile % tilesPerRow) * tileSide;
  text(ctx, api, C, 'Reusable score tile', 485, 290, 44, C.yellow, 'center');
  text(ctx, api, C, 'Each slot holds the score for one pair', 485, 352, 28, C.ink, 'center');
  for (let q = 0; q < tileSide; q++) {
    for (let k = 0; k < tileSide; k++) {
      const x = 265 + k * 225;
      const y = 439 + q * 108;
      api.rect(ctx, x, y, 209, 92, C.panel, C.yellow, 4);
      if (tile >= 0)
        text(
          ctx,
          api,
          C,
          'Q' + (firstQ + q + 1) + ', K' + (firstK + k + 1),
          x + 104,
          y + 60,
          39,
          C.yellow,
          'center',
        );
    }
  }
  text(ctx, api, C, tileSide ** 2 + ' score slots', 485, 825, 42, C.yellow, 'center');
  const left = 1180;
  const top = 404;
  const cell = 84;
  text(ctx, api, C, 'Pairs in the same short ticket', 1345, 290, 42, C.blue, 'center');
  for (let i = 0; i < side; i++) {
    text(ctx, api, C, 'K' + (i + 1), left + (i + 0.5) * cell - 4, top - 20, 29, C.ink, 'center');
    text(ctx, api, C, 'Q' + (i + 1), left - 20, top + (i + 0.5) * cell + 7, 29, C.ink, 'right');
  }
  for (let q = 0; q < side; q++) {
    for (let k = 0; k < side; k++) {
      const block = Math.floor(q / tileSide) * tilesPerRow + Math.floor(k / tileSide);
      const x = left + k * cell;
      const y = top + q * cell;
      const current = block === tile;
      api.rect(
        ctx,
        x,
        y,
        cell - 8,
        cell - 8,
        current ? C.yellow : C.panel,
        current ? C.yellow : C.blue,
        3,
      );
      if (block < tile) api.circle(ctx, x + (cell - 8) / 2, y + (cell - 8) / 2, 8, C.blue);
    }
  }
  const visited = (tile + 1) * tileSide ** 2;
  text(
    ctx,
    api,
    C,
    visited + ' of ' + side ** 2 + ' pairs visited',
    1345,
    825,
    42,
    C.blue,
    'center',
  );
}

export function paintAllocatorLimits(ctx, scene, state, api, C, c, t, s, id) {
  if (s.step < 2) {
    const x = 240,
      y = 530,
      scale = 1240 / 12;
    api.line(ctx, x, y, x + 1240, y, C.muted, 4);
    for (let v = 0; v <= 12; v += 2) {
      api.line(ctx, x + v * scale, y - 10, x + v * scale, y + 10, C.muted, 3);
      text(ctx, api, C, String(v), x + v * scale, y + 65, 29, C.muted, 'center');
    }
    text(ctx, api, C, 'Supplied recommended maximum working set', 960, 295, 37, C.cyan, 'center');
    api.line(ctx, x + 6 * scale, y - 100, x + 6 * scale, y + 15, C.cyan, 5);
    text(ctx, api, C, '6 GiB recommended', x + 6 * scale, 390, 35, C.cyan, 'center');
    target(ctx, api, 'mps-watermark-ratio', () => {
      if (s.limitReady) {
        api.line(ctx, x + 10.2 * scale, y - 75, x + 10.2 * scale, y + 15, C.pink, 5);
        text(ctx, api, C, '10.2 GiB high limit', x + 10.2 * scale, 695, 32, C.pink, 'center');
        math(ctx, api, C, '6\\times1.7=10.2\\ \\mathrm{GiB}', 960, 825, 53, C.yellow);
      } else
        text(ctx, api, C, 'What does the 1.7 ratio multiply?', 960, 825, 41, C.yellow, 'center');
    });
    if (s.step === 1) {
      text(
        ctx,
        api,
        C,
        'Low watermark → cleanup / adaptive commits',
        960,
        925,
        33,
        C.green,
        'center',
      );
      text(ctx, api, C, 'High ratio 0 removes the allocator cap', 960, 980, 29, C.pink, 'center');
    } else
      text(
        ctx,
        api,
        C,
        'Installed RAM is a different system quantity',
        960,
        945,
        34,
        C.yellow,
        'center',
      );
    foot(ctx, api, C, 'Example working set and allocator limits');
    return;
  }
  target(ctx, api, 'mps-memory-shapes', () => {
    if (s.tiled) paintScoreTile(ctx, api, C, s.tile);
    else paintShapeChange(ctx, api, C, s);
  });
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintAllocatorLimits);
}
export function drawAllocatorLimitsStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'allocator-limits',
  draw: drawAllocatorLimitsStage,
  cues: [
    'allocator-limits-b1',
    'mps-watermark-total',
    'allocator-limits-b2',
    'allocator-limits-b3',
    'mps-shape-halfbatch',
    'mps-shape-halfsequence',
    'mps-reset-batch',
    'full-attention',
    'mps-cut-length',
    'open-score-tile',
    'tile-first',
    'tile-across',
    'tile-next-queries',
    'tile-last',
  ],
};
