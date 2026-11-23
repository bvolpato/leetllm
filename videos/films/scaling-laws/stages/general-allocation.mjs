import { allocationOptimum } from '../arithmetic.mjs';
import { scalingEvent } from '../construction.mjs';
import { allocation, band, curve, equation, plot, rectangle, text } from '../defaults.mjs';
export function drawGeneralAllocation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-general-allocation-construction', () => {
    band(
      ctx,
      api,
      currentBeat === 4
        ? 'Dense training estimate at a declared ratio of 20 tokens per parameter'
        : currentBeat === 3
          ? 'One million budget units · equal square-root exponents'
          : 'At fixed compute, increasing N reduces D in the same proportion on a log scale',
    );
    if (currentBeat < 2) {
      const n = 10 * (1 + 0.01 * (currentBeat === 0 ? progress : 1)),
        d = 100 / n;
      allocation(ctx, api, n, d, 280, 800, 31, 13, 13, themeColors.cyan);
      text(ctx, api, 'Move 1% toward more parameters', 520, 325, 30, themeColors.ink, 'center');
      const vals = [2 / Math.sqrt(n), 2 / Math.sqrt(d)];
      vals.forEach((v, i) => {
        rectangle(ctx, api, 1040, 430 + i * 165, 520, 70, themeColors.panel, themeColors.muted);
        rectangle(
          ctx,
          api,
          1040,
          430 + i * 165,
          v * 650,
          70,
          [themeColors.blue, themeColors.cyan][i],
        );
        text(
          ctx,
          api,
          (i ? 'Data' : 'Parameter') +
            '    ' +
            (2 / Math.sqrt(10)).toFixed(6) +
            ' → ' +
            v.toFixed(6),
          1300,
          542 + i * 165,
          31,
          [themeColors.blue, themeColors.cyan][i],
          'center',
        );
      });
      result(
        currentBeat === 0
          ? 'D = C / (6N) keeps the budget fixed'
          : 'One-percent step   ·   net loss change +' +
              (vals[0] + vals[1] - 4 / Math.sqrt(10)).toFixed(6) +
              ' nats per token',
      );
      if (currentBeat === 0)
        equation(ctx, api, String.raw`L=E+A/N^{\alpha}+B/D^{\beta}`, 1310, 831, 43);
      if (currentBeat === 1)
        equation(
          ctx,
          api,
          String.raw`\alpha A/N^{\alpha}=\beta B/D^{\beta}\quad(N=D=10)`,
          960,
          905,
          39,
          themeColors.yellow,
        );
    } else if (currentBeat === 2) {
      const pl = plot(
        ctx,
        api,
        270,
        360,
        950,
        430,
        [0, 3],
        [0, 3],
        'log₁₀ compute multiplier',
        'log₁₀ resource multiplier',
      );
      curve(ctx, api, pl, (x) => (0.28 / (0.34 + 0.28)) * x, 0, 3, themeColors.blue, progress);
      curve(ctx, api, pl, (x) => (0.34 / (0.34 + 0.28)) * x, 0, 3, themeColors.cyan, progress);
      text(ctx, api, 'N exponent β/(α+β)', 1460, 450, 31, themeColors.blue, 'center');
      text(ctx, api, 'D exponent α/(α+β)', 1460, 540, 31, themeColors.cyan, 'center');
      if (end)
        equation(
          ctx,
          api,
          String.raw`N_*=(\alpha A/\beta B)^{1/(\alpha+\beta)}(C/6)^{\beta/(\alpha+\beta)}`,
          960,
          920,
          35,
          themeColors.yellow,
        );
    } else if (currentBeat === 3) {
      const t = progress,
        coef = 2 + 6 * t,
        n = allocationOptimum(1e6, 2, coef, 0.5, 0.5).n,
        d = 1e6 / n;
      allocation(ctx, api, n, d, 260, 825, 0.12, 1200, 4200, themeColors.cyan);
      const ratio = d / n;
      text(
        ctx,
        api,
        `A = 2 · B = ${(2 + 6 * t).toFixed(2)} ·  D/N = (B/A)²`,
        1370,
        410,
        28,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        `N ${n.toFixed(0)} · D ${d.toFixed(0)}`,
        1370,
        520,
        37,
        themeColors.ink,
        'center',
      );
      text(ctx, api, `D/N ${ratio.toFixed(2)}`, 1370, 610, 42, themeColors.yellow, 'center');
      result('250 × 4,000 = 1,000,000');
    } else {
      const compute = 1e24,
        ratio = 20;
      equation(ctx, api, String.raw`D=20N\qquad C\approx6N(20N)=120N^2`, 960, 434, 54);
      equation(ctx, api, String.raw`N=\sqrt{10^{24}/120}`, 960, 622, 60, themeColors.blue);
      if (end) {
        const size = Math.sqrt(compute / (6 * ratio));
        text(
          ctx,
          api,
          (size / 1e9).toFixed(1) + 'B parameters',
          575,
          822,
          54,
          themeColors.blue,
          'center',
        );
        text(
          ctx,
          api,
          ((ratio * size) / 1e12).toFixed(2) + 'T training tokens',
          1345,
          822,
          54,
          themeColors.cyan,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'general-allocation',
  draw: drawGeneralAllocation,
  cues: [
    'sl-general-allocation-0',
    'sl-general-allocation-1',
    'sl-general-allocation-2',
    'sl-general-allocation-3',
    'sl-general-allocation-4',
  ],
};
