import { estimatorExpectation, estimatorFactors, passAtK, subsets } from '../arithmetic.mjs';
import { passingCandidates } from '../fixtures.mjs';
import { completedHypothesisResult, cueProgress, resultOrOperation } from '../model.mjs';
import {
  constructionBox,
  constructionCaption,
  constructionEquation,
  constructionHeading,
  constructionText,
  mark,
} from '../defaults.mjs';
const fiveSubsets = subsets(10, 5);
const allFailing = fiveSubsets.filter((ids) =>
  ids.every((id) => !passingCandidates.includes(id)),
).length;

export function drawEstimatorBias(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    cp = (id, beat) => {
      checked(id);
      return cueProgress(state, id, beat);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'estimator-bias-construction', () => {
    if (currentBeat === 0) {
      const all = fiveSubsets,
        q = cp('hyp-estimator-subsets', 0),
        count = Math.floor(q < 0.4 ? (q / 0.4) * 3 : 3 + ((q - 0.4) / 0.6) * (all.length - 3)),
        chosen = all[Math.max(0, count - 1)];
      constructionHeading(ctx, api, 'Permission task   ·   Choose five of the same ten candidates');
      chosen.forEach((id, i) =>
        constructionBox(
          ctx,
          api,
          'C' + (id + 1),
          400 + i * 280,
          390,
          220,
          90,
          passingCandidates.includes(id) ? themeColors.green : themeColors.blue,
          32,
        ),
      );
      for (let i = 0; i < count; i++)
        api.rect(
          ctx,
          240 + (i % 28) * 52,
          520 + Math.floor(i / 28) * 34,
          37,
          24,
          all[i].some((id) => passingCandidates.includes(id))
            ? themeColors.green
            : themeColors.muted,
        );
      constructionText(
        ctx,
        api,
        `${count}/${all.length} distinct subsets`,
        960,
        900,
        34,
        themeColors.cyan,
        'center',
      );
      if (on('hyp-estimator-result', 0))
        constructionEquation(
          ctx,
          api,
          String.raw`1-${allFailing}/${all.length}=7/9\approx${(1 - allFailing / all.length).toFixed(6)}`,
          960,
          980,
          43,
          themeColors.green,
        );
      constructionCaption(
        ctx,
        api,
        'One mark per subset. Green subsets contain a passing candidate.',
      );
    } else if (currentBeat === 1) {
      const total = 10;
      const budget = 5;
      const failures = Array.from({ length: total }, (_, i) => i).filter(
        (i) => !passingCandidates.includes(i),
      );
      // Follow a path on which every selection so far has failed.
      const first = cp('hyp-replacement-first', 1);
      const motion = first + (budget - 2) * cp('hyp-replacement-draws', 1);
      const spent = Math.floor(motion);
      const plugin = completedHypothesisResult(state, 'hyp-replacement-plugin-result', 1);
      const without = completedHypothesisResult(state, 'hyp-replacement-without-result', 1);
      constructionText(ctx, api, 'Assume each draw so far has failed', 210, 300, 40);
      constructionText(ctx, api, 'Passing positions', 1385, 300, 31, themeColors.green);
      for (const [row, label] of ['Put it back', 'Set it aside'].entries()) {
        const y = 483 + row * 271;
        const remaining = row === 0 ? 0 : spent;
        const color = row === 0 ? themeColors.pink : themeColors.cyan;
        constructionText(ctx, api, label, 215, y + 14, 34, color);
        for (let i = 0; i < total; i++) {
          const x = 530 + i * 98;
          const pick = failures.indexOf(i);
          const part = pick < 0 ? 0 : Math.max(0, Math.min(1, motion - pick));
          const shift = row === 0 ? -49 * Math.sin(Math.PI * part) : part * 85;
          const passing = passingCandidates.includes(i);
          api.circle(ctx, x, y, 34, themeColors.panel);
          if (row === 1 && part > 0) api.line(ctx, x, y + 13, x, y + shift, themeColors.muted, 2);
          api.circle(ctx, x, y + shift, 31, passing ? themeColors.green : themeColors.muted);
          constructionText(
            ctx,
            api,
            String(i + 1),
            x,
            y + shift + 10,
            29,
            themeColors.bg,
            'center',
          );
        }
        constructionText(ctx, api, 'Next draw fails', 1640, y - 40, 28, color, 'center');
        constructionText(
          ctx,
          api,
          failures.length - remaining + ' / ' + (total - remaining),
          1640,
          y + 27,
          51,
          color,
          'center',
        );
      }
      const plugInScore = 1 - (failures.length / total) ** budget;
      const subsetScore = passAtK(passingCandidates.length, total, budget);
      if (plugin)
        constructionText(
          ctx,
          api,
          'Plug-in pass@5   ' + plugInScore.toFixed(5),
          540,
          980,
          37,
          themeColors.pink,
          'center',
        );
      if (without)
        constructionText(
          ctx,
          api,
          'Distinct positions   ' + subsetScore.toFixed(5),
          1360,
          980,
          37,
          themeColors.cyan,
          'center',
        );
    } else if (currentBeat === 2) {
      const e = estimatorExpectation(0.2, 10, 5),
        plot = api.teaching.axes({
          x: 280,
          y: 440,
          width: 1100,
          height: 350,
          xDomain: [0, 1],
          yDomain: [0, 1],
          xTicks: [0, 0.2, 0.5, 1],
          yTicks: [0, 0.5, 1],
          xLabel: 'empirical success fraction',
          yLabel: 'g(p) = any of 5',
          fontSize: 25,
        }),
        q = cp('hyp-estimator-jensen', 2);
      constructionHeading(ctx, api, 'Fresh pools of ten   ·   True one-draw success rate 20%');
      api.teaching.curve({
        plot,
        points: Array.from(
          {
            length: 101,
          },
          (_, i) => ({
            x: i / 100,
            y: 1 - (1 - i / 100) ** 5,
          }),
        ),
        color: themeColors.cyan,
        width: 5,
      });
      for (let c = 0; c <= Math.floor(10 * q); c++) {
        const v = plot.point(c / 10, 1 - (1 - c / 10) ** 5);
        api.circle(ctx, v.x, v.y, Math.sqrt(e.mass[c]) * 40, themeColors.pink);
      }
      if (on('hyp-estimator-expectation', 2)) {
        constructionText(
          ctx,
          api,
          'E[plug-in] ' + e.plugin.toFixed(6),
          1590,
          510,
          29,
          themeColors.pink,
          'center',
        );
        constructionText(
          ctx,
          api,
          'true target ' + e.target.toFixed(6),
          1590,
          650,
          29,
          themeColors.green,
          'center',
        );
        constructionText(
          ctx,
          api,
          'E[combinatorial] ' + e.combinatorial.toFixed(6),
          1590,
          790,
          27,
          themeColors.cyan,
          'center',
        );
      }
      constructionCaption(
        ctx,
        api,
        'Circle area follows Binomial(10,0.2) pool probability; curved transform lowers the plug-in expectation.',
      );
    } else {
      const product = on('hyp-estimator-product-start', 3),
        forced = on('hyp-estimator-forced', 3);
      if (!product) {
        const c = forced ? 6 : 0,
          k = 5,
          ids = forced ? [6, 7, 8, 9, 5] : [0, 1, 2, 3, 4],
          fifth = forced ? cp('hyp-estimator-forced', 3) : 1;
        constructionHeading(
          ctx,
          api,
          'Boundary case   ·   10 candidates, ' + c + ' passing, 5 attempts',
        );
        for (let i = 0; i < 10; i++)
          constructionBox(
            ctx,
            api,
            'C' + (i + 1),
            260 + i * 155,
            390,
            120,
            80,
            i < c ? themeColors.green : themeColors.muted,
            28,
          );
        constructionText(
          ctx,
          api,
          'Choose five distinct positions',
          960,
          540,
          32,
          themeColors.cyan,
          'center',
        );
        ids.forEach((id, i) => {
          if (forced && i === 4 && fifth < 0.55) return;
          constructionBox(
            ctx,
            api,
            'C' + (id + 1) + ' · ' + (id < c ? 'pass' : 'fail'),
            400 + i * 280,
            680,
            230,
            100,
            id < c ? themeColors.green : themeColors.muted,
            31,
          );
        });
        constructionText(
          ctx,
          api,
          forced ? 'Four failing positions available' : 'All ten positions fail',
          960,
          865,
          34,
          forced ? themeColors.green : themeColors.pink,
          'center',
        );
        if (!forced || fifth >= 0.55)
          constructionText(
            ctx,
            api,
            'pass@5 = ' + passAtK(c, 10, k),
            960,
            970,
            43,
            forced ? themeColors.green : themeColors.pink,
            'center',
          );
        constructionCaption(ctx, api, 'Each position can enter the selection once.');
      } else {
        const r = estimatorFactors(2, 10, 5),
          q = cp('hyp-estimator-product', 3);
        constructionHeading(ctx, api, 'Return to the permission pool   ·   n = 10, c = 2, k = 5');
        for (const [i, v] of r.factors.entries()) {
          const x = 640 + i * 640;
          constructionBox(ctx, api, 'i = ' + v.i, x, 430, 430, 95, themeColors.blue, 36);
          constructionEquation(
            ctx,
            api,
            String.raw`1-\frac{5}{${v.i}}=${v.value.toFixed(6)}`,
            x,
            620,
            42,
            themeColors.cyan,
          );
        }
        if (q === 1)
          constructionEquation(
            ctx,
            api,
            String.raw`1-(4/9)(1/2)=7/9`,
            960,
            830,
            49,
            themeColors.green,
          );
        constructionText(
          ctx,
          api,
          'Valid inputs     n > 0,     0 ≤ c ≤ n,     1 ≤ k ≤ n',
          960,
          970,
          31,
          themeColors.yellow,
          'center',
        );
        constructionCaption(
          ctx,
          api,
          'Ascending factors run from n−c+1 through n; no huge combination construction is required.',
        );
      }
    }
  });
}
export default {
  id: 'estimator-bias',
  draw: drawEstimatorBias,
  cues: [
    'estimator-bias-0',
    'hyp-estimator-subsets',
    'hyp-estimator-result',
    'estimator-bias-1',
    'hyp-replacement-first',
    'hyp-replacement-draws',
    'hyp-replacement-plugin-result',
    'hyp-replacement-without-result',
    'estimator-bias-2',
    'hyp-estimator-jensen',
    'hyp-estimator-expectation',
    'estimator-bias-3',
    'hyp-estimator-product',
    'hyp-estimator-forced',
    'hyp-estimator-product-start',
  ],
};
