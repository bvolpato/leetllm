import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyText, drawRectangle } from '../defaults.mjs';
export function drawAuditReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('audit-receipt', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'audit-receipt'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'audit-receipt',
      beat = state.beat ?? 0;
    {
      if (beat === 0) {
        const rows = [
          {
            name: 'greedy',
            expected: 1,
            observed: 1,
          },
          {
            name: 'T=2',
            expected: 0.438,
            observed: 0.457,
          },
          {
            name: 'top-p .9',
            expected: 0.622,
            observed: 0.621,
          },
        ];
        drawPolicyText(
          ctx,
          api,
          'Actual local experiment · 2,000 fixed-row next-token draws per policy',
          960,
          300,
          31,
          C.ink,
          'center',
        );
        rows.forEach((r, i) => {
          const y = 430 + i * 145;
          drawPolicyText(ctx, api, r.name, 170, y + 45, 32, colors[i]);
          drawRectangle(ctx, api, 600, y, r.expected * 900, 27, C.muted);
          target(() =>
            drawRectangle(ctx, api, 600, y + 48, r.observed * 900 * progress, 27, colors[i]),
          );
          drawPolicyText(
            ctx,
            api,
            `expected ${r.expected.toFixed(3)} / observed ${r.observed.toFixed(3)}`,
            1760,
            y + 114,
            25,
            colors[i],
            'right',
          );
        });
        drawCaption(
          ctx,
          api,
          'Measured next-token frequencies test a sampler. They do not grade complete answers.',
        );
      } else {
        const rows = [
          {
            name: 'A',
            first: 92,
            full: 70,
            short: 10,
          },
          {
            name: 'B',
            first: 85,
            full: 80,
            short: 5,
          },
        ];
        drawPolicyText(
          ctx,
          api,
          'Supplied complete-answer cohorts · 100 requested answers each',
          960,
          300,
          32,
          C.ink,
          'center',
        );
        rows.forEach((r, i) => {
          const y = 440 + i * 235;
          drawPolicyText(ctx, api, `Cohort ${r.name}`, 170, y + 20, 32, colors[i]);
          drawPolicyText(ctx, api, `first guide-word match ${r.first}%`, 570, y + 20, 30, C.muted);
          target(() => {
            drawRectangle(
              ctx,
              api,
              570,
              y + 70,
              ((1000 * r.full) / 100) * (beat > 1 ? 1 : progress),
              50,
              colors[i],
            );
            drawPolicyText(
              ctx,
              api,
              `${r.full}/100 fully supported`,
              1670,
              y + 107,
              29,
              colors[i],
              'center',
            );
          });
          drawPolicyText(
            ctx,
            api,
            `${r.short} length-limited outputs stay in the requested denominator`,
            570,
            y + 166,
            27,
            C.yellow,
          );
        });
        drawCaption(
          ctx,
          api,
          'First-word agreement falls while complete support rises in these supplied counts. Causality needs an experiment.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'audit-receipt',
  draw: drawAuditReceipt,
  cues: ['audit-receipt-build-0', 'audit-receipt-build-1', 'audit-receipt-build-2'],
};
