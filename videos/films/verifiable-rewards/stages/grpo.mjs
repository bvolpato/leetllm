import { groupStatistics } from '../arithmetic.mjs';
import { REWARDS } from '../fixtures.mjs';
import { signed, spokenProgress } from '../drawing.mjs';

export function drawGrpo(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const pass = p('grpo-pass', 2, 0.02, 0.05);
  const fail = p('grpo-fail', 2, 0.16, 0.23);
  const rewards = fail > 0 ? [0, 0, 0, 0] : pass > 0 ? [1, 1, 1, 1] : REWARDS;
  const { mean, std, advantages } = groupStatistics(rewards);
  const baseline = p('grpo-mean', 0, 0.2, 0.38);
  const distance = p('grpo-distance', 0, 0.4, 0.53);
  const below = p('grpo-below', 0, 0.62, 0.72);
  const spread = p('grpo-spread', 1, 0.18, 0.42);
  const normalize = p('grpo-normalize', 1, 0.56, 0.72);
  const ready = normalize >= 1;
  const x = (i) => 255 + i * 169;
  const y = (r) => 662 - r * 218;
  const sum = rewards.reduce((a, b) => a + b, 0);
  api.focus.target('reward-scale', () => {
    api.text(ctx, 'Reward for each response', 200, 310, 39, C.ink);
    api.text(ctx, '14 × 12', 200, 372, 32, C.blue);
    api.line(ctx, 210, 664, 936, 664, C.muted, 2);
    rewards.forEach((r, i) => {
      const color = r ? C.green : C.pink;
      if (r) api.rect(ctx, x(i), y(r), 94, 662 - y(r), color, undefined, 4);
      api.text(ctx, String(r), x(i) + 47, y(r) - 15, 32, color, 'center');
      api.text(ctx, 'R' + (i + 1), x(i) + 47, 730, 30, C.ink, 'center');
    });
    if (baseline > 0) {
      const end = 210 + baseline * 726;
      api.line(ctx, 210, y(mean), end, y(mean), C.yellow, 4);
      api.text(ctx, 'Group mean   ' + sum + ' / 4 = ' + mean.toFixed(2), 202, 825, 36, C.yellow);
    }
    if (distance > 0 && std > 0) {
      const xx = x(0) + 118;
      api.line(ctx, xx, y(1), xx, y(1) + distance * (y(mean) - y(1)), C.blue, 5);
      api.line(ctx, xx - 8, y(1), xx + 8, y(1), C.blue, 3);
    }
  });
  api.focus.target('relative-rows', () => {
    api.text(
      ctx,
      normalize > 0 ? 'Group advantage' : 'Distance from the mean',
      1030,
      310,
      39,
      C.ink,
    );
    const origin = 1420;
    api.line(ctx, origin, 386, origin, 726, C.muted, 2);
    rewards.forEach((r, i) => {
      const row = 433 + i * 84;
      api.text(ctx, 'R' + (i + 1), 1070, row + 12, 32, C.ink);
      if (!(i === 0 ? distance > 0 : below > 0)) return;
      const gap = r - mean;
      const v = gap + normalize * (advantages[i] - gap);
      const color = v > 0 ? C.green : v < 0 ? C.pink : C.yellow;
      if (v) api.line(ctx, origin, row, origin + v * 180, row, color, 12);
      api.circle(ctx, origin + v * 180, row, 9, color);
      if (normalize === 0 || ready) api.text(ctx, signed(v), 1725, row + 12, 33, color, 'center');
    });
  });
  api.focus.target('spread-rule', () => {
    if (std === 0) {
      api.text(
        ctx,
        'Guarded group   ·   zero spread   →   four zero advantages',
        960,
        948,
        36,
        C.yellow,
        'center',
      );
    } else if (spread > 0) {
      api.text(ctx, 'Population spread   √[(4 × 0.5²) / 4] = 0.5', 960, 948, 40, C.cyan, 'center');
    }
  });
}

export default {
  id: 'grpo',
  draw: drawGrpo,
  cues: [
    'grpo-mean',
    'grpo-distance',
    'grpo-below',
    'grpo-spread',
    'grpo-normalize',
    'grpo-pass',
    'grpo-fail',
    'grpo-guard',
  ],
};
