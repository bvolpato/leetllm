import { num, scale, project } from '../geometry.mjs';
import { text, math, line, arrow, circle, matrix, axes3 } from '../defaults.mjs';
export function drawIntrinsicRank(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const b1 = [1, 0.3, 0.2];
  ctx.save();
  {
    api.focus.target('intrinsic-rank-mechanism', () => {
      const zeroP = api.focus.progress('intrinsic-zero', stage(1, 0.4, 0.6));
      const baP = api.focus.progress('intrinsic-ba', stage(1, 0.6, 0.85));
      const theta =
        beat === 0
          ? api.focus.progress('intrinsic-rank-1', stage(0, 0.05, 0.22))
          : beat === 1
            ? 1 - zeroP
            : 0;
      const useAdapter = beat >= 2 || baP > 0;
      const coefficients = [1, 2, -1],
        factorProgress = beat >= 2 ? 1 : baP;
      const values = useAdapter
        ? b1.map((value) => coefficients.map((c) => factorProgress * value * c))
        : Array.from(
            {
              length: 3,
            },
            (_, i) =>
              Array.from(
                {
                  length: 3,
                },
                (_, j) => (i === j ? theta : 0),
              ),
          );
      const o = axes3(ctx, api),
        colors = [themeColors.blue, themeColors.pink, themeColors.green];
      for (let i = 0; i < 3; i++) {
        const output = values.map((row) => row[i]);
        if (Math.hypot(...output) > 0) arrow(ctx, api, o, project(output), colors[i], 6);
        circle(ctx, api, project(output).x, project(output).y, 7, colors[i]);
      }
      text(ctx, api, 'THREE BASIS INPUTS · SAME TRANSFORMATION', 170, 285, 28, themeColors.muted);
      if (useAdapter) {
        line(ctx, api, project(scale(b1, -1.5)), project(scale(b1, 2.3)), '#ffd75e55', 2);
        text(ctx, api, 'SEPARATE LoRA FAMILY · r = 1', 1170, 300, 29, themeColors.yellow);
        math(ctx, api, 'BA=b\\,[1,2,-1]', 1430, 380, 39, themeColors.yellow, 'center');
        matrix(ctx, api, values, 1300, 450, 78, themeColors.yellow);
        text(ctx, api, 'one output line · rank ≤ 1', 1180, 815, 32, themeColors.yellow);
      } else {
        text(ctx, api, 'ONE OPTIMIZATION COORDINATE', 1170, 300, 29, themeColors.muted);
        math(ctx, api, '\\Delta W=\\theta I_3', 1430, 380, 49, themeColors.ink, 'center');
        matrix(ctx, api, values, 1300, 450, 78, themeColors.blue);
        text(
          ctx,
          api,
          `θ = ${num(theta)} · rank = ${theta === 0 ? 0 : 3}`,
          1170,
          815,
          38,
          themeColors.cyan,
          'left',
          'mono',
        );
      }
      text(
        ctx,
        api,
        'Rank counts independent output directions.',
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
  id: 'intrinsic-rank',
  draw: drawIntrinsicRank,
  cues: [
    'intrinsic-rank-1',
    'intrinsic-rank-2',
    'intrinsic-zero',
    'intrinsic-ba',
    'intrinsic-rank-3',
  ],
};
