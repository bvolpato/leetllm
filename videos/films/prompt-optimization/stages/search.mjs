import { searchCandidates, searchCase, validationFixture } from '../fixtures.mjs';
import { countFixture } from '../arithmetic.mjs';
import { promptSearchSnapshot, selectValidationWinner } from '../model.mjs';
import { complete, paymentCase, policyRows, started } from '../policy-sheet.mjs';
import { developmentCounts } from '../tallies.mjs';
import { text } from '../defaults.mjs';

export function drawSearch(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat >= 2) {
    const counted = complete(state, 'development-counts');
    const selected = complete(state, 'select-program');
    const winner = selectValidationWinner();
    const baselinePercent = 100 * countFixture(validationFixture.baseline).rate;
    const compiledPercent = 100 * countFixture(validationFixture.compiled).rate;
    developmentCounts(ctx, api, {
      baselineVisible: complete(state, 'baseline-count'),
      compiledVisible: counted,
      selected,
    });
    api.focus.target('selection', () => {
      text(ctx, api, 'Illustrative development set  ·  model weights fixed', 120, 695, 35, C.muted);
      if (!counted) return;
      text(ctx, api, 'Baseline · development score ' + baselinePercent + '%', 120, 800, 39, C.blue);
      text(ctx, api, 'Compiled A · development score ' + compiledPercent + '%', 960, 800, 39, C.cyan);
      const candidate = searchCandidates[winner === 'compiled' ? 1 : 0];
      text(ctx, api, selected ? 'selected → ' + candidate.id : 'Which prompt would you freeze?', 120, 926, 51, C.yellow);
    });
    return;
  }
  const revised = started(state, 'revise-instruction') || state.beat > 0;
  const snapshot = promptSearchSnapshot(revised ? 1 : 0, 0);
  const showReply = complete(state, revised ? 'revised-abstain' : 'baseline-case');
  const showScore = complete(state, revised ? 'revised-one' : 'baseline-zero');
  policyRows(ctx, api, paymentCase, { showRequest: true, compare: true });
  api.focus.target('instruction', () => {
    text(
      ctx,
      api,
      revised ? 'B · Revised instruction' : 'A · Baseline instruction',
      120,
      728,
      35,
      C.yellow,
    );
    text(ctx, api, searchCandidates[revised ? 1 : 0].instruction, 590, 728, 42, C.ink);
  });
  api.focus.target('reply', () => {
    text(ctx, api, 'Reply', 120, 872, 36, C.muted);
    text(
      ctx,
      api,
      showReply ? snapshot.prediction.route + ' · ' + (snapshot.prediction.recordId || 'empty record ID') : 'route?   record ID?',
      370,
      878,
      48,
      showReply ? C.ink : C.yellow,
    );
  });
  api.focus.target('score', () => {
    text(ctx, api, 'Exact score', 1230, 872, 35, C.muted);
    text(
      ctx,
      api,
      showScore ? snapshot.score + ' / 1' : '? / 1',
      1510,
      877,
      50,
      showScore ? (snapshot.score ? C.green : C.pink) : C.muted,
    );
  });
  text(ctx, api, 'Worked replay  ·  ' + searchCase.id, 120, 995, 28, C.muted);
}
export default {
  id: 'search',
  draw: drawSearch,
  cues: [
    'baseline-case',
    'baseline-zero',
    'revise-instruction',
    'revised-abstain',
    'revised-one',
    'development-sample',
    'baseline-count',
    'development-counts',
    'select-program',
  ],
};
