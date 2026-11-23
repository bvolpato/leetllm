import { gruComparisonFrame } from '../construction.mjs';
import { gruResetComparison } from '../model.mjs';
import { math, resetGrid, resetMath, resetText, text } from '../defaults.mjs';
function drawResetComparison(ctx, state, api) {
  const { C, components: c, teaching: t } = api,
    model = gruResetComparison(),
    frame = gruComparisonFrame(state);
  resetText(
    ctx,
    api,
    'Same authored fixture · input contribution and all biases = 0',
    960,
    270,
    28,
    C.muted,
    'center',
  );
  resetText(ctx, api, 'Recurrent matrix W', 340, 325, 28, C.cyan, 'center');
  c.matrix({
    values: model.recurrent,
    x: 255,
    y: 350,
    cellSize: 72,
    gap: 8,
    style: {
      fill: C.panel,
      stroke: C.cyan,
      textColor: C.cyan,
      fontSize: 30,
      padding: 8,
    },
  });
  resetText(ctx, api, 'Previous h', 835, 345, 28, C.blue, 'center');
  resetGrid(ctx, api, model.hidden, 635, 375, C.blue);
  resetText(ctx, api, 'Reset r', 1420, 345, 28, C.pink, 'center');
  resetGrid(ctx, api, model.reset, 1220, 375, C.pink);
  for (const [index, after] of [true, false].entries()) {
    const x = 140 + index * 840,
      color = after ? C.cyan : C.pink,
      stage = after ? frame.afterStage : frame.beforeStage;
    c.panel({
      x,
      y: 535,
      width: 800,
      height: 450,
      fill: C.panel,
      stroke: color,
      padding: 22,
    });
    resetText(
      ctx,
      api,
      after ? 'PyTorch · reset after W' : 'Original · reset before W',
      x + 400,
      580,
      30,
      color,
      'center',
    );
    api.focus.target(after ? 'gru-after-equation' : 'gru-before-equation', () =>
      resetMath(
        ctx,
        api,
        after ? String.raw`\tilde h=\tanh(r\odot(Wh))` : String.raw`\tilde h=\tanh(W(r\odot h))`,
        x + 400,
        640,
        38,
        color,
        'center',
      ),
    );
    api.focus.target(after ? 'gru-after-calculation' : 'gru-before-calculation', () => {
      resetText(ctx, api, after ? 'Wh' : 'r ⊙ h', x + 40, 710, 28, color);
      resetGrid(
        ctx,
        api,
        stage >= 1 ? (after ? model.projected : model.resetHidden) : ['·', '·'],
        x + 310,
        670,
        color,
      );
      resetText(ctx, api, after ? 'r ⊙ (Wh)' : 'W(r ⊙ h)', x + 40, 790, 28, color);
      resetGrid(
        ctx,
        api,
        stage >= 2 ? (after ? model.after : model.before) : ['·', '·'],
        x + 310,
        750,
        color,
      );
      resetText(ctx, api, 'tanh → candidate', x + 40, 890, 27, C.green);
      resetGrid(
        ctx,
        api,
        stage >= 2 ? (after ? model.afterCandidate : model.beforeCandidate) : ['·', '·'],
        x + 310,
        850,
        C.green,
      );
    });
  }
  resetText(
    ctx,
    api,
    'The same W, h and r produce different candidates',
    960,
    1040,
    30,
    C.yellow,
    'center',
  );
}
export function drawGru(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.12, 0.86),
    F = components.fade;
  {
    if (currentBeat === 2) {
      drawResetComparison(ctx, state, api);
      return;
    }
    const z =
        currentBeat === 0 ? 0.95 : currentBeat === 1 ? api.lerp(0.95, 0.05, phaseForBeat(1)) : 0.05,
      h = z * 0.8 + (1 - z) * -0.2;
    api.focus.target('gru-interpolation-rule', () =>
      math(
        ctx,
        api,
        String.raw`h_t=z h_{t-1}+(1-z)\tilde h_t`,
        960,
        320,
        60,
        themeColors.ink,
        'center',
      ),
    );
    const q = teaching.axes({
      x: 260,
      y: 520,
      width: 1320,
      height: 180,
      xDomain: [-0.3, 0.9],
      yDomain: [0, 1],
      xTicks: [-0.2, 0.3, 0.8],
      yTicks: [],
      xLabel: 'new hidden coordinate',
      fontSize: 34,
    });
    const left = q.point(-0.2, 0.5),
      right = q.point(0.8, 0.5),
      at = q.point(h, 0.5);
    api.path(ctx, [left, right], {
      color: themeColors.muted,
      width: 5,
    });
    api.focus.target('gru-candidate', () => api.circle(ctx, left.x, left.y, 14, themeColors.pink));
    api.focus.target('gru-previous', () => api.circle(ctx, right.x, right.y, 14, themeColors.blue));
    api.focus.target('gru-result', () => api.circle(ctx, at.x, at.y, 18, themeColors.yellow));
    text(ctx, api, 'candidate', left.x, 450, 36, themeColors.pink, 'center');
    text(ctx, api, 'previous', right.x, 450, 36, themeColors.blue, 'center');
    text(
      ctx,
      api,
      `keep ${z.toFixed(2)}     write ${(1 - z).toFixed(2)}     result ≈ ${h.toFixed(3)}`,
      960,
      850,
      38,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'gru',
  draw: drawGru,
  cues: [
    'gru-interpolation-rule-b1-1',
    'gru-result-b2-1',
    'gru-reset-after',
    'gru-reset-before',
    'gru-reset-difference',
    'gru-interpolation-rule-b3-1',
  ],
};
