import { FIXTURE } from '../observations.mjs';
import { drawClipText } from '../defaults.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawBatch } from './matrix.mjs';

export function drawObjective(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const column = beat >= 2;
  const rowProb = FIXTURE.rowProbabilities[0][0];
  const colProb = FIXTURE.columnProbabilities[0][0];
  const share = column ? colProb : rowProb;
  const logitSet = column ? FIXTURE.logits.map((r) => r[0]) : FIXTURE.logits[0];
  const terms = logitSet.map((v) => Math.exp(v - logitSet[0]));
  const target = (id, paint) => api.focus.target(id, paint);
  target('loss-grid', () =>
    drawBatch(ctx, api, {
      values: FIXTURE.logits,
      digits: 2,
      diagonal: true,
      row: beat === 0 ? 0 : undefined,
      column: beat === 2 ? 0 : undefined,
    }),
  );

  const x = 1485;
  if (beat === 1) {
    drawClipText(ctx, api, 'Given the caption', x, 445, 36, C.muted);
    drawClipText(ctx, api, '“Blocked vent”', x, 545, 48, C.yellow);
    drawClipText(ctx, api, 'Which three cells compete for this caption?', 960, 958, 39);
    return;
  }
  if (beat < 3) {
    drawClipText(ctx, api, column ? 'One caption' : 'One photo', x, 360, 40, C.ink);
    drawClipText(ctx, api, column ? 'Which photo?' : 'Which caption?', x, 426, 36, C.cyan);
    const showShare =
      spokenProgress(state, column ? 'loss-column-share' : 'loss-row-share', column ? 2 : 0) > 0;
    if (showShare) {
      drawClipText(ctx, api, 'Paired weight', x, 548, 29, C.muted);
      drawClipText(ctx, api, '1', x, 616, 43, C.yellow);
      api.line(ctx, x - 203, 642, x + 203, 642, C.ink, 3);
      drawClipText(
        ctx,
        api,
        terms.map((v, i) => (i ? v.toFixed(4) : '1')).join(' + '),
        x,
        700,
        34,
        C.ink,
      );
      drawClipText(ctx, api, '= ' + share.toFixed(4), x, 802, 49, C.yellow);
    }
    const showLoss =
      spokenProgress(state, column ? 'loss-column-log' : 'loss-row-log', column ? 2 : 0) > 0;
    if (showLoss)
      drawClipText(
        ctx,
        api,
        'Paired loss     -ln(' +
          share.toFixed(4) +
          ') ≈ ' +
          (-Math.log(share)).toFixed(4) +
          ' nats',
        960,
        958,
        40,
        C.ink,
      );
    else drawClipText(ctx, api, 'Weights use exp(logit - paired logit)', 960, 958, 31, C.muted);
  } else {
    drawClipText(ctx, api, 'Mean loss in nats', x, 361, 37);
    for (const [i, mean] of [FIXTURE.imageToTextLoss, FIXTURE.textToImageLoss].entries()) {
      drawClipText(
        ctx,
        api,
        i ? '3 caption columns' : '3 photo rows',
        x,
        472 + i * 166,
        31,
        C.muted,
      );
      drawClipText(ctx, api, mean.toFixed(6), x, 542 + i * 166, 49, C.ink);
    }
    if (spokenProgress(state, 'loss-mean', 3) > 0)
      drawClipText(
        ctx,
        api,
        'Mean of both directions     ' + FIXTURE.symmetricLoss.toFixed(6) + ' nats',
        960,
        958,
        40,
        C.yellow,
      );
  }
}

export default {
  id: 'objective',
  draw: drawObjective,
  cues: ['loss-row-share', 'loss-row-log', 'loss-column-share', 'loss-column-log', 'loss-mean'],
};
