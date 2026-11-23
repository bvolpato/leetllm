import { loopMicrobatch } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { finished, progressDuring } from '../scene-clock.mjs';

export function drawMicrobatchDenominators(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat;
  const equal = loopMicrobatch(true);
  const counted = loopMicrobatch();
  const resize = progressDuring(state, 'micro-count', 1, 0.4, 0.53);
  const revealChunk = finished(state, 'micro-equal', 1, 0.09);
  const chunkResult = finished(state, 'micro-chunk-result', 1, 0.37);
  const revealRows = finished(state, 'micro-row-result', 1, 0.77);
  const left = 200,
    span = 1520;
  const widthC = equal.factors[1] + (counted.factors[1] - equal.factors[1]) * resize;
  const shares = [(1 - widthC) / 2, (1 - widthC) / 2, widthC];
  api.focus.target('micro-shares', () => {
    text(ctx, api, 'Weight of each ticket in the mean loss', left, 277, 39, C.ink);
    const split = left + span * (1 - widthC);
    for (const [start, stop, label, color] of [
      [left, split, 'Chunk 1   ·   two tickets', C.blue],
      [split, left + span, 'Chunk 2   ·   one ticket', C.pink],
    ]) {
      api.line(ctx, start + 6, 352, stop - 6, 352, color, 4);
      text(ctx, api, label, (start + stop) / 2, 329, 32, color, 'center');
    }
    let cursor = left;
    for (const [i, share] of shares.entries()) {
      const width = share * span;
      const center = cursor + width / 2;
      const color = i === 2 ? C.pink : C.blue;
      api.rect(ctx, cursor + 5, 378, width - 10, 205, C.panel, color, 8);
      text(
        ctx,
        api,
        ['A   [1, 1]', 'B   [−1, −1]', 'C   [2, 1]'][i],
        center,
        449,
        43,
        color,
        'center',
      );
      text(
        ctx,
        api,
        i === 1 ? 'Target  standard' : 'Target  escalate',
        center,
        503,
        29,
        C.muted,
        'center',
      );
      text(
        ctx,
        api,
        'Gradient  +' + equal.means[i === 2 ? 1 : 0][0],
        center,
        553,
        32,
        C.ink,
        'center',
      );
      const fraction =
        resize >= 1 ? '1/3' : revealChunk && resize === 0 ? ['1/4', '1/4', '1/2'][i] : '';
      if (fraction) text(ctx, api, fraction, center, 651, 40, color, 'center');
      cursor += width;
    }
  });
  api.focus.target('micro-readout', () => {
    if (beat < 2) {
      const expr = revealRows
        ? '(0.5 + 0.5 + 1) / 3   =   2/3'
        : revealChunk && resize === 0
          ? '¼ × 0.5   +   ¼ × 0.5   +   ½ × 1   =   ' + (chunkResult ? equal.gradient[0] : '?')
          : resize > 0
            ? '(0.5 + 0.5 + 1) / 3   =   ?'
            : 'With equal chunk weights, what fraction multiplies C’s loss?';
      text(ctx, api, expr, 960, 811, 49, revealRows ? C.green : C.ink, 'center');
      text(
        ctx,
        api,
        'Standard-route urgency weight   ·   weights held fixed',
        960,
        936,
        31,
        C.muted,
        'center',
      );
    } else if (beat === 2) {
      text(ctx, api, '(⅔ × mean loss of A and B).backward()', 960, 779, 44, C.blue, 'center');
      text(ctx, api, '(⅓ × loss of C).backward()', 960, 866, 44, C.pink, 'center');
      text(
        ctx,
        api,
        'One optimizer step after both contributions',
        960,
        974,
        31,
        C.muted,
        'center',
      );
    } else {
      const scaled = finished(state, 'micro-scale', 3, 0.91);
      api.text(ctx, 'A and B   ·   no_sync()', 585, 792, 35, C.blue, 'center', 'mono');
      text(ctx, api, 'C   ·   synchronize in backward', 1350, 792, 38, C.pink, 'center');
      text(
        ctx,
        api,
        scaled
          ? 'Unscale once   →   clip   →   step   →   update scale'
          : 'Hold the weights and the loss scale fixed across the window.',
        960,
        930,
        39,
        C.ink,
        'center',
      );
    }
  });
}
export default {
  id: 'microbatch-denominators',
  draw: drawMicrobatchDenominators,
  cues: [
    'micro-first-chunks',
    'micro-question',
    'micro-equal',
    'micro-chunk-result',
    'micro-count',
    'micro-row-result',
    'micro-loss',
    'micro-window',
    'micro-scale',
  ],
};
