import { momentumFixture } from '../arithmetic.mjs';
import { rows } from '../fixtures.mjs';
import {
  drawArrow,
  drawBox,
  drawEquation,
  drawMatrix,
  drawText,
  footer,
  mark,
} from '../defaults.mjs';
export function drawStateReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-state-replay-b' + currentBeat);
  const paint = () => {
    const f = momentumFixture(),
      mask = [
        [1, 0],
        [1, 1],
        [1, 1],
        [0, 0],
      ],
      masked = currentBeat > 0 || resultComplete('state-mask');
    drawText(
      ctx,
      api,
      'Actual momentum + input-dropout fixture · keep probability .75',
      960,
      270,
      33,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawMatrix(
        ctx,
        api,
        rows.map((r) => r.x),
        170,
        390,
        {
          cw: 100,
          ch: 105,
          label: 'original features',
        },
      );
      drawMatrix(ctx, api, mask, 650, 390, {
        cw: 100,
        ch: 105,
        color: themeColors.pink,
        label: 'actual mask',
      });
      drawMatrix(ctx, api, f.features, 1240, 390, {
        cw: 190,
        ch: 105,
        color: themeColors.cyan,
        known: masked,
        label: 'kept / .75',
      });
      if (resultComplete('state-pre-loss'))
        drawText(ctx, api, 'pre-update loss = 3.75', 960, 940, 36, themeColors.yellow);
    } else if (currentBeat === 1) {
      drawMatrix(ctx, api, [-2, 0, -2.5], 300, 390, {
        cw: 270,
        ch: 100,
        color: themeColors.pink,
        label: 'gradient [weight0, weight1, bias]',
        known: resultComplete('state-masked-gradient'),
      });
      if (cueProgress('state-momentum') > 0) drawEquation(ctx, api, 'v_{new}=0.9v+g', 960, 625, 47);
      drawMatrix(ctx, api, [0, 0, 0], 200, 760, {
        cw: 200,
        ch: 100,
        color: themeColors.blue,
        label: 'old velocity',
      });
      drawMatrix(ctx, api, f.nextVelocity, 1100, 760, {
        cw: 200,
        ch: 100,
        color: themeColors.green,
        label: 'returned velocity',
        known: resultComplete('state-momentum'),
      });
      if (resultComplete('state-masked-update'))
        drawText(ctx, api, 'returned parameters [0.1, 0, 0.125]', 960, 945, 35, themeColors.green);
    } else {
      const next = cueProgress('state-next') > 0;
      drawBox(
        ctx,
        api,
        next ? 'p1 · v1 · K1' : 'p0 · v0 · K0',
        220,
        390,
        680,
        110,
        next ? themeColors.green : themeColors.blue,
      );
      drawBox(
        ctx,
        api,
        next ? 'next state p2 · v2 · K2' : 'replayed p1 · v1 · K1',
        1110,
        390,
        650,
        110,
        themeColors.green,
      );
      drawArrow(ctx, api, 930, 445, 1080, 445, themeColors.cyan);
      drawMatrix(ctx, api, mask, 220, 660, {
        cw: 100,
        ch: 65,
        color: themeColors.pink,
        label: 'first actual mask remains recorded',
      });
      drawText(
        ctx,
        api,
        next
          ? 'Different continuation identity K1 → K2'
          : 'Same complete old inputs reproduce the result',
        1230,
        800,
        32,
        themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        'Final fit needs a fresh loss at the final returned parameters',
        1060,
        935,
        30,
        themeColors.muted,
      );
    }
    footer(
      ctx,
      api,
      'This stochastic momentum step differs from the earlier unmasked plain-SGD recurrence',
    );
  };
  mark(ctx, api, 'jx-state-replay-mechanism', paint);
}
export default {
  id: 'state-replay',
  draw: drawStateReplay,
  cues: [
    'jx-state-replay-b0',
    'state-mask',
    'state-pre-loss',
    'jx-state-replay-b1',
    'state-masked-gradient',
    'state-momentum',
    'state-masked-update',
    'jx-state-replay-b2',
    'state-replayed',
    'state-next',
  ],
};
