import { exactSignPower, mix } from '../arithmetic.mjs';
import { peeking, variantStudies } from '../fixtures.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { legacyEquation, legacyText, mark } from '../defaults.mjs';
export function drawSearch(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    cp = (id, beat, a, z) => cueProgress(state, id, beat, a, z),
    on = (id, beat) => resultOrOperation(state, id, beat);
  const pendingTargets = {
    intro: [1, 'intro-receipt', 'intro-lift', 'Lift pending', 960, 930, 34],
    'paired-design': [
      1,
      'pair-lift',
      'paired-observed-lift',
      'Observed lift pending',
      935,
      895,
      30,
    ],
    'forty-tasks': [1, 'forty-lift', 'forty-lift', 'Net lift pending', 960, 900, 34],
    'p-value': [0, 'tail-result', 'tail-result', 'Tail probability pending', 960, 890, 32],
    search: [0, 'search-risk', 'family-risk', 'Family error calculation pending', 960, 710, 32],
    'useful-lift': [1, 'useful-hold', 'development-receipt', 'Decision pending', 960, 945, 34],
    'pass-at-k': [1, 'subset-count', 'subset-counts', 'Subset totals pending', 960, 985, 29],
    holdout:
      currentBeat === 0
        ? [0, 'holdout-count', 'holdout-counts', 'Group counts pending', 960, 925, 34]
        : currentBeat === 1
          ? [1, 'holdout-lift', 'holdout-lift', 'Lift calculation pending', 960, 830, 34]
          : [2, 'release-receipt', 'release-receipt', 'Decision pending', 960, 1035, 30],
  };
  const pending = pendingTargets['search'];
  if (pending && currentBeat === pending[0] && !on(pending[1], pending[0]))
    mark(api, pending[2], () =>
      legacyText(
        ctx,
        api,
        pending[3],
        pending[4],
        pending[5],
        pending[6],
        themeColors.muted,
        'center',
      ),
    );
  {
    if (currentBeat < 2) {
      const n = Math.max(1, Math.ceil(20 * cp('search-variants', 0))),
        size = exactSignPower(13).size;
      mark(api, 'variant-grid', () => {
        const cutoff = currentBeat === 0 ? 10 : Math.round(mix(10, 12, cp('search-tighten', 1)));
        for (let i = 0; i < n; i++) {
          const study = variantStudies[i],
            x = 245 + i * 72,
            h = (study.wins / 13) * 240;
          api.rect(
            ctx,
            x,
            590 - h,
            45,
            h,
            study.wins >= cutoff ? themeColors.pink : themeColors.blue,
            undefined,
            0,
          );
          legacyText(ctx, api, i + 1, x + 22, 635, 23, themeColors.muted, 'center');
        }
        api.line(
          ctx,
          220,
          590 - (cutoff / 13) * 240,
          1690,
          590 - (cutoff / 13) * 240,
          themeColors.yellow,
          3,
        );
        legacyText(
          ctx,
          api,
          'B wins in each simulated null comparison · 13 disagreements each',
          960,
          300,
          27,
          themeColors.muted,
          'center',
        );
      });
      if (on('search-risk', 0))
        mark(api, 'family-risk', () =>
          legacyEquation(
            ctx,
            api,
            currentBeat === 0
              ? `1-(1-${size.toFixed(5)})^{20}=${(1 - (1 - size) ** 20).toFixed(3)}`
              : cp('search-tighten', 1) === 1
                ? String.raw`P_{family}^{after}\leq20(14/8192)<0.05`
                : `P_{family}^{before}=${(1 - (1 - size) ** 20).toFixed(3)}`,
            960,
            710,
            43,
            themeColors.pink,
          ),
        );
      if (currentBeat === 1) {
        mark(api, 'family-budget', () =>
          legacyEquation(
            ctx,
            api,
            String.raw`\alpha_{each}=0.05/20=0.0025`,
            960,
            790,
            44,
            themeColors.yellow,
          ),
        );
        mark(api, 'search-tail', () => {
          const c = Math.round(mix(10, 12, cp('search-tighten', 1)));
          for (let k = 0; k < 14; k++)
            api.rect(
              ctx,
              340 + k * 90,
              875,
              65,
              45,
              k >= c ? themeColors.yellow : themeColors.panel,
              themeColors.muted,
              1,
            );
          legacyText(
            ctx,
            api,
            cp('search-tighten', 1) === 1
              ? 'Reject at 12 or more B wins'
              : 'Moving cutoff: 10 → 12 B wins',
            960,
            990,
            29,
            themeColors.yellow,
            'center',
          );
        });
      }
    } else {
      const p = cp('peeking-path', 2),
        q = cp('peeking-return', 2, 0.55, 0.9),
        count = Math.max(1, Math.floor(q > 0 ? mix(19, 64, q) : mix(1, 19, p))),
        plot = api.teaching.axes({
          x: 260,
          y: 370,
          width: 1370,
          height: 410,
          xDomain: [1, 64],
          yDomain: [0, 1],
          xTicks: [1, 16, 32, 48, 64],
          yTicks: [0, 0.5, 1],
          xLabel: 'Accumulating disagreements',
          yLabel: 'Nominal p-value',
          fontSize: 27,
        });
      mark(api, 'peek-path', () => {
        api.teaching.curve({
          plot,
          points: peeking.slice(0, count).map((v) => ({
            x: v.n,
            y: v.p,
          })),
          color: themeColors.cyan,
          width: 5,
        });
        const a = plot.point(1, 0.05),
          z = plot.point(64, 0.05);
        api.line(ctx, a.x, a.y, z.x, z.y, themeColors.pink, 3);
        legacyText(
          ctx,
          api,
          `Look ${count}: p = ${peeking[count - 1].p.toFixed(3)}`,
          960,
          920,
          37,
          themeColors.yellow,
          'center',
        );
      });
    }
  }
}
export default {
  id: 'search',
  draw: drawSearch,
  cues: [
    'search-variants',
    'search-risk',
    'search-budget',
    'search-tighten',
    'peeking-path',
    'peeking-return',
  ],
};
