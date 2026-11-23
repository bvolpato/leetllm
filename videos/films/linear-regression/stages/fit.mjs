import { clamp, meanX, varianceX } from '../arithmetic.mjs';
import { oversizedRate } from '../fixtures.mjs';
import { directed } from '../construction.mjs';
import { fitFrame, oversizedPath, predict, stablePath } from '../model.mjs';
import { curve, equation, observations, target, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawFit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    const adjusted =
      currentBeat === 1
        ? {
            ...state,
            beatP: 0.02 + 0.7 * directed(state, 'gradient-descent', 0.05, 0.8),
          }
        : currentBeat === 2
          ? {
              ...state,
              beatP: 0.08 + 0.7 * directed(state, 'gradient-oversized', 0.08, 0.8),
            }
          : state;
    const f = fitFrame(adjusted),
      challenging = f.mode === 'oversized-rate',
      focus = challenging ? f.challenger : f.current;
    const q = api.teaching.axes({
      x: 220,
      y: 360,
      width: 650,
      height: 430,
      xDomain: [-10, 115],
      yDomain: [-10, 65],
      xTicks: [0, 50, 100],
      yTicks: [0, 20, 40, 60],
      xLabel: 'intercept',
      yLabel: 'slope',
    });
    for (const level of [30, 150, 600, 2200, 10000, 30000]) {
      const dots = sampleFunction((t) => t, 0, Math.PI * 2, 160).map(({ x: t }) => {
        const slope = 20 + Math.sqrt(level / varianceX) * Math.cos(t);
        return {
          x: 100 + Math.sqrt(level) * Math.sin(t) - meanX * (slope - 20),
          y: slope,
        };
      });
      api.teaching.curve({
        plot: q,
        points: dots,
        color: '#8d9cb945',
        width: 2,
      });
    }
    const right = api.teaching.axes({
      x: 1120,
      y: 360,
      width: 600,
      height: 400,
      xDomain: [0, 7],
      yDomain: [-40, 300],
      xTicks: [0, 2, 4, 6],
      yTicks: [0, 100, 200, 300],
      xLabel: 'context (100 tokens)',
      yLabel: 'latency (ms)',
    });
    const path = challenging ? oversizedPath : stablePath,
      idx = focus.index ?? 0;
    const trace = path.slice(0, idx + 1).map((v) => ({
      x: v.intercept,
      y: v.slope,
    }));
    if (focus.fraction > 0)
      trace.push({
        x: focus.intercept,
        y: focus.slope,
      });
    if (trace.length > 1)
      api.teaching.curve({
        plot: q,
        points: trace,
        color: challenging ? themeColors.pink : themeColors.yellow,
        width: 5,
      });
    const at = q.point(focus.intercept, focus.slope);
    target(ctx, api, 'unstable-parameter', () =>
      api.circle(ctx, at.x, at.y, 12, challenging ? themeColors.pink : themeColors.yellow),
    );
    if (currentBeat === 0) {
      const next = q.point(f.next.intercept, f.next.slope);
      const step = directed(state, 'gradient-first', 0.68, 0.92);
      target(ctx, api, 'gradient-first-step', () => {
        const to = step === 1 ? '[' + f.next.intercept + ', ' + f.next.slope + ']' : '?';
        const g = f.gradient;
        text(
          ctx,
          api,
          '[0, 0] − 0.05 × [' + g.intercept + ', ' + g.slope + '] = ' + to,
          960,
          259,
          38,
          themeColors.yellow,
          'center',
        );
        if (step > 0)
          api.arrow(
            ctx,
            at.x,
            at.y,
            api.lerp(at.x, next.x, step),
            api.lerp(at.y, next.y, step),
            themeColors.yellow,
            6,
          );
      });
    }
    target(ctx, api, 'fitting-prediction-line', () =>
      curve(
        ctx,
        api,
        right,
        (x) => predict(x, focus.intercept, focus.slope),
        challenging ? themeColors.pink : themeColors.cyan,
      ),
    );
    observations(ctx, api, right);
    if (challenging) {
      const best = q.point(100, 20);
      api.circle(ctx, best.x, best.y, 12, themeColors.panel, themeColors.green, 3);
      curve(ctx, api, right, (x) => predict(x), themeColors.cyan);
      text(ctx, api, 'Same axes and contours', 545, 295, 27, themeColors.muted, 'center');
      text(ctx, api, `η = ${oversizedRate}`, 1420, 285, 35, themeColors.pink, 'center');
      text(
        ctx,
        api,
        `Large-rate run · MSE ${focus.loss.toFixed(1)}`,
        1540,
        320,
        25,
        themeColors.pink,
        'center',
      );
      const area = {
          left: 1175,
          right: 1685,
          top: 900,
          bottom: 985,
        },
        maxLoss = 2400;
      api.line(ctx, area.left, area.bottom, area.right, area.bottom, themeColors.muted, 2);
      api.line(ctx, area.left, area.top, area.left, area.bottom, themeColors.muted, 2);
      const completed = oversizedPath.slice(0, idx + 1).map((v, i) => ({
        x: area.left + ((area.right - area.left) * i) / 8,
        y: area.bottom - ((area.bottom - area.top) * Math.min(v.loss, maxLoss)) / maxLoss,
      }));
      if (completed.length > 1)
        api.path(ctx, completed, {
          color: themeColors.pink,
          width: 4,
        });
      completed.forEach((z) => api.circle(ctx, z.x, z.y, 5, themeColors.pink));
      text(ctx, api, 'completed update losses', 1420, 865, 26, themeColors.muted, 'center');
      text(ctx, api, '0', 1175, 1020, 22, themeColors.muted, 'center');
      text(ctx, api, '8 steps', 1685, 1020, 22, themeColors.muted, 'center');
    } else {
      text(ctx, api, 'computed parameter path', 545, 295, 28, themeColors.muted, 'center');
      for (const [key, label, x, color] of [
        ['intercept', 'intercept', 400, themeColors.blue],
        ['slope', 'slope', 850, themeColors.cyan],
        ['loss', 'MSE', 1400, themeColors.yellow],
      ]) {
        text(ctx, api, label, x, 890, 27, themeColors.muted, 'center');
        api.teaching.changeCue(
          {
            x: x - 150,
            y: 915,
            width: 300,
            height: 85,
            from: path[idx][key],
            to: focus[key],
            progress: 1,
            color,
            restColor: themeColors.ink,
            emphasis:
              currentBeat === 1 && directed(state, 'gradient-descent', 0.05, 0.8) < 1 ? 1 : 0,
          },
          (v) => text(ctx, api, v.value.toFixed(2), x, 973, 42, v.color, 'center'),
        );
      }
    }
  }
}
export default {
  id: 'fit',
  draw: drawFit,
  cues: ['gradient-first', 'gradient-descent', 'gradient-oversized'],
};
