import { CASES } from '../fixtures.mjs';
import { evaluate } from '../model.mjs';
import { cueClock, routeLedger } from '../report-picture.mjs';

export function drawTradeoff(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const original =
    at('serve-every-case') === 1 ? evaluate('regressed', CASES) : evaluate('regressed', []);
  const repair = evaluate('first repair', CASES);
  const revision = at('score-revision') === 1 ? evaluate('revision', CASES) : null;
  routeLedger(ctx, api, [
    original,
    repair,
    revision ?? (at('accept-runbook') > 0 ? evaluate('revision', []) : null),
  ]);
  api.focus.target('errors', () => {
    const caption = revision
      ? 'Run 3   /   ' +
        revision.unsafe +
        ' unsafe serves   ·   ' +
        revision.unnecessary +
        ' unnecessary refusals'
      : at('accept-runbook') > 0
        ? 'Run 3 accepts release records and rollback runbooks.'
        : original.count
          ? 'Run 1   /   ' +
            original.unsafe +
            ' unsafe serves     ·     Run 2   /   ' +
            repair.unnecessary +
            ' unnecessary refusal'
          : 'Original rule   /   always serve';
    api.text(ctx, caption, 120, 990, 36, revision ? api.C.green : api.C.ink);
  });
}
export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: [
    'serve-every-case',
    'two-directions',
    'accept-runbook',
    'score-revision',
    'inspect-answer',
  ],
};
