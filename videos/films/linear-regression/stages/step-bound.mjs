import { data } from '../fixtures.mjs';
import { directed, finished } from '../construction.mjs';
import { eigenStep, predict } from '../model.mjs';
import { target, text } from '../defaults.mjs';

const [steep, shallow] = eigenStep(0.05);
const condition = steep.value / shallow.value;
const ratio = Math.sqrt(condition);

function curvature(ctx, api) {
  const { C } = api;
  const cx = 640,
    cy = 590,
    long = 410,
    short = long / ratio;
  text(ctx, api, 'One equal-loss contour', cx, 320, 39, C.ink, 'center');
  const points = Array.from({ length: 129 }, (_, i) => {
    const angle = (i * Math.PI) / 64;
    return { x: cx + long * Math.cos(angle), y: cy + short * Math.sin(angle) };
  });
  api.path(ctx, points, { color: C.muted, width: 4 });
  api.line(ctx, cx, cy, cx + long, cy, C.cyan, 6);
  api.line(ctx, cx, cy, cx, cy - short, C.pink, 7);
  api.circle(ctx, cx, cy, 8, C.ink);
  text(ctx, api, 'shallow', cx + long / 2, cy + 100, 34, C.cyan, 'center');
  text(ctx, api, 'steep', cx, cy - short - 32, 34, C.pink, 'center');
  text(ctx, api, 'MSE Hessian  =  2 XᵀX / 5', 1475, 360, 33, C.ink, 'center');
  text(ctx, api, 'H  =  [[2, 6], [6, 22]]', 1475, 445, 37, C.ink, 'center');
  text(ctx, api, 'Steep curvature     ' + steep.value.toFixed(2), 1475, 600, 36, C.pink, 'center');
  text(
    ctx,
    api,
    'Shallow curvature     ' + shallow.value.toFixed(2),
    1475,
    696,
    36,
    C.cyan,
    'center',
  );
  text(
    ctx,
    api,
    'Curvature ratio ≈ ' +
      Math.round(condition) +
      '       Long / short radius ≈ ' +
      ratio.toFixed(2),
    960,
    949,
    41,
    C.ink,
    'center',
  );
}

function updates(ctx, state, api) {
  const { C } = api;
  const at = (x) => 595 + (x + 4) * 198;
  text(ctx, api, 'Error after one update from +1', 960, 265, 41, C.ink, 'center');
  api.rect(ctx, at(-1), 353, at(1) - at(-1), 486, '#8fe08a26', null, 0);
  for (const tick of [-4, -3, -2, -1, 0, 1]) {
    const x = at(tick);
    const color = tick === 0 ? C.green : Math.abs(tick) === 1 ? C.muted : '#8896a63d';
    api.line(ctx, x, 353, x, 839, color, tick === 0 ? 4 : 2);
    text(ctx, api, String(tick).replace('-', '−'), x, 331, 30, C.muted, 'center');
  }
  text(ctx, api, 'Multiplier', 1720, 332, 33, C.muted, 'center');
  const safe = directed(state, 'safe-step', 0.12, 0.38);
  const large = directed(state, 'large-step', 0.58, 0.84);
  for (const [run, rate, progress, cue] of [
    [0, 0.05, safe, 'safe-directions'],
    [1, 0.2, large, 'large-directions'],
  ]) {
    const directions = eigenStep(rate);
    const baseY = 447 + 248 * run;
    text(ctx, api, 'η = ' + rate.toFixed(2), 200, baseY + 52, 44, C.ink, 'center');
    target(ctx, api, cue, () => {
      directions.forEach((d, i) => {
        const y = baseY + i * 95,
          color = i ? C.cyan : C.pink;
        text(ctx, api, i ? 'shallow' : 'steep', 438, y + 12, 32, color, 'center');
        const x = at(api.lerp(1, d.multiplier, progress));
        api.line(ctx, at(1), y, x, y, color, 5);
        api.circle(ctx, at(1), y, 10, C.bg, C.muted, 2);
        api.circle(ctx, x, y, 12, color);
        text(
          ctx,
          api,
          progress === 1 ? d.multiplier.toFixed(3).replace('-', '−') : '1 − ηλ',
          1720,
          y + 13,
          34,
          color,
          'center',
        );
      });
    });
  }
  text(ctx, api, 'Closer to zero', at(0), 901, 34, C.green, 'center');
  target(ctx, api, 'rate-bound', () => {
    const label = finished(state, 'rate-limit', 0.96)
      ? 'Both errors shrink for  0 < η < 2 / λmax ≈ ' + (2 / steep.value).toFixed(4)
      : 'Step multiplier = 1 − rate × curvature';
    text(ctx, api, label, 960, 1004, 38, C.ink, 'center');
  });
}

function duplicates(ctx, state, api) {
  const { C } = api;
  const delta = Math.round(80 * directed(state, 'null-direction', 0.38, 0.74)) / 10;
  const firstWeight = +(20 - 2 * delta).toFixed(1);
  text(ctx, api, 'Duplicate features', 960, 293, 37, C.muted, 'center');
  target(ctx, api, 'flat-weights', () => {
    text(
      ctx,
      api,
      '100  +  ' + firstWeight + ' × x  +  ' + delta + ' × (2x)',
      960,
      462,
      63,
      C.ink,
      'center',
    );
  });
  text(ctx, api, 'Fitted latency (ms)', 960, 655, 36, C.muted, 'center');
  data.forEach((row, i) =>
    text(ctx, api, String(predict(row.x)), 356 + i * 300, 779, 58, C.cyan, 'center'),
  );
  text(ctx, api, 'Effective slope = 20 ms per 100 tokens', 960, 965, 40, C.cyan, 'center');
}

export function drawStepBound(ctx, scene, state, api) {
  if (!state.beat) return curvature(ctx, api);
  if (state.beat === 1) return updates(ctx, state, api);
  return duplicates(ctx, state, api);
}

export default {
  id: 'step-bound',
  draw: drawStepBound,
  cues: ['safe-step', 'large-step', 'rate-limit', 'null-direction'],
};
