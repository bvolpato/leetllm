import { text, math, rect, line, arrow, circle } from '../defaults.mjs';
export function drawRankScaling(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  ctx.save();
  {
    api.focus.target('rank-scaling-mechanism', () => {
      const configs = [
        {
          r: 8,
          alpha: 16,
        },
        {
          r: 32,
          alpha: 16,
        },
        {
          r: 32,
          alpha: 64,
        },
      ];
      const keys =
        beat === 0
          ? ['scale-ordinary-two', 'scale-ordinary-half', 'scale-ordinary-repair']
          : ['scale-rs-first', 'scale-rs-second', 'scale-rs-third'];
      const rs = beat > 0;
      const progress = keys.map((id, i) =>
        api.focus.progress(id, stage(rs ? 1 : 0, 0.15 + i * 0.23, 0.35 + i * 0.23)),
      );
      const multipliers = configs.map((c) => c.alpha / (rs ? Math.sqrt(c.r) : c.r));
      const zero = beat === 2;
      const plot = api.teaching.axes({
        x: 190,
        y: 360,
        width: 700,
        height: 560,
        xDomain: [0, 6],
        yDomain: [0, 3],
        xTicks: [0, 2, 4, 6],
        yTicks: [0, 1, 2, 3],
        equalUnits: true,
        fontSize: 25,
      });
      const origin = plot.point(0, 0);
      text(
        ctx,
        api,
        zero ? 'ZERO B · EVERY INITIAL CORRECTION IS ZERO' : 'FIXED FACTOR OUTPUT v = [0.5, 0.25]',
        190,
        285,
        28,
        themeColors.muted,
      );
      line(ctx, api, origin, plot.point(6, 3), '#ffd75e55', 2);
      for (const [i, c] of configs.entries()) {
        const y = 415 + i * 160,
          multiplier = multipliers[i];
        text(
          ctx,
          api,
          `r = ${c.r}   α = ${c.alpha}`,
          1040,
          y,
          33,
          themeColors.cyan,
          'left',
          'mono',
        );
        rect(ctx, api, 1040, y + 30, 520, 35, themeColors.panel);
        if (progress[i] > 0 && !zero) {
          rect(ctx, api, 1040, y + 30, multiplier * 42 * progress[i], 35, themeColors.yellow);
          const end = plot.point(0.5 * multiplier * progress[i], 0.25 * multiplier * progress[i]);
          arrow(ctx, api, origin, end, themeColors.yellow, 3 + i);
        }
        text(
          ctx,
          api,
          zero ? 'Δh = 0' : progress[i] >= 0.999 ? `s = ${Number(multiplier.toFixed(3))}` : 's = ?',
          1610,
          y + 59,
          31,
          zero ? themeColors.green : themeColors.yellow,
          'left',
          'mono',
        );
      }
      if (zero) circle(ctx, api, origin.x, origin.y, 10, themeColors.green);
      math(
        ctx,
        api,
        rs ? 's=\\alpha/\\sqrt{r}' : 's=\\alpha/r',
        1380,
        320,
        44,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        zero
          ? 'Later ||sBA|| depends on learned factors and optimization.'
          : 'The arrows scale the same factor output.',
        960,
        975,
        31,
        themeColors.muted,
        'center',
      );
    });
  }
  ctx.restore();
}
export default {
  id: 'rank-scaling',
  draw: drawRankScaling,
  cues: [
    'rank-scaling-1',
    'scale-ordinary-two',
    'scale-ordinary-half',
    'scale-ordinary-repair',
    'rank-scaling-2',
    'scale-rs-first',
    'scale-rs-second',
    'scale-rs-third',
    'rank-scaling-3',
  ],
};
