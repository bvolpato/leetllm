import { BOOTSTRAP_BIN_EDGES, binomialMasses, bootstrapBins } from '../arithmetic.mjs';
import { developmentBootstrap } from '../fixtures.mjs';
import { resultOrOperation } from '../model.mjs';
import {
  constructionBox,
  constructionCaption,
  constructionEquation,
  constructionHeading,
  constructionLine,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawNullContract(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'null-contract-construction', () => {
    if (currentBeat === 0) {
      constructionHeading(ctx, api, 'How often does B win a disagreement?');
      const plot = api.teaching.axes({
        x: 280,
        y: 440,
        width: 1330,
        height: 290,
        xDomain: [0, 1],
        yDomain: [0, 1],
        xTicks: [0, 0.25, 0.5, 0.75, 1],
        yTicks: [],
        xLabel: 'B win probability among disagreements',
        fontSize: 28,
      });
      const x = plot.point(0.5, 0).x;
      api.rect(ctx, 280, 440, x - 280, 290, themeColors.panel);
      constructionLine(ctx, api, x, 390, x, 760, themeColors.yellow, 4);
      constructionText(ctx, api, 'null: q ≤ 0.5', 560, 580, 43, themeColors.blue, 'center');
      constructionText(ctx, api, 'boundary q = 0.5', x, 350, 34, themeColors.yellow, 'center');
      constructionText(
        ctx,
        api,
        'alternative: q > 0.5',
        1370,
        580,
        36,
        themeColors.green,
        'center',
      );
      constructionText(
        ctx,
        api,
        'Keep the 13 disagreements fixed',
        960,
        930,
        32,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 1) {
      const showBootstrap = on('empirical-draws', 1);
      const masses = binomialMasses(13),
        tail = masses.slice(8).reduce((sum, mass) => sum + mass, 0);
      mark(api, 'fair-draws', () => {
        constructionText(
          ctx,
          api,
          'Probability per win count',
          520,
          409,
          27,
          themeColors.muted,
          'center',
        );
        constructionText(ctx, api, 'Toss 13 fair coins', 520, 355, 31, themeColors.blue, 'center');
        api.teaching.bars({
          x: 200,
          y: 440,
          width: 680,
          height: 300,
          values: masses,
          labels: masses.map((_, i) => (i % 2 ? '' : String(i))),
          colors: masses.map((_, i) => (i >= 8 ? themeColors.yellow : themeColors.blue)),
          max: 0.24,
          fontSize: 22,
          showValues: false,
        });
        constructionText(ctx, api, 'Number of B wins', 540, 845, 30, themeColors.blue, 'center');
        constructionText(
          ctx,
          api,
          `8 or more wins   ·   p = ${tail.toFixed(3)}`,
          540,
          939,
          36,
          themeColors.yellow,
          'center',
        );
      });
      if (!showBootstrap) return;
      mark(api, 'row-draws', () => {
        constructionText(
          ctx,
          api,
          'Fraction of resamples per bin',
          1390,
          409,
          27,
          themeColors.muted,
          'center',
        );
        const bins = bootstrapBins(developmentBootstrap.means).map(
          (n) => n / developmentBootstrap.means.length,
        );
        constructionText(
          ctx,
          api,
          'Resample 40 observed task pairs',
          1390,
          355,
          31,
          themeColors.cyan,
          'center',
        );
        api.teaching.bars({
          x: 1050,
          y: 440,
          width: 680,
          height: 300,
          values: bins,
          labels: bins.map((_, i) =>
            i % 3 ? '' : String(Math.round(BOOTSTRAP_BIN_EDGES[i] * 100)),
          ),
          colors: bins.map((_, i) =>
            BOOTSTRAP_BIN_EDGES[i] < 0 ? themeColors.pink : themeColors.cyan,
          ),
          max: 0.3,
          fontSize: 22,
          showValues: false,
        });
        constructionText(
          ctx,
          api,
          'Lift in percentage points',
          1390,
          845,
          30,
          themeColors.cyan,
          'center',
        );
        constructionText(
          ctx,
          api,
          'Below zero   ·   B lost passes',
          1390,
          939,
          36,
          themeColors.pink,
          'center',
        );
      });
    } else if (currentBeat === 2) {
      const five = on('hyp-null-five', 2),
        empty = on('hyp-null-empty', 2),
        d = empty ? 0 : five ? 5 : 4,
        n = 2 ** d;
      constructionHeading(ctx, api, 'How often does B win every disagreement?');
      if (empty)
        constructionBox(
          ctx,
          api,
          'd = 0 · no disagreement directions',
          960,
          520,
          1300,
          120,
          themeColors.muted,
          39,
        );
      else
        for (let i = 0; i < n; i++) {
          const bits = i.toString(2).padStart(d, '0'),
            s = bits.replaceAll('0', 'A').replaceAll('1', 'B'),
            x = 280 + (i % 8) * 195,
            y = 370 + Math.floor(i / 8) * 105;
          constructionBox(
            ctx,
            api,
            s,
            x,
            y,
            165,
            75,
            i === n - 1 ? themeColors.green : themeColors.blue,
            26,
          );
        }
      constructionEquation(
        ctx,
        api,
        String.raw`p_{min}=2^{-${d}}=1/${n}`,
        960,
        870,
        52,
        themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        on('hyp-null-empty', 2)
          ? 'No disagreements   ·   p = 1'
          : d === 4
            ? '1/16 = 0.0625 > 0.05'
            : '1/32 = 0.03125 < 0.05',
        960,
        965,
        35,
        themeColors.cyan,
        'center',
      );
    } else {
      constructionHeading(ctx, api, 'When does the test make a mistake?');
      const cells = [
        ['true null', 'reject', 'Type I', themeColors.pink],
        ['true null', 'retain', 'no false rejection', themeColors.blue],
        ['specified advantage', 'reject', 'detection', themeColors.green],
        ['specified advantage', 'retain', 'Type II', themeColors.pink],
      ];
      constructionText(ctx, api, 'reject', 860, 360, 32, themeColors.yellow, 'center');
      constructionText(ctx, api, 'do not reject', 1430, 360, 32, themeColors.yellow, 'center');
      constructionText(ctx, api, 'null true', 260, 535, 30, themeColors.muted, 'center');
      constructionText(ctx, api, 'advantage true', 260, 765, 28, themeColors.muted, 'center');
      cells.forEach(([truth, decision, label, c], i) =>
        constructionBox(
          ctx,
          api,
          label,
          860 + (i % 2) * 570,
          530 + Math.floor(i / 2) * 230,
          510,
          130,
          c,
          32,
        ),
      );
      constructionText(
        ctx,
        api,
        'Testing for practical equivalence starts with a tolerance',
        960,
        970,
        29,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'Power depends on the effect, study design and rejection rule.',
      );
    }
  });
}
export default {
  id: 'null-contract',
  draw: drawNullContract,
  cues: [
    'null-contract-0',
    'null-contract-1',
    'empirical-draws',
    'null-contract-2',
    'hyp-null-five',
    'hyp-null-empty',
    'null-contract-3',
  ],
};
