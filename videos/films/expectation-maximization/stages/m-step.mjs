import { gammaDensity, posterior } from '../arithmetic.mjs';
import { initialModel, observations } from '../fixtures.mjs';
import { constructedFrame } from '../construction.mjs';
import { firstResponsibilities, firstUpdate } from '../model.mjs';
import { axes, equation, text, visualFocus } from '../defaults.mjs';

const nextRows = posterior(observations, firstUpdate);

function requestPieces(ctx, api, index, y, width, row) {
  const x = 185 + index * 265;
  api.rect(ctx, x, y, width * row[0], 50, api.C.blue, undefined, 0);
  api.rect(ctx, x + width * row[0], y, width * row[1], 50, api.C.pink, undefined, 0);
}

function drawWeightedMeans(ctx, state, api) {
  const f = constructedFrame(state);
  const { C } = api;
  const added = f.progress('m-step-first-request', 0) +
    (observations.length - 1) * f.progress('m-step-rest', 0);
  const current = Math.max(0, Math.ceil(added) - 1);
  const complete = added === observations.length;
  api.focus.target('m-step-simulation-23', () => {
    text(ctx, api, 'Frozen shares from the E-step', 185, 269, 35);
    observations.forEach((value, i) => {
      const x = 185 + i * 265;
      text(ctx, api, value + ' ms', x + 106, 360, 34, C.ink, 'center');
      requestPieces(ctx, api, i, 392, 212, firstResponsibilities[i]);
      if (!complete && i === current) api.line(ctx, x, 463, x + 212, 463, C.yellow, 4);
    });
  });
  api.focus.target('m-step-products', () => {
    text(ctx, api, 'Accumulated weighted latency', 185, 568, 34);
    text(ctx, api, 'Effective count', 1350, 568, 29, C.muted, 'center');
    text(ctx, api, complete ? 'New mean' : 'Mean so far', 1660, 568, 29, C.muted, 'center');
    for (const k of [0, 1]) {
      const y = 663 + k * 166;
      const color = k === 0 ? C.blue : C.pink;
      text(ctx, api, k === 0 ? 'Fast' : 'Slow', 185, y + 36, 35, color);
      let sum = 0;
      let count = 0;
      observations.forEach((value, i) => {
        const share = firstResponsibilities[i][k];
        const amount = share * Math.max(0, Math.min(1, added - i));
        const width = 3.45 * value * amount;
        if (width > 0) {
          const start = 310 + 3.45 * sum;
          api.rect(ctx, start, y, width, 47, color, undefined, 0);
          if (i > 0) api.line(ctx, start, y, start, y + 47, C.panel, 2);
        }
        sum += value * amount;
        count += amount;
      });
      text(ctx, api, count.toFixed(3), 1350, y + 37, 35, color, 'center');
      text(ctx, api, count > 0 ? (sum / count).toFixed(2) + ' ms' : '–', 1660, y + 37, 35, color, 'center');
      const product = firstResponsibilities[current][k] * observations[current];
      const detail = complete ? sum.toFixed(2) + ' ms in total' :
        firstResponsibilities[current][k].toFixed(3) + ' × ' + observations[current] +
          ' ≈ ' + product.toFixed(1) + ' ms';
      text(ctx, api, detail, 310, y + 93, 28, color);
    }
    text(ctx, api, 'Mean = accumulated weighted latency / effective count',
      960, 1000, 34, C.ink, 'center');
  });
}

function drawNextShares(ctx, state, api) {
  const f = constructedFrame(state);
  const update = f.progress('m-step-beat-3-focus-2', 2);
  const { C } = api;
  api.focus.target('m-step-node-shares', () => {
    text(ctx, api, 'Before the M-step', 185, 285, 35);
    observations.forEach((value, i) => {
      text(ctx, api, value + ' ms', 291 + i * 265, 401, 35, C.ink, 'center');
      requestPieces(ctx, api, i, 444, 212, firstResponsibilities[i]);
    });
  });
  api.focus.target('m-step-node-weighted', () => {
    text(ctx, api, 'Next E-step with the refitted curves', 185, 630, 35);
    if (update > 0) {
      observations.forEach((value, i) => {
        if (i >= Math.ceil(update * observations.length)) return;
        requestPieces(ctx, api, i, 692, 212, nextRows[i]);
        text(ctx, api, 'Fast ' + (nextRows[i][0] * 100).toFixed(1) + '%',
          291 + i * 265, 811, 30, C.blue, 'center');
      });
    }
    text(ctx, api, 'Updated means   ' + firstUpdate.means.map(v => v.toFixed(2) + ' ms').join('   and   '),
      960, 947, 34, C.ink, 'center');
  });
}

