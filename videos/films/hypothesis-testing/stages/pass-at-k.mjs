import { candidateSubsets, passingCandidates } from '../fixtures.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { card, legacyEquation, legacyText, mark } from '../defaults.mjs';
export function drawPassAtK(ctx, scene, state, api) {
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
  const pending = pendingTargets['pass-at-k'];
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
  if (currentBeat === 2 && !on('return-one', 2))
    mark(api, 'one-attempt-protocol', () =>
      legacyText(ctx, api, 'Protocol reminder pending', 960, 270, 26, themeColors.muted, 'center'),
    );
  {
    const p = cp('subset-enumerate', 1),
      count = Math.min(120, Math.floor(p < 0.4 ? (p / 0.4) * 3 : 3 + ((p - 0.4) / 0.6) * 117)),
      ids = currentBeat === 0 || !p ? [1, 4, 7] : candidateSubsets[Math.min(119, count)].ids;
    mark(api, 'candidate-pool', () => {
      for (let i = 0; i < 10; i++)
        card(
          ctx,
          api,
          `${i + 1}: ${passingCandidates.includes(i) ? 'pass' : 'fail'}`,
          210 + i * 152,
          310,
          130,
          80,
          passingCandidates.includes(i) ? themeColors.green : themeColors.muted,
          26,
        );
    });
    mark(api, 'candidate-selection', () => {
      ids.forEach((id, i) =>
        card(
          ctx,
          api,
          `${id + 1}: ${on('subset-run', 1) ? (passingCandidates.includes(id) ? 'pass' : 'fail') : '?'}`,
          560 + i * 290,
          475,
          240,
          95,
          on('subset-run', 1) && passingCandidates.includes(id)
            ? themeColors.green
            : themeColors.yellow,
          35,
        ),
      );
      if (currentBeat < 2)
        legacyText(
          ctx,
          api,
          'Three distinct candidates · one subset',
          960,
          650,
          30,
          themeColors.muted,
          'center',
        );
    });
    if (currentBeat >= 1)
      mark(api, 'subset-grid', () => {
        for (let i = 0; i < count; i++)
          api.rect(
            ctx,
            230 + (i % 30) * 49,
            720 + Math.floor(i / 30) * 32,
            35,
            22,
            candidateSubsets[i].passes ? themeColors.green : themeColors.pink,
            undefined,
            0,
          );
        legacyText(
          ctx,
          api,
          `${count} / 120 equally likely subsets`,
          960,
          905,
          30,
          themeColors.cyan,
          'center',
        );
      });
    if (on('subset-count', 1))
      mark(api, 'subset-counts', () =>
        legacyText(
          ctx,
          api,
          '64 with a pass · 56 all failing',
          960,
          985,
          29,
          themeColors.ink,
          'center',
        ),
      );
    if (currentBeat === 2) {
      mark(api, 'pass-three-result', () =>
        legacyEquation(
          ctx,
          api,
          String.raw`\widehat{pass@3}=1-\frac{\binom83}{\binom{10}3}=\frac{64}{120}`,
          960,
          650,
          39,
          themeColors.green,
        ),
      );
      if (on('return-one', 2))
        mark(api, 'one-attempt-protocol', () =>
          legacyText(
            ctx,
            api,
            'Release comparison: one attempt per model',
            960,
            270,
            26,
            themeColors.blue,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'pass-at-k',
  draw: drawPassAtK,
  cues: [
    'pool-show',
    'subset-predict',
    'subset-run',
    'subset-enumerate',
    'subset-count',
    'pass-three',
    'return-one',
  ],
};
