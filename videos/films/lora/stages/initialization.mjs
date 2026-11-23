import { learningSteps } from '../model.mjs';
import { num } from '../geometry.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';
import { text, math, node, route } from '../defaults.mjs';
export function drawInitialization(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const steps = learningSteps();
    const movement = cueMotion(state, 'initialization-b3-1', 2, 0.12, 0.32);
    const sample =
      beat < 2
        ? steps[0]
        : {
            ...steps[1],
            a: api.lerp(steps[0].a, steps[1].a, movement),
            b: api.lerp(steps[0].b, steps[1].b, movement),
            output: api.lerp(steps[0].output, steps[1].output, movement),
          };
    const a = api.focus.target('a-initial', () =>
      node(ctx, api, 230, 365, 330, 220, 'A', 'nonzero initialization', themeColors.yellow),
    );
    const b = api.focus.target('b-initial', () =>
      node(
        ctx,
        api,
        800,
        365,
        330,
        220,
        'B',
        movement > 0 ? 'first update' : 'zero initialization',
        themeColors.yellow,
      ),
    );
    const out = api.focus.target('initial-correction', () =>
      node(ctx, api, 1430, 365, 240, 220, '\\Delta h', 'correction', themeColors.green),
    );
    route(ctx, api, a, b, themeColors.yellow, stage(0));
    route(ctx, api, b, out, themeColors.yellow, stage(0));
    text(ctx, api, 'a = ' + num(sample.a), 395, 680, 42, themeColors.yellow, 'center', 'mono');
    text(ctx, api, 'b = ' + num(sample.b), 965, 680, 42, themeColors.yellow, 'center', 'mono');
    text(ctx, api, 'h = ' + num(sample.output), 1550, 680, 42, themeColors.green, 'center', 'mono');
    text(
      ctx,
      api,
      'SCALAR SLICE: x = 1, target = 1, scale = 1',
      960,
      270,
      30,
      themeColors.muted,
      'center',
    );
    math(
      ctx,
      api,
      String.raw`W_0x=0,\quad L=\frac{(h-1)^2}{2},\quad \eta=0.1`,
      960,
      320,
      30,
      themeColors.muted,
      'center',
    );
    const backToB = cueMotion(state, 'init-error-to-b', 1, 0.03, 0.15);
    const backToA = cueMotion(state, 'init-through-b', 2, 0.35, 0.55);
    if (backToB > 0) route(ctx, api, out, b, themeColors.pink, backToB);
    if (backToA > 0) route(ctx, api, b, a, themeColors.pink, backToA);
    const error = sample.output - 1;
    const aReady = resultAfter(state, 'initialization-b2-2', 1, 0.94);
    const bReady = resultAfter(state, 'initialization-b2-1', 1, 0.52);
    for (const [x, target, factor, operand, value, ready] of [
      [395, 'a-gradient', 'A', 'b', sample.b * error, aReady],
      [965, 'b-gradient', 'B', 'a', sample.a * error, bReady],
    ]) {
      api.focus.target(target, () => {
        text(
          ctx,
          api,
          '∂L/∂' + factor + ' = ' + operand + '(h − 1)',
          x,
          795,
          38,
          themeColors.ink,
          'center',
          'mono',
        );
        text(
          ctx,
          api,
          ready ? num(value) : '?',
          x,
          880,
          50,
          ready ? themeColors.pink : themeColors.muted,
          'center',
          'mono',
        );
      });
    }
    if (beat === 0)
      text(ctx, api, 'Which factor gets a nonzero gradient?', 230, 977, 34, themeColors.ink);
    if (beat === 1 && bReady) text(ctx, api, 'Error = 0 − 1 = −1', 1285, 799, 33, themeColors.pink);
    if (beat === 2 && movement === 1)
      text(ctx, api, 'B ← 0 − 0.1 × (−1)', 1285, 799, 32, themeColors.pink);
  }
  ctx.restore();
}
export default {
  id: 'initialization',
  draw: drawInitialization,
  cues: [
    'initialization-b1-1',
    'initialization-b1-2',
    'init-error-to-b',
    'initialization-b2-1',
    'initialization-b2-2',
    'initialization-b3-1',
    'init-through-b',
  ],
};