export function drawMStep(ctx, scene, state, api) {
  if (state.beat === 2) return drawNextShares(ctx, state, api);
  if (state.beat !== 1) return drawWeightedMeans(ctx, state, api);
  const { C: themeColors } = api;
  const componentColors = [themeColors.blue, themeColors.pink];
  const clock = constructedFrame(state);
  text(
    ctx,
    api,
    'THE SAME FROZEN SHARES REFIT EACH GAUSSIAN',
    960,
    245,
    29,
    themeColors.cyan,
    'center',
  );
  const plot = axes(
    ctx,
    api,
    160,
    365,
    980,
    380,
    [0, 120],
    [0, 0.016],
    'request latency (ms)',
    'density / ms',
    [0, 30, 60, 90, 120],
    [0, 0.005, 0.01, 0.015],
  );
  const progress = clock.progress('m-step-refit', 1);
  const points = Array.from(
    {
      length: 241,
    },
    (_, i) => i * 0.5,
  );
  for (let k = 0; k < 2; k++) {
    const tone = componentColors[k];
    const oldCurve = points.map((x) => ({
      x,
      y:
        initialModel.weights[k] *
        gammaDensity(x, initialModel.means[k], initialModel.variances[k]),
    }));
    const mean = api.lerp(initialModel.means[k], firstUpdate.means[k], progress);
    const variance = api.lerp(initialModel.variances[k], firstUpdate.variances[k], progress);
    const weight = api.lerp(initialModel.weights[k], firstUpdate.weights[k], progress);
    const updatedCurve = points.map((x) => ({
      x,
      y: weight * gammaDensity(x, mean, variance),
    }));
    api.teaching.curve({
      plot,
      points: oldCurve,
      color: themeColors.muted,
      width: 3,
      progress: 1,
    });
    api.teaching.curve({
      plot,
      points: updatedCurve,
      color: tone,
      width: 6,
      progress: 1,
    });
    const oldMark = plot.point(initialModel.means[k], 0),
      newMark = plot.point(mean, 0);
    api.line(ctx, oldMark.x, oldMark.y - 23, oldMark.x, oldMark.y + 9, themeColors.muted, 4);
    api.line(ctx, newMark.x, newMark.y - 34, newMark.x, newMark.y + 12, themeColors.yellow, 5);
  }
  observations.forEach((value) => {
    const point = plot.point(value, 0);
    api.line(ctx, point.x, point.y, point.x, point.y - 14, themeColors.ink, 3);
  });
  text(ctx, api, 'Initial parameters', 1450, 345, 30, themeColors.muted, 'center');
  text(ctx, api, 'Updated parameters', 1450, 388, 30, themeColors.yellow, 'center');
  visualFocus(ctx, api, 'm-step-simulation-42', () => {
    for (let k = 0; k < 2; k++) {
      const tone = componentColors[k],
        label = k === 0 ? 'FAST COMPONENT' : 'SLOW COMPONENT';
      const x = 1180,
        y = 435 + k * 205;
      api.components.card({
        label: '',
        x,
        y,
        width: 635,
        height: 182,
        fill: themeColors.panel,
        stroke: tone,
        textColor: themeColors.ink,
        padding: 12,
      });
      text(ctx, api, label, x + 20, y + 37, 29, tone);
      text(
        ctx,
        api,
        `OLD  μ = ${initialModel.means[k].toFixed(2)} ms`,
        x + 20,
        y + 78,
        28,
        themeColors.muted,
      );
      text(
        ctx,
        api,
        `Current  μ = ${api.lerp(initialModel.means[k], firstUpdate.means[k], progress).toFixed(2)} ms`,
        x + 20,
        y + 119,
        28,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        `π = ${api.lerp(initialModel.weights[k], firstUpdate.weights[k], progress).toFixed(3)}   ·   σ² = ${api.lerp(initialModel.variances[k], firstUpdate.variances[k], progress).toFixed(1)} ms²`,
        x + 20,
        y + 162,
        28,
        themeColors.ink,
      );
    }
  });
  equation(ctx, api, String.raw`\pi_k=\frac{N_k}{6}`, 500, 892, 36, themeColors.cyan, 'center');
  equation(
    ctx,
    api,
    String.raw`\sigma_k^2=\frac{\sum_i\gamma_{ik}(x_i-\mu_k)^2}{N_k}`,
    1320,
    892,
    36,
    themeColors.pink,
    'center',
  );
}
export default {
  id: 'm-step',
  draw: drawMStep,
  cues: [
    'm-step-beat-1-focus-1',
    'm-step-first-request',
    'm-step-rest',
    'm-step-beat-2-focus-1',
    'm-step-refit',
    'm-step-beat-3-focus-1',
    'm-step-beat-3-focus-2',
  ],
};
