import { cueProgress, resultOrOperation } from './model.mjs';
import { mark, text } from './defaults.mjs';
const HYPOTHESIS_CONSTRUCTIONS = new Set([
  'protocol-identity',
  'null-contract',
  'variance-construction',
  'interval-contract',
  'passk-target',
  'estimator-bias',
  'macro-construction',
  'protocol-repair',
  'report-contract',
]);
export function drawUnrecognizedScene(ctx, scene, state, api) {
  HYPOTHESIS_CONSTRUCTIONS.has(scene.id);
  const C = api.C,
    b = state.beat ?? 0,
    cp = (id, beat, a, z) => cueProgress(state, id, beat, a, z),
    on = (id, beat) => resultOrOperation(state, id, beat);
  const T = (s, x, y, size = 32, color = C.ink, align = 'left') =>
      text(ctx, api, s, x, y, size, color, align),
    M = (s, x, y, size = 45, color = C.ink) => api.math(ctx, s, x, y, size, color, 'center');
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
      b === 0
        ? [0, 'holdout-count', 'holdout-counts', 'Group counts pending', 960, 925, 34]
        : b === 1
          ? [1, 'holdout-lift', 'holdout-lift', 'Lift calculation pending', 960, 830, 34]
          : [2, 'release-receipt', 'release-receipt', 'Decision pending', 960, 1035, 30],
  };
  const pending = pendingTargets[scene.id];
  if (pending && b === pending[0] && !on(pending[1], pending[0]))
    mark(api, pending[2], () =>
      T(pending[3], pending[4], pending[5], pending[6], C.muted, 'center'),
    );
  if (scene.id === 'pass-at-k' && b === 2 && !on('return-one', 2))
    mark(api, 'one-attempt-protocol', () =>
      T('Protocol reminder pending', 960, 270, 26, C.muted, 'center'),
    );
}
