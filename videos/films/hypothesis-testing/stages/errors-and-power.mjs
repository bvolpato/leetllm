import { studyFrame } from '../construction.mjs';
import { resultOrOperation } from '../model.mjs';
import { legacyText, mark } from '../defaults.mjs';
export function drawErrorsAndPower(ctx, scene, state, api) {
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
  const pending = pendingTargets['errors-and-power'];
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
    const f = studyFrame(state);
    mark(api, 'decision-cutoff', () =>
      legacyText(
        ctx,
        api,
        `Reject when B wins ≥ ${f.result.critical} of ${f.n}`,
        960,
        325,
        37,
        themeColors.yellow,
        'center',
      ),
    );
    mark(api, 'study-grid', () => {
      for (let i = 0; i < 200; i++)
        api.rect(
          ctx,
          190 + (i % 20) * 52,
          410 + Math.floor(i / 20) * 39,
          37,
          26,
          i < f.count
            ? f.list[i].rejects
              ? f.kind === 'null'
                ? themeColors.pink
                : themeColors.green
              : themeColors.blue
            : themeColors.panel,
          themeColors.muted,
          1,
        );
      legacyText(
        ctx,
        api,
        `${f.count} simulated studies · one tile per study`,
        710,
        865,
        27,
        themeColors.muted,
        'center',
      );
    });
    mark(api, 'study-alternative', () =>
      legacyText(
        ctx,
        api,
        f.kind === 'null' ? 'Equal win chances' : 'B wins 65% of disagreements',
        960,
        960,
        30,
        f.kind === 'null' ? themeColors.blue : themeColors.green,
        'center',
      ),
    );
    const hits = f.list.slice(0, f.count).filter((s) => s.rejects).length;
    mark(api, f.kind === 'null' ? 'size-receipt' : 'power-receipt', () => {
      legacyText(
        ctx,
        api,
        `${hits} / ${f.count} rejected`,
        1490,
        490,
        36,
        themeColors.cyan,
        'center',
      );
      if (f.receipt) {
        legacyText(
          ctx,
          api,
          f.kind === 'null' ? 'Exact null error' : 'Exact power',
          1490,
          625,
          30,
          themeColors.muted,
          'center',
        );
        legacyText(
          ctx,
          api,
          `${(100 * (f.kind === 'null' ? f.result.size : f.result.power)).toFixed(f.kind === 'null' ? 2 : 1)}%`,
          1490,
          700,
          58,
          f.kind === 'null' ? themeColors.pink : themeColors.green,
          'center',
        );
      }
    });
  }
}
export default {
  id: 'errors-and-power',
  draw: drawErrorsAndPower,
  cues: [
    'size-cutoff',
    'size-studies',
    'size-receipt',
    'power-alternative',
    'power-studies',
    'power-receipt',
    'power-grow',
    'power-large',
  ],
};
