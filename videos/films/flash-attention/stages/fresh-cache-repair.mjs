import { cachedBlend, merge, summarize } from '../model.mjs';
import { rowClock } from '../row-workspace.mjs';

const values = [2, 4, 6, 8, 10, 12, 1000, 1000];
const validLength = 6;

export function drawFreshCacheRepair(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const moved = clock.done('move-query'),
    query = moved ? 4 : 5;
  const repaired = clock.done('fa-fresh-repair');
  const mode = repaired ? 'absolute' : clock.started('fa-fresh-unmasked') ? 'all' : 'upper-left';
  const allowed = cachedBlend(query, values, validLength, mode);
  const lastQuestion = moved && !clock.done('future-key');
  const showMask = (state.beat > 0 || repaired) && !lastQuestion;
  const known =
    mode === 'absolute'
      ? moved
        ? clock.done('five-answer')
        : clock.done('fa-fresh-seven')
      : mode === 'all'
        ? clock.done('fa-fresh-255')
        : clock.done('fa-fresh-two');
  const origin = 200,
    stride = 196,
    w = 165,
    x = (i) => origin + i * stride;
  api.focus.target('cache', () => {
    api.text(ctx, 'Position', 102, 353, 27, C.muted, 'center');
    for (const [i, v] of values.entries()) {
      const col = i < validLength ? C.blue : C.muted;
      api.text(ctx, i, x(i) + w / 2, 351, 35, col, 'center');
      api.rect(ctx, x(i), 384, w, 112, C.panel, col, 7);
      api.text(ctx, v, x(i) + w / 2, 456, 42, C.ink, 'center');
      if (showMask && allowed.allowed[i])
        api.rect(ctx, x(i), 523, w, 18, mode === 'absolute' ? C.cyan : C.pink, undefined, 0);
      if (showMask && moved && i > query && i < validLength) {
        api.text(ctx, 'future', x(i) + w / 2, 545, 33, C.yellow, 'center');
      }
    }
    const qx = x(query) + w / 2;
    api.text(ctx, 'Query at ' + query, qx, 242, 37, C.yellow, 'center');
    api.line(ctx, qx, 262, qx, 300, C.yellow, 4);
    for (const [a, b, label] of [
      [0, 5, '6 valid slots'],
      [6, 7, 'Unused capacity'],
    ]) {
      const left = x(a),
        right = x(b) + w;
      api.path(
        ctx,
        [
          { x: left, y: 561 },
          { x: left, y: 577 },
          { x: right, y: 577 },
          { x: right, y: 561 },
        ],
        { color: C.muted, width: 2 },
      );
      api.text(ctx, label, (left + right) / 2, 630, 31, C.muted, 'center');
    }
  });
  api.focus.target('mask-counts', () => {
    let line = 'All scores = 0. Each admitted key has weight 1.';
    if (showMask) {
      if (mode === 'upper-left') line = 'Upper-left mask   ·   Keep column 0';
      if (mode === 'all') line = 'Open mask   ·   Keep all 8 columns';
      if (mode === 'absolute') line = 'j < valid_length and j <= query_position';
    }
    api.text(
      ctx,
      line,
      960,
      738,
      39,
      C.ink,
      'center',
      showMask && mode === 'absolute' ? 'mono' : 'sans',
    );
    if (!showMask) {
      api.text(
        ctx,
        lastQuestion
          ? 'Which value drops out? What is the new average?'
          : 'Which keys belong in the average?',
        960,
        908,
        47,
        C.yellow,
        'center',
      );
      return;
    }
    if (!known) {
      const sumVisible = moved && clock.done('five-sum');
      const prompt = moved
        ? sumVisible
          ? allowed.u + ' ÷ ' + allowed.l + ' = ?'
          : values.filter((_, i) => allowed.allowed[i]).join(' + ')
        : 'Predict this mask’s blend';
      api.text(ctx, prompt, 960, 912, 42, C.yellow, 'center');
      return;
    }
    api.text(
      ctx,
      'm = ' +
        allowed.m +
        '       Total weight = ' +
        allowed.l +
        '       Weighted sum = ' +
        allowed.u,
      960,
      837,
      38,
      C.ink,
      'center',
    );
    if (mode === 'absolute') {
      const kept = values.filter((_, i) => allowed.allowed[i]);
      const blocks = [];
      for (let i = 0; i < kept.length; i += 3) {
        const tile = kept.slice(i, i + 3);
        blocks.push(
          summarize(
            tile.map(() => 0),
            tile,
          ),
        );
      }
      const tiled = blocks.reduce(merge);
      const match = Math.abs(tiled.u / tiled.l - allowed.output) < 1e-12;
      api.text(
        ctx,
        'Output ' + allowed.output + (match ? ' · dense and tiled agree' : ''),
        960,
        961,
        45,
        C.green,
        'center',
      );
    } else api.text(ctx, 'Wrong blend ' + allowed.output, 960, 961, 45, C.pink, 'center');
  });
}

export default {
  id: 'fresh-cache-repair',
  draw: drawFreshCacheRepair,
  cues: [
    'cache-premise',
    'cache-question',
    'upper-mask',
    'fa-fresh-two',
    'fa-fresh-unmasked',
    'fa-fresh-255',
    'fa-fresh-repair',
    'fa-fresh-seven',
    'move-query',
    'last-question',
    'future-key',
    'five-sum',
    'five-answer',
  ],
};
