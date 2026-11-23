import { taskRows } from '../fixtures.mjs';
import { assignmentFrame } from '../construction.mjs';
import { resultOrOperation } from '../model.mjs';
import { legacyEquation, legacyText, mark, token } from '../defaults.mjs';
export function drawFortyTasks(ctx, scene, state, api) {
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
  const pending = pendingTargets['forty-tasks'];
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
    const f = assignmentFrame(state),
      ranks = [0, 0, 0];
    mark(api, 'forty-rows', () =>
      taskRows.slice(0, f.count).forEach((r, i) => {
        const g = r.difference === 0 ? 0 : r.difference > 0 ? 1 : 2,
          k = ranks[g]++,
          dx = 190 + g * 560 + (k % 3) * 155,
          dy = 400 + Math.floor(k / 3) * 48;
        token(ctx, api, r, dx, dy, 132, 40);
      }),
    );
    mark(api, 'forty-groups', () =>
      ['27 agreements', '8 B-only passes', '5 A-only passes'].forEach((s, i) =>
        legacyText(
          ctx,
          api,
          f.sort === 1 ? s : ['Agreements', 'B-only passes', 'A-only passes'][i],
          415 + i * 560,
          325,
          31,
          [themeColors.muted, themeColors.green, themeColors.pink][i],
          'center',
        ),
      ),
    );
    if (f.receipt)
      mark(api, 'forty-lift', () =>
        legacyEquation(
          ctx,
          api,
          String.raw`\hat\Delta=\frac{8-5}{40}=0.075`,
          960,
          900,
          51,
          themeColors.yellow,
        ),
      );
    if (on('direction-plan', 1))
      mark(api, 'direction-plan', () =>
        legacyText(
          ctx,
          api,
          'Planned question: does B improve the pass rate?',
          960,
          990,
          29,
          themeColors.cyan,
          'center',
        ),
      );
  }
}
export default {
  id: 'forty-tasks',
  draw: drawFortyTasks,
  cues: ['forty-arrive', 'forty-sort', 'forty-lift', 'direction-plan'],
};
