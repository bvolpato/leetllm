import { bandwidthWorksheet } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const bandwidth = 3350;
const x = (ms) => 435 + ms * 52;

function readRow(ctx, api, { target, gb, y, color, progress, timed, rated }) {
  const { milliseconds, tps } = bandwidthWorksheet(gb, bandwidth);
  api.focus.target(target, () => {
    api.text(ctx, gb + ' GB', 150, y + 47, 53, color);
    api.line(ctx, x(0), y + 34, x(18), y + 34, api.C.muted + '70', 3);
    if (progress > 0) {
      const end = x(milliseconds * progress);
      api.rect(ctx, x(0), y, end - x(0), 68, color, undefined, 4);
    }
    if (timed)
      api.text(ctx, milliseconds.toFixed(2) + ' ms', x(milliseconds), y - 16, 34, color, 'center');
    if (rated) api.text(ctx, '≈ ' + tps.toFixed(0) + ' tokens/s', 1790, y + 48, 43, color, 'right');
  });
}

export function drawBandwidthCeiling(ctx, scene, state, api) {
  const { C } = api;
  api.text(ctx, 'One caller  ·  one weight read per token', 150, 248, 36, C.ink);
  api.text(ctx, 'H100 SXM peak  ·  3,350 GB/s', 1790, 248, 36, C.ink, 'right');
  api.text(ctx, 'Active weights', 150, 372, 31, C.muted);
  api.text(ctx, 'Read time', x(0), 372, 31, C.muted);
  api.text(ctx, 'Weight-only ceiling', 1790, 372, 31, C.muted, 'right');
  for (let ms = 0; ms <= 16; ms += 4) {
    for (const y of [478, 628, 778]) api.line(ctx, x(ms), y + 52, x(ms), y + 81, C.muted + '70', 2);
    api.text(ctx, ms + ' ms', x(ms), 908, 30, C.muted, 'center');
  }

  const progress = (id, beat, start, end) => cueProgress(state, id, beat, start, end);
  const done = (id, beat, end) => afterClause(state, id, beat, end);
  readRow(ctx, api, {
    target: 'full-weights',
    gb: 54,
    y: 478,
    color: C.blue,
    progress: progress('full-read', 0, 0.42, 0.95),
    timed: done('full-read', 0, 0.95),
    rated: done('full-rate', 1, 0.26),
  });
  const packed = progress('packed-input', 1, 0.58, 0.8) > 0;
  if (packed)
    readRow(ctx, api, {
      target: 'packed-weights',
      gb: 27,
      y: 628,
      color: C.cyan,
      progress: progress('packed-read', 2, 0, 0.1),
      timed: done('packed-read', 2, 0.1),
      rated: done('packed-rate', 2, 0.48),
    });
  const small = progress('small-read', 2, 0.49, 0.84);
  if (small > 0)
    readRow(ctx, api, {
      target: 'small-weights',
      gb: 16,
      y: 778,
      color: C.green,
      progress: small,
      timed: done('small-read', 2, 0.84),
      rated: done('small-rate', 2, 0.98),
    });

  const footer =
    state.beat >= 3
      ? 'Whole decode step  ·  weight reads, KV traffic, compute and sampling'
      : packed && state.beat === 1
        ? 'Half the bytes. How long does the read take?'
        : 'Read time  =  active weight bytes ÷ memory bandwidth';
  api.text(ctx, footer, 960, 1000, 38, C.ink, 'center');
}

export default {
  id: 'bandwidth-ceiling',
  draw: drawBandwidthCeiling,
  cues: [
    'full-read',
    'full-rate',
    'packed-input',
    'packed-read',
    'packed-rate',
    'small-read',
    'small-rate',
  ],
};
