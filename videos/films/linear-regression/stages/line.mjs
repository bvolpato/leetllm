import { clamp } from '../arithmetic.mjs';
import { coefficientFrame, predict } from '../model.mjs';
import { curve, equation, observations, plot, target, text } from '../defaults.mjs';
export function drawLine(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    const f = coefficientFrame(state),
      q = plot(ctx, api);
    curve(ctx, api, q, (x) => predict(x, f.intercept, f.slope));
    observations(ctx, api, q, 5, true);
    const selected = q.point(3, f.prediction),
      observed = q.point(3, 162),
      color = currentBeat === 0 ? themeColors.blue : themeColors.cyan;
    api.path(ctx, [q.point(3, 80), selected], {
      color: themeColors.muted,
      width: 2,
      clip: q.bounds,
    });
    const number = (key, value, x) => {
      const changing = (currentBeat === 0 && key === 'b') || (currentBeat === 1 && key === 'm');
      const from = changing ? (key === 'b' ? 85 : 10) : value,
        to = changing ? (key === 'b' ? 100 : 20) : value;
      api.teaching.changeCue(
        {
          x: x - 90,
          y: 330,
          width: 180,
          height: 90,
          from,
          to,
          progress: changing ? f.progress : 1,
          color,
          restColor: themeColors.ink,
          emphasis: changing ? f.active : 0,
        },
        (v) => equation(ctx, api, v.value.toFixed(1), x, 395, 46, v.color, 'center'),
      );
    };
    text(ctx, api, 'intercept', 1340, 300, 26, themeColors.muted, 'center');
    text(ctx, api, 'slope', 1630, 300, 26, themeColors.muted, 'center');
    equation(ctx, api, '\\hat y=', 1130, 395, 48, themeColors.ink);
    equation(ctx, api, '+', 1475, 395, 48, themeColors.ink);
    equation(ctx, api, 'x', 1750, 395, 48, themeColors.ink);
    target(ctx, api, 'coefficient-change', () => {
      number('b', f.intercept, 1340);
      number('m', f.slope, 1630);
      api.teaching.changeCue(
        {
          x: 1220,
          y: 485,
          width: 550,
          height: 90,
          from: currentBeat === 0 ? 115 : 130,
          to: currentBeat === 0 ? 130 : 160,
          progress: currentBeat < 2 ? f.progress : 1,
          color,
          restColor: themeColors.ink,
          emphasis: f.active,
        },
        (v) =>
          text(ctx, api, `prediction ≈ ${v.value.toFixed(1)} ms`, 1495, 545, 35, v.color, 'center'),
      );
      api.teaching.changeCue(
        {
          x: 1220,
          y: 640,
          width: 550,
          height: 90,
          from: currentBeat === 0 ? 47 : 32,
          to: currentBeat === 0 ? 32 : 2,
          progress: currentBeat < 2 ? f.progress : 1,
          color,
          restColor: themeColors.ink,
          emphasis: f.active,
        },
        (v) =>
          text(
            ctx,
            api,
            `miss ≈ ${v.value >= 0 ? '+' : ''}${v.value.toFixed(1)} ms`,
            1495,
            700,
            35,
            v.color,
            'center',
          ),
      );
      api.circle(
        ctx,
        selected.x,
        selected.y,
        12,
        themeColors.panel,
        f.active ? color : themeColors.ink,
        4,
      );
      api.path(ctx, [selected, observed], {
        color: f.active ? color : themeColors.muted,
        width: f.active ? 8 : 5,
        clip: q.bounds,
      });
    });
    target(ctx, api, 'selected-prediction', () => {
      text(ctx, api, 'request C', 1495, 465, 29, themeColors.cyan, 'center');
      text(ctx, api, 'observed 162 ms', 1495, 610, 31, themeColors.muted, 'center');
    });
    target(ctx, api, 'zero-context-point', () => {
      const zero = q.point(0, f.intercept);
      api.circle(ctx, zero.x, zero.y, 11, currentBeat === 2 ? themeColors.blue : themeColors.muted);
      if (currentBeat === 2) {
        text(ctx, api, 'x = 0 · beyond observed inputs', 960, 975, 30, themeColors.blue, 'center');
      }
    });
    if (currentBeat < 2)
      text(
        ctx,
        api,
        'The input and observation stay fixed.',
        960,
        975,
        32,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'line',
  draw: drawLine,
  cues: ['intercept-update', 'slope-update', 'prediction-read', 'zero-context'],
};
