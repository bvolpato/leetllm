import { cueProgress } from '../construction.mjs';
import { detailText, equation, focusTarget, line, rectangle } from '../defaults.mjs';
export function drawRateGap(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors, teaching: teaching } = api,
    E = (beat, id) => cueProgress(state, id, beat);
  {
    if (currentBeat === 0) {
      const q = E(0, 'gap-noise'),
        rates = [0.84, 0.8],
        se = rates.map((v) => Math.sqrt((v * (1 - v)) / 50)),
        plot = teaching.axes({
          x: 300,
          y: 430,
          width: 1260,
          height: 360,
          xDomain: [0.6, 1],
          yDomain: [0, 1],
          xTicks: [0.6, 0.7, 0.8, 0.9, 1],
          yTicks: [],
          xLabel: 'observed pass fraction',
          yLabel: 'separate 50-case sets',
          fontSize: 26,
        });
      rates.forEach((v, i) => {
        const at = plot.point(v, 0.8 - i * 0.6),
          a = plot.point(v - 2 * se[i] * q, 0.8 - i * 0.6),
          z = plot.point(v + 2 * se[i] * q, 0.8 - i * 0.6);
        line(ctx, api, a.x, a.y, z.x, z.y, i ? themeColors.blue : themeColors.pink, 8);
        api.circle(ctx, at.x, at.y, 10, i ? themeColors.blue : themeColors.pink);
        detailText(
          ctx,
          api,
          i ? 'old 40/50' : 'new 42/50',
          at.x,
          at.y - 35,
          30,
          i ? themeColors.blue : themeColors.pink,
        );
      });
      focusTarget(ctx, api, 'gap-receipt', () =>
        detailText(
          ctx,
          api,
          q > 0.95
            ? 'gap .04; combined SE ≈.077; rough 2SE≈.153'
            : 'Add independent rate variances before taking a square root',
          960,
          970,
          33,
          themeColors.yellow,
        ),
      );
    } else if (currentBeat === 1) {
      const counts = [39, 3, 1, 7];
      const pairs = [[1, 1], [1, 0], [0, 1], [0, 0]];
      const cueIds = ['paired-cases', 'paired-new', 'paired-old', 'paired-fail'];
      const cancel = E(1, 'paired-cancel');
      focusTarget(ctx, api, 'gap-receipt', () => {
        detailText(ctx, api, 'Same 50 cases   ·   upper mark = new model   ·   lower mark = old', 960, 271, 39, themeColors.ink);
        detailText(ctx, api, 'Filled = pass     Outline = fail', 960, 342, 35, themeColors.muted);
        let start = 0;
        for (let group = 0; group < counts.length; group++) {
          const count = counts[group], visible = Math.floor(E(1, cueIds[group]) * count);
          const [newPass, oldPass] = pairs[group];
          for (let k = 0; k < visible; k++) {
            const i = start + k, x = 214 + (i % 10) * 153, y = 396 + Math.floor(i / 10) * 83;
            const matched = newPass === oldPass;
            ctx.save();
            ctx.globalAlpha *= matched ? 1 - 0.76 * cancel : 1;
            [newPass, oldPass].forEach((pass, row) =>
              rectangle(ctx, api, x, y + row * 26, 87, 18, pass ? themeColors.cyan : themeColors.bg, pass ? undefined : themeColors.muted),
            );
            ctx.restore();
            if (!matched && cancel === 1)
              detailText(ctx, api, newPass ? '+1' : '−1', x + 116, y + 34, 27, themeColors.yellow);
          }
          start += count;
        }
        if (E(1, 'paired-fail') === 1)
          detailText(ctx, api, '39 both pass     3 new only     1 old only     7 both fail', 960, 889, 38, themeColors.ink);
        if (cancel === 1)
          detailText(ctx, api, 'Gap   (3 − 1) / 50 = 4%     ·     Disagree on 4 of 50', 960, 1003, 43, themeColors.yellow);
      });
    } else {
      const first = E(2, 'planning-first'),
        q = E(2, 'planning-count'),
        n = Math.round(3200 * first + 9600 * q),
        width = n > 0 ? 2 * Math.sqrt((2 * 0.8 * 0.2) / n) : null;
      detailText(
        ctx,
        api,
        'Rough independent-sample planning near p=.80',
        960,
        300,
        37,
        themeColors.ink,
      );
      const shown = Math.ceil(n / 100);
      for (let i = 0; i < shown; i++)
        rectangle(
          ctx,
          api,
          380 + (i % 32) * 36,
          420 + Math.floor(i / 32) * 65,
          27,
          45 * Math.min(1, (n - i * 100) / 100),
          themeColors.cyan,
        );
      detailText(
        ctx,
        api,
        'Each full tile = 100 cases · the final tile may be partial',
        960,
        730,
        28,
        themeColors.muted,
      );
      focusTarget(ctx, api, 'gap-receipt', () => {
        equation(
          ctx,
          api,
          `2\\sqrt{2(.8)(.2)/n}\\approx${width === null ? '?' : width.toFixed(5)}`,
          960,
          830,
          47,
          themeColors.yellow,
        );
        detailText(
          ctx,
          api,
          n > 0
            ? 'Current n = ' +
                n +
                ' per model' +
                (q === 1 ? ' · half the gap needs 4× cases' : ' · target width 0.02, then 0.01')
            : 'Solve the required cases per model',
          960,
          940,
          32,
          themeColors.yellow,
        );
        detailText(
          ctx,
          api,
          'Detecting a true advantage reliably also requires a power target',
          960,
          1020,
          29,
          themeColors.muted,
        );
      });
    }
  }
  return;
}
export default {
  id: 'rate-gap',
  draw: drawRateGap,
  cues: [
    'gap-noise',
    'paired-cases',
    'paired-new',
    'paired-old',
    'paired-fail',
    'paired-cancel',
    'planning-count',
    'planning-first',
  ],
};
