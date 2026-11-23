import { BOOTSTRAP_BIN_EDGES, bootstrapBins } from '../arithmetic.mjs';
import { developmentBootstrap, taskRows } from '../fixtures.mjs';
import { bootstrapFrame, trimmedBootstrapBins } from '../construction.mjs';
import { resultOrOperation } from '../model.mjs';
import { card, legacyText, mark, token } from '../defaults.mjs';
export function drawPairedUncertainty(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
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
  const pending = pendingTargets['paired-uncertainty'];
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
    const f = bootstrapFrame(state);
    if (currentBeat === 0) {
      const r = taskRows[developmentBootstrap.first[Math.min(39, f.count)]],
        repeats = f.indices.filter((i) => taskRows[i].id === 'T02').length;
      mark(api, 'bootstrap-draw', () => {
        legacyText(ctx, api, 'Observed task rows', 410, 310, 30, themeColors.blue, 'center');
        legacyText(ctx, api, 'Resample: whole pairs', 1330, 310, 30, themeColors.cyan, 'center');
        taskRows.forEach((r, i) =>
          token(ctx, api, r, 180 + (i % 5) * 100, 360 + Math.floor(i / 5) * 49, 84, 37),
        );
        f.indices.forEach((j, i) =>
          token(ctx, api, taskRows[j], 1000 + (i % 5) * 145, 360 + Math.floor(i / 5) * 49, 125, 37),
        );
        card(
          ctx,
          api,
          `${r.id}: A ${r.a ? 'pass' : 'fail'} · B ${r.b ? 'pass' : 'fail'}`,
          200 + 920 * f.copyProgress,
          815,
          650,
          85,
          themeColors.yellow,
          32,
        );
      });
      mark(api, 'bootstrap-repeat', () =>
        legacyText(
          ctx,
          api,
          `Permission row appears ${repeats} time${repeats === 1 ? '' : 's'} in this draw`,
          960,
          980,
          28,
          themeColors.muted,
          'center',
        ),
      );
    } else {
      const bins = bootstrapBins(developmentBootstrap.means.slice(0, f.draws));
      mark(api, 'bootstrap-histogram', () => {
        api.teaching.bars({
          x: 200,
          y: 390,
          width: 1490,
          height: 355,
          values: bins,
          labels: bins.map((_, i) => `${Math.round(BOOTSTRAP_BIN_EDGES[i] * 100)}`),
          colors: bins.map((_, i) =>
            BOOTSTRAP_BIN_EDGES[i] < 0 ? themeColors.pink : themeColors.blue,
          ),
          max: 2300,
          fontSize: 23,
          showValues: false,
        });
        legacyText(
          ctx,
          api,
          `${f.draws.toLocaleString('en-US')} paired resamples`,
          960,
          320,
          33,
          themeColors.cyan,
          'center',
        );
        legacyText(
          ctx,
          api,
          'Resampled mean lift · lower bin edge (percentage points)',
          960,
          815,
          28,
          themeColors.muted,
          'center',
        );
      });
      mark(api, 'bootstrap-mean', () =>
        legacyText(
          ctx,
          api,
          `First resample: ${(100 * developmentBootstrap.means[0]).toFixed(1)} percentage points`,
          960,
          905,
          32,
          themeColors.green,
          'center',
        ),
      );
      if (currentBeat === 2) {
        mark(api, 'bootstrap-interval', () => {
          const central = trimmedBootstrapBins(f.intervalProgress);
          const width = (1490 - 20 * (bins.length - 1)) / bins.length;
          bins.forEach((count, i) => {
            const excluded = count - central[i];
            if (excluded > 0)
              api.rect(
                ctx,
                200 + i * (width + 20),
                745 - (count / 2300) * 355,
                width,
                (excluded / 2300) * 355,
                themeColors.muted,
                undefined,
                0,
              );
          });
          legacyText(
            ctx,
            api,
            `Trim ${Math.floor(200 * f.intervalProgress)} means from each end`,
            960,
            980,
            29,
            themeColors.yellow,
            'center',
          );
          if (f.intervalProgress === 1)
            legacyText(
              ctx,
              api,
              '95% percentile interval: −10 to +25 percentage points',
              960,
              870,
              32,
              themeColors.yellow,
              'center',
            );
        });
        mark(api, 'bootstrap-zero', () => {
          if (f.zero) {
            const zeroIndex = BOOTSTRAP_BIN_EDGES.indexOf(0);
            const x = 200 + zeroIndex * ((1490 - 20 * (bins.length - 1)) / bins.length + 20) - 10;
            api.line(ctx, x, 355, x, 745, themeColors.yellow, 3);
          } else
            legacyText(
              ctx,
              api,
              'Observed mean +7.5 percentage points',
              960,
              280,
              25,
              themeColors.muted,
              'center',
            );
        });
      }
    }
  }
}
export default {
  id: 'paired-uncertainty',
  draw: drawPairedUncertainty,
  cues: [
    'bootstrap-draw',
    'bootstrap-repeat',
    'bootstrap-mean',
    'bootstrap-many',
    'bootstrap-interval',
    'bootstrap-zero',
  ],
};
