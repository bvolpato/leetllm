import { surfaceLoss } from '../arithmetic.mjs';
import { spoken } from '../cue.mjs';
import { dot, line, rectangle, text } from '../defaults.mjs';

const predicted = surfaceLoss(10e9, 100e9);
const tolerance = 0.02;
const observations = [2.35, 2.32];

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const X = (value) => 310 + (value - 2.28) * 16600;
  const shown = ['transfer-observations', 'transfer-second'].map(
    (id) => spoken(scene, state, id).phase === 'after',
  );
  const decide = spoken(scene, state, 'transfer-decision').phase === 'after';
  const fmt = (n) => n.toFixed(3);
  api.focus.target('loss-window', () => {
    text(ctx, api, '10B parameters  ×  100B training tokens', 960, 269, 42, C.ink, 'center');
    const lo = predicted - tolerance,
      hi = predicted + tolerance;
    rectangle(ctx, api, X(lo), 385, X(hi) - X(lo), 365, C.cyan + '24', C.cyan);
    text(ctx, api, 'Allowed loss', X(predicted), 352, 38, C.cyan, 'center');
    line(ctx, api, X(predicted), 385, X(predicted), 750, C.cyan, 3);
    for (const [i, obs] of observations.entries()) {
      const y = 500 + i * 165;
      text(ctx, api, 'Run ' + 'AB'[i], 222, y + 11, 34, C.ink, 'right');
      line(ctx, api, 270, y, X(2.36), y, C.muted, 2);
      if (shown[i]) {
        dot(ctx, api, X(obs), y, C.yellow, 11);
        text(ctx, api, fmt(obs), X(obs), y - 27, 38, C.ink, 'center');
      }
      if (decide) {
        const passes = Math.abs(obs - predicted) <= tolerance;
        text(
          ctx,
          api,
          passes ? 'Continue checks' : 'Hold',
          X(obs),
          y + 63,
          32,
          passes ? C.green : C.pink,
          'center',
        );
      }
    }
    for (const v of [lo, predicted, hi])
      text(ctx, api, fmt(v), X(v), 809, 35, v === predicted ? C.cyan : C.muted, 'center');
    text(ctx, api, 'Held-out loss (nats per token)', 960, 880, 36, C.ink, 'center');
  });
  text(
    ctx,
    api,
    decide
      ? 'Throughput and task quality still need their own checks.'
      : 'Two possible mid-scale results for the same forecast',
    960,
    984,
    36,
    C.muted,
    'center',
  );
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['transfer-window', 'transfer-observations', 'transfer-second', 'transfer-decision'],
};
