import { sigmoid, softplus } from '../arithmetic.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { badge, formula, line } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? state.p);
  const x0 = 280,
    x1 = 1640,
    y = 490,
    map = (v) => x0 + (v / 12) * (x1 - x0);
  badge(api, ctx, 'REWARD SCORES ON ONE NUMBER LINE', 960, 275, api.C.muted, 28);
  line(api, ctx, x0, y, x1, y);
  [0, 2, 4, 6, 8, 10, 12].forEach((v) => {
    line(api, ctx, map(v), y - 10, map(v), y + 10);
    badge(api, ctx, String(v), map(v), y + 55, api.C.muted, 25);
  });
  const factor =
    beat === 2
      ? api.lerp(1, 3, cueProgress(state, 'offset-and-scale-b3-1', motion(state, 0.02, 0.19)))
      : 1;
  const shift =
    beat === 0
      ? 10 * cueProgress(state, 'offset-and-scale-b1-1', motion(state, 0.36, 0.57))
      : beat === 1
        ? 10 * (1 - cueProgress(state, 'offset-recenter', api.phase(progress, 0.66, 0.82)))
        : 0;
  const rejected = 0.7 * factor + shift,
    chosen = 1.8 * factor + shift;
  const revealed =
    beat === 2 ||
    (beat === 1 && cueProgress(state, 'offset-and-scale-b2-1', motion(state, 0, 0.09)) > 0);
  api.circle(ctx, map(rejected), y, 21, api.C.red);
  api.circle(ctx, map(chosen), y, 21, api.C.green);
  api.focus.target('reward-markers', () =>
    badge(api, ctx, `${rejected.toFixed(1)} rejected`, map(rejected), y - 70, api.C.red, 29),
  );
  api.focus.target('reward-markers', () =>
    badge(api, ctx, `${chosen.toFixed(1)} chosen`, map(chosen), y + 122, api.C.green, 29),
  );
  const bracketY = 345;
  line(api, ctx, map(rejected), bracketY, map(chosen), bracketY, api.C.yellow, 4);
  line(api, ctx, map(rejected), bracketY, map(rejected), bracketY + 20, api.C.yellow, 3);
  line(api, ctx, map(chosen), bracketY, map(chosen), bracketY + 20, api.C.yellow, 3);
  api.focus.target('score-gap', () =>
    badge(
      api,
      ctx,
      `margin ${(chosen - rejected).toFixed(2)}`,
      (map(chosen) + map(rejected)) / 2,
      bracketY - 30,
      api.C.yellow,
      28,
    ),
  );
  if (!revealed) {
    badge(api, ctx, 'Chance of choosing A', 960, 733, api.C.ink, 40);
    badge(api, ctx, 'Before adding 10', 690, 830, api.C.muted, 32);
    badge(api, ctx, 'After adding 10', 1230, 830, api.C.muted, 32);
    badge(api, ctx, '75%', 690, 925, api.C.cyan, 64);
    badge(api, ctx, '?', 1230, 925, api.C.yellow, 64);
  } else if (beat < 2) {
    api.focus.target('offset-contract', () =>
      formula(api, ctx, '(r_w+c)-(r_l+c)=r_w-r_l', 960, 788, 52, api.C.ink, 'center'),
    );
    badge(
      api,
      ctx,
      `Probability ${(sigmoid(chosen - rejected) * 100).toFixed(0)}% · loss ${softplus(-(chosen - rejected)).toFixed(4)}`,
      960,
      930,
      api.C.cyan,
      36,
    );
  } else {
    formula(api, ctx, '\\sigma(3\\Delta)\\ne\\sigma(\\Delta)', 960, 770, 54, api.C.ink, 'center');
    api.focus.target('scaled-probability', () =>
      badge(
        api,
        ctx,
        `Preference probability: 75% → ${(sigmoid(chosen - rejected) * 100).toFixed(0)}%`,
        960,
        868,
        api.C.cyan,
        34,
      ),
    );
    badge(
      api,
      ctx,
      'Reward scale also changes its strength against the KL penalty',
      960,
      942,
      api.C.muted,
      28,
    );
  }
}

export function drawOffsetAndScale(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'offset-and-scale',
  draw: drawOffsetAndScale,
  cues: [
    'offset-and-scale-b1-1',
    'offset-and-scale-b2-1',
    'offset-recenter',
    'offset-and-scale-b3-1',
    'offset-and-scale-b3-2',
  ],
};
