import { drawRequest, routingTrial } from '../routing-example.mjs';
import { detailProgress, extraProgress, spokenResult } from '../construction.mjs';
import {
  drawDetailEquation,
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawFooter,
} from '../defaults.mjs';
export function drawPairedEvaluation(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'paired-evaluation', beat);
  const body = () => {
    if (beat === 0) {
      if (!spokenResult(state, 'paired-evaluation-build-0', 0, 0.33, 0.56)) {
        const checked = spokenResult(state, 'check-dock', 0, 0.28, 0.45);
        drawRequest(ctx, api, { replies: 1, parsed: true, checked });
        return;
      }
      drawDetailEquation(
        ctx,
        api,
        '\\mathrm{PPL}=\\exp\\!\\left(-\\frac1N\\sum_i\\log p(t_i\\mid t_{<i})\\right)',
        960,
        475,
        65,
        themeColors.cyan,
      );
      drawDetailText(
        ctx,
        api,
        'Token likelihood on a fixed dataset',
        960,
        615,
        48,
        themeColors.ink,
        'center',
      );
      drawDetailText(
        ctx,
        api,
        'For a parcel, score the destination in the completed call.',
        960,
        820,
        39,
        themeColors.yellow,
        'center',
      );
    } else if (beat === 1) {
      drawDetailText(
        ctx,
        api,
        'Same 100 parcel requests per file   ·   replies grouped by outcome',
        960,
        270,
        38,
        themeColors.ink,
        'center',
      );
      const cohorts = [
        ['Source model', routingTrial.source, 'paired-source'],
        ['Four-bit file A', routingTrial.fileA, 'paired-candidate'],
      ];
      for (const [i, [name, counts, prefix]] of cohorts.entries()) {
        const left = 135 + 885 * i;
        const parse = extraProgress(state, prefix + '-parse', progress);
        const task = extraProgress(state, prefix + '-task', progress);
        const parsed = Math.floor(counts.parsed * parse);
        const correct = Math.min(parsed, Math.floor(counts.correct * task));
        drawDetailText(ctx, api, name, left, 375, 47, i ? themeColors.cyan : themeColors.blue);
        for (let n = 0; n < routingTrial.requests; n++) {
          const color =
            n < correct ? themeColors.green : n < parsed ? themeColors.yellow : themeColors.panel;
          drawDetailRectangle(
            ctx,
            api,
            left + (n % 10) * 32,
            436 + Math.floor(n / 10) * 32,
            27,
            27,
            color,
          );
        }
        const labelX = left + 352;
        if (parse === 1)
          drawDetailText(
            ctx,
            api,
            counts.parsed + ' parse-valid',
            labelX,
            503,
            34,
            themeColors.ink,
          );
        if (task === 1) {
          drawDetailText(
            ctx,
            api,
            counts.correct + ' fully correct',
            labelX,
            590,
            34,
            themeColors.green,
          );
          drawDetailText(
            ctx,
            api,
            counts.parsed - counts.correct + ' parse only',
            labelX,
            660,
            34,
            themeColors.yellow,
          );
        }
        if (parse === 1)
          drawDetailText(
            ctx,
            api,
            routingTrial.requests - counts.parsed + ' fail to parse',
            labelX,
            730,
            31,
            themeColors.muted,
          );
      }
      const compared = extraProgress(state, 'paired-conclusion', progress) === 1;
      const rates = cohorts.map(([, counts]) => (100 * counts.correct) / routingTrial.requests + '%');
      drawDetailText(
        ctx,
        api,
        compared
          ? 'Correct destinations    ' + rates.join(' → ')
          : 'Each square represents one requested reply',
        960,
        885,
        46,
        compared ? themeColors.ink : themeColors.muted,
        'center',
      );
    } else {
      const phases = [
        ['queue', 0.3, themeColors.yellow],
        ['prefill', 0.45, themeColors.blue],
        ['other first-token work', 0.25, themeColors.cyan],
      ];
      let x = 300;
      phases.forEach(([label, share, color]) => {
        drawDetailRectangle(ctx, api, x, 475, 1000 * share, 90, color);
        drawDetailText(ctx, api, label, x + share * 500, 690, 29, color, 'center');
        x += 1000 * share;
      });
      drawDetailText(
        ctx,
        api,
        'schematic request trace · no timing values measured',
        960,
        310,
        33,
        themeColors.muted,
        'center',
      );
      drawDetailLine(ctx, api, 300, 810, 1300, 810, themeColors.pink, 4);
      drawDetailText(ctx, api, 'end-to-end TTFT', 800, 875, 36, themeColors.pink, 'center');
      for (let i = 0; i < 4; i++) {
        const px = 1400 + i * 100;
        api.circle(ctx, px, 520, 12, themeColors.green);
        if (i < 3) drawDetailLine(ctx, api, px + 17, 520, px + 83, 520, themeColors.green, 3);
      }
      drawDetailText(ctx, api, 'delivered gaps', 1550, 690, 29, themeColors.green, 'center');
      drawDetailText(
        ctx,
        api,
        'cold / JIT / warmed service: separate measurements',
        960,
        965,
        31,
        themeColors.ink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Keep failed, truncated and rejected requests in the declared denominator',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'paired-evaluation'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'paired-evaluation',
  draw: drawPairedEvaluation,
  cues: [
    'check-dock',
    'paired-evaluation-build-0',
    'paired-evaluation-build-1',
    'paired-source-parse',
    'paired-source-task',
    'paired-candidate-parse',
    'paired-candidate-task',
    'paired-conclusion',
    'paired-evaluation-build-2',
  ],
};
