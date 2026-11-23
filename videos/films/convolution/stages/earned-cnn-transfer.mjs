import { poolSnapshot } from '../arithmetic.mjs';
import { ARTICLE_CROP, RIDGE } from '../fixtures.mjs';
import { cropForward } from '../model.mjs';
import { cueClock, footprint } from '../footprint.mjs';
import { formatChapterValue as fmt, text, valueGrid } from '../defaults.mjs';

const baseline = cropForward();
const oldWinner = baseline.pool.owners[0].flat;
const gradient = -2;

// Both traces use the same short section of the response axis. Their vertical separation carries no value.
function responseRace(ctx, api, finalResponse, sweep) {
  const left = 1030,
    right = 1750;
  const x = (v) => left + ((v - 0.85) / 0.03) * (right - left);
  const leader = baseline.value;
  const reference = x(leader);
  text(ctx, api, sweep === 0 ? 'Original responses' : 'Responses', (left + right) / 2, 204, 32, api.C.ink, 'center');
  for (const tick of [0.85, 0.86, 0.87, 0.88]) {
    text(ctx, api, tick.toFixed(2), x(tick), 255, 29, api.C.muted, 'center');
    api.line(ctx, x(tick), 273, x(tick), 299, api.C.muted, 2);
  }
  api.line(ctx, reference, 402, reference, 452, api.C.muted, 3);
  for (const [i, [name, value, color]] of [
    ['Upper left', api.lerp(baseline.raw[0][0], finalResponse, sweep), api.C.yellow],
    ['Bottom right', leader, api.C.cyan],
  ].entries()) {
    const y = 338 + i * 114;
    text(ctx, api, name, 715, y + 13, 38, color);
    api.line(ctx, left, y, right, y, api.C.muted, 2);
    if (i === 0 && sweep > 0)
      api.line(ctx, x(baseline.raw[0][0]), y, x(value), y, color, 8);
    api.circle(ctx, x(value), y, 12, color);
    const printed = i === 0 && sweep < 1 ? baseline.raw[0][0] : value;
    text(ctx, api, printed.toFixed(3), x(printed), y + 52, 33, color, 'center');
  }
}

