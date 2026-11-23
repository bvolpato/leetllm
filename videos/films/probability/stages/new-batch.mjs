import { changedQueue, freshCapacity, freshQueue } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

export function drawNewBatch(ctx, scene, state, api) {
  const { C } = api;
  const q = (id, beat) => cueProgress(state, id, beat);
  const changed = q('fresh-rate-change', 3) === 1;
  const replay = q('fresh-extra', 4);
  const spare = freshCapacity - freshQueue.total;
  const over = changedQueue.total - freshCapacity;
  const extra = Math.floor(spare * q('fresh-fill-spare', 4)) + Math.floor(over * q('fresh-over', 4));
  const tp = Math.floor(freshQueue.tp * q('fresh-true', 1));
  const fp = Math.floor(freshQueue.fp * q('fresh-false', 1)) + extra;
  const total = tp + fp;
  const left = 180, width = 1550, scale = width / 1000;
  const limitX = left + freshCapacity * scale;

  if (state.beat === 5) {
    text(ctx, api, 'Expected reviews per 20,000 signups', left, 269, 46, C.ink, 'left');
    text(ctx, api, freshCapacity + ' slots', limitX, 328, 39, C.yellow);
    for (const [index, queue] of [freshQueue, changedQueue].entries()) {
      const y = index === 0 ? 382 : 643;
      const caughtWidth = queue.tp * scale;
      const cleanWidth = queue.fp * scale;
      text(ctx, api, (100 * queue.falsePositiveRate) + '% of clean signups flagged', left, y - 20, 40, C.ink, 'left');
      rectangle(ctx, api, left, y, width, 98, C.panel);
      rectangle(ctx, api, left, y, caughtWidth, 98, C.red);
      rectangle(ctx, api, left + caughtWidth, y, cleanWidth, 98, C.blue);
      text(ctx, api, queue.tp + ' abusive', left + caughtWidth / 2, y + 63, 41, C.bg);
      text(ctx, api, queue.fp + ' clean', left + caughtWidth + cleanWidth / 2, y + 63, 41, C.bg);
      const difference = index === 0 ? spare + ' slots spare' : over + ' over capacity';
      text(ctx, api, queue.total + ' reviews   ·   ' + difference, left, y + 155, 44, C.yellow, 'left');
    }
    line(ctx, api, limitX, 350, limitX, 765, C.yellow, 5);
    text(ctx, api, freshQueue.missed + ' abusive signups missed at either setting', left, 940, 41, C.red, 'left');
    return;
  }

  focus(api, 'fresh-sources', () => {
    text(ctx, api, '20,000 incoming signups', 960, 260, 48);
    const split = q('fresh-population', 1) === 1;
    text(ctx, api, split ? '600 abusive' : '3% abusive', 470, 375, 51, C.red);
    text(ctx, api, split ? '19,400 clean' : '97% clean', 1410, 375, 51, C.blue);
    if (q('fresh-rates', 0) > 0) {
      text(ctx, api, '80% flagged', 470, 459, 44, C.red);
      text(ctx, api, changed ? '2% → 2.5% flagged' : '2% flagged', 1410, 459, 44, changed ? C.yellow : C.blue);
    }
  });
  focus(api, 'fresh-queue', () => {
    const comparing = changed && extra === 0;
    text(ctx, api, comparing ? 'Queue at the original 2% rate' : 'Expected review queue', left, 585, 40, C.ink, 'left');
    text(ctx, api, freshCapacity + ' slots', limitX, 585, 40, C.yellow);
    const y = 643, h = 98;
    rectangle(ctx, api, left, y, width, h, C.panel);
    if (tp) rectangle(ctx, api, left, y, tp * scale, h, C.red);
    if (fp) rectangle(ctx, api, left + tp * scale, y, fp * scale, h, C.blue);
    if (extra) {
      const oldX = left + freshQueue.total * scale;
      line(ctx, api, oldX, y + 5, oldX, y + h - 5, C.bg, 4);
    }
    line(ctx, api, limitX, y - 35, limitX, y + h + 24, C.yellow, 5);
    if (tp) text(ctx, api, tp + ' abusive', left + freshQueue.tp * scale / 2, 819, 43, C.red);
    if (fp) text(ctx, api, fp + ' clean', left + (freshQueue.tp + fp / 2) * scale, 819, 43, C.blue);
    const firstTotal = q('fresh-total', 2) === 1;
    const slack = q('fresh-slots', 2) === 1;
    const finalTotal = q('fresh-over', 4) === 1;
    if (firstTotal && !changed) {
      const headroom = slack ? '   ·   ' + (freshCapacity - freshQueue.total) + ' slots spare' : '';
      text(ctx, api, freshQueue.total + ' reviews' + headroom,
        left, 925, 48, C.yellow, 'left');
    } else if (finalTotal) {
      text(ctx, api, total + ' reviews   ·   ' + (total - freshCapacity) + ' over budget', left, 925, 48, C.yellow, 'left');
    } else if (changed && replay === 0) {
      text(ctx, api, 'How much room will the new flags need?', left, 925, 42, C.ink, 'left');
    } else if (q('fresh-addition', 4) === 1) {
      text(ctx, api, changedQueue.fp - freshQueue.fp + ' additional clean flags', left, 925, 45, C.blue, 'left');
    } else if (replay > 0) {
      text(ctx, api, '19,400 clean signups × 0.005', left, 925, 45, C.blue, 'left');
    }
    if (q('fresh-misses', 2) === 1)
      text(ctx, api, freshQueue.missed + ' abusive signups missed', left + width, 920, 38, C.red, 'right');
    if (q('fresh-risk', 2) === 1 && !changed)
      text(ctx, api, 'Risk within this queue   ' + freshQueue.tp + ' / ' + freshQueue.total + ' ≈ ' +
        (100 * freshQueue.tp / freshQueue.total).toFixed(1) + '%', left, 1000, 36, C.muted, 'left');
  });
}
export default {
  id: 'new-batch', draw: drawNewBatch,
  cues: ['fresh-rates', 'fresh-population', 'fresh-true', 'fresh-false', 'fresh-total', 'fresh-slots', 'fresh-misses', 'fresh-risk', 'fresh-rate-change', 'fresh-extra', 'fresh-addition', 'fresh-fill-spare', 'fresh-over'],
};