export function drawEarnedCnnTransfer(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const { C } = api;
  const repeat = cue('repeat-reset') > 0;
  const pixelCue = repeat ? 'repeat-pixel' : 'fresh-pixel';
  const proposed = repeat ? 0.02 : 0.01;
  const edited = cue(pixelCue) === 1;
  const actual = cropForward(edited ? proposed : ARTICLE_CROP[0][0]);
  const sweep = cue(repeat ? 'repeat-map' : 'fresh-map');
  const marked = cue(repeat ? 'repeat-owner' : 'fresh-owner') === 1;
  const scores = cue(repeat ? 'repeat-head' : 'fresh-logits');
  const others = cue(repeat ? 'repeat-other-values' : 'fresh-other-values') === 1;
  const returnCue = repeat ? 'repeat-gradient' : 'fresh-gradient';
  const travel = cue(returnCue, 1.2);
  const send = repeat ? edited : cue('fresh-send') > 0 || cue(returnCue) > 0;
  const inspect = cue(repeat ? 'repeat-delta' : 'fresh-delta') > 0;
  const window = cue(repeat ? 'repeat-delta' : 'fresh-footprint') > 0;
  const saved = actual.pool.owners[0];
  const deltaPixel = actual.image[0][0] - baseline.image[0][0];
  api.focus.target('finish-crop', () => {
    text(ctx, api, marked ? 'Winning window' : 'Panel crop', 355, 269, 37, marked ? C.green : C.ink, 'center');
    valueGrid(ctx, api, actual.image, 118, 335, 119, {
      kind: 'image',
      active: edited ? 0 : undefined,
      font: 35,
    });
    if (marked) footprint(ctx, api, 118, 335, 119, ...saved.input, 3, 3, C.green);
    else if (window) footprint(ctx, api, 118, 335, 119, 0, 0, 3, 3, C.yellow);
    if (edited)
      text(ctx, api, 'Corner    0.05 → ' + proposed.toFixed(2), 355, 891, 38, C.yellow, 'center');
    if (inspect) {
      const change = deltaPixel * RIDGE[0][0];
      const rhs = sweep === 1 ? '+' + change.toFixed(3) : '?';
      text(
        ctx,
        api,
        fmt(deltaPixel) + ' × (' + fmt(RIDGE[0][0]) + ') = ' + rhs,
        355,
        975,
        39,
        C.ink,
        'center',
      );
    } else {
      text(ctx, api, 'Corner weight   ' + fmt(RIDGE[0][0]), 355, 975, 36, C.muted, 'center');
    }
  });
  api.focus.target('finish-race', () => responseRace(ctx, api, actual.raw[0][0], sweep));
  api.focus.target('finish-map', () => {
    const format = (v) => (typeof v === 'number' ? v.toFixed(3) : v);
    text(ctx, api, 'Original map', 1171, 661, 33, C.muted, 'center');
    valueGrid(ctx, api, baseline.raw, 1065, 700, 110, { font: 30, formatter: format });
    footprint(ctx, api, 1065, 700, 110, oldWinner >> 1, oldWinner % 2, 1, 1, C.cyan);
    if (!edited) return;
    text(ctx, api, 'Edited map', 1408, 661, 33, C.ink, 'center');
    const values = actual.raw.map((row, r) =>
      row.map((v, c) => ((r === 0 && c === 0 ? sweep === 1 : others) ? v : '?')),
    );
    valueGrid(ctx, api, values, 1302, 700, 110, { font: 30, formatter: format });
    if (marked) footprint(ctx, api, 1302, 700, 110, ...saved.input, 1, 1, C.green);
    if (!window && sweep === 0 && !marked) {
      const question = repeat ? 'Which window receives −2?' : 'Which window changes? Can it take the lead?';
      text(ctx, api, question, 1280, 578, 36, C.yellow, 'center');
    }
  });
  if (send)
    api.focus.target('finish-gradient', () => {
      text(ctx, api, 'Map gradient', 939, 709, 31, C.ink, 'center');
      text(ctx, api, 'Pooled gradient', 716, 745, 28, C.muted, 'center');
      text(ctx, api, '−2', 716, 818, 46, C.pink, 'center');
      const arrived = travel === 1;
      const { gradient: routed } = poolSnapshot(actual.activated, { incoming: [[gradient]] });
      const dest = valueGrid(ctx, api, routed, 850, 754, 92, {
        show: arrived ? Infinity : 0,
        kind: arrived ? 'gradient' : 'values',
        font: 38,
      });
      if (arrived) footprint(ctx, api, 850, 754, 92, ...saved.input, 1, 1, C.pink);
      if (travel > 0 && !arrived) {
        const cell = dest[saved.flat];
        const radius = 21;
        const start = { x: 774, y: 797 };
        const points = [start];
        if (saved.input[0] > 0) {
          const laneY = cell.y + cell.height + 3 * radius;
          points.push(
            { x: 805, y: start.y },
            { x: 805, y: laneY },
            { x: cell.x + cell.width / 2, y: laneY },
          );
        }
        points.push(api.anchor(cell, points.at(-1), radius + 3));
        const tip = api.components.particle({ points, progress: travel, radius, fill: C.pink });
        api.line(ctx, tip.x - 10, tip.y, tip.x + 10, tip.y, C.bg, 4);
      }
    });
  api.focus.target('finish-head', () => {
    const scored = scores === 1 ? actual : baseline;
    const logits = scored.logits.map((v) => fmt(v, 4).replace('-', '−')).join(', ');
    const scoreLabel = scores > 0 ? 'logits' : 'Original logits';
    const values = scores > 0 && scores < 1 ? '?, ?' : logits;
    if (edited) {
      text(ctx, api, 'Pooled max', 1692, 661, 33, C.ink, 'center');
      text(ctx, api, marked ? fmt(actual.value) : '?', 1692, 818, 52, marked ? C.green : C.ink, 'center');
    }
    if (scores > 0) {
      const max = fmt(actual.value);
      text(ctx, api, '[1.4 × ' + max + ' − 0.2,   −0.9 × ' + max + ' + 0.1]', 1390, 959, 29, C.muted, 'center');
    }
    text(
      ctx,
      api,
      scoreLabel + ' [' + values + ']',
      1390,
      1012,
      37,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'earned-cnn-transfer',
  draw: drawEarnedCnnTransfer,
  cues: [
    'fresh-start',
    'fresh-pixel',
    'fresh-footprint',
    'fresh-delta',
    'fresh-map',
    'fresh-other-values',
    'fresh-owner',
    'fresh-logits',
    'fresh-send',
    'fresh-gradient',
    'repeat-reset',
    'repeat-pixel',
    'repeat-delta',
    'repeat-map',
    'repeat-other-values',
    'repeat-owner',
    'repeat-head',
    'repeat-gradient',
  ],
};
