import { metricCases } from '../fixtures.mjs';
import { bootstrapMetricAccept, scorePair } from '../model.mjs';
import { card, route, text } from '../defaults.mjs';
import { complete, pairString, started } from '../policy-sheet.mjs';

export function drawBootstrap(ctx, scene, state, api) {
  const { C } = api;
  const kept = complete(state, 'accept-trace');
  const rejected = complete(state, 'partial-trace');
  const deployment = started(state, 'second-question') || started(state, 'partial-trace');
  const row = metricCases[deployment ? 1 : 0];
  const score = scorePair(row.gold, row.prediction);
  const passes = bootstrapMetricAccept(score, 1);
  const scored = deployment
    ? complete(state, 'zero-score') || started(state, 'partial-trace')
    : started(state, 'binary-threshold') || kept;
  const visibleReply = deployment
    ? started(state, 'same-output') || scored
    : started(state, 'teacher-output') || kept;
  api.focus.target('teacher-trace', () => {
    text(
      ctx,
      api,
      deployment ? 'Deploy payment-service?' : 'Roll back payment-tests?',
      118,
      280,
      57,
      C.ink,
    );
    text(ctx, api, 'Reviewed answer', 118, 521, 33, C.muted);
    text(ctx, api, pairString(row.gold), 118, 593, 45, C.blue);
    text(ctx, api, 'Teacher reply', 118, 706, 33, C.muted);
    text(ctx, api, visibleReply ? pairString(row.prediction) : '…', 118, 776, 45, C.ink);
  });
  const gate = api.focus.target('trace-score', () => {
    text(ctx, api, 'Threshold   1', 840, 520, 39, C.yellow);
    return card(
      ctx,
      api,
      scored ? 'metric = ' + score : 'metric = ?',
      812,
      579,
      310,
      scored ? (passes ? C.green : C.pink) : C.muted,
      103,
      1,
      42,
    );
  });
  const bank = api.focus.target('bank', () => {
    text(ctx, api, 'Compiled prompt', 1250, 288, 42, C.cyan);
    const copying = state.cues?.['accept-trace']?.phase === 'during';
    const copyX = copying ? 118 + 1132 * state.cues['accept-trace'].progress : 1250;
    const label = kept
      ? 'demonstration bank\nrollback-101'
      : copying
        ? 'Copy · rollback-101'
        : 'Empty example slot';
    const slot = card(
      ctx,
      api,
      label,
      copyX,
      325,
      550,
      kept || copying ? C.green : C.muted,
      160,
      1,
      33,
    );
    if (kept) {
      text(ctx, api, 'Roll back payment-tests?', 1250, 572, 36, C.ink);
      text(ctx, api, pairString(metricCases[0].prediction), 1250, 629, 35, C.green);
    }
    return slot;
  });
  if (kept && !deployment) route(ctx, api, gate, bank, C.green, 1);
  api.focus.target('rejected-trace', () => {
    if (deployment && scored) {
      const discard = card(
        ctx,
        api,
        rejected ? 'discarded · deploy-201' : 'check · deploy-201',
        1260,
        775,
        535,
        C.pink,
        92,
        1,
        36,
      );
      route(ctx, api, gate, discard, C.pink, state.cues?.['partial-trace']?.progress ?? 0);
    }
  });
  text(
    ctx,
    api,
    started(state, 'keep-question') && state.beat === 1
      ? 'Does the rollback example stay in the prompt?'
      : 'DSPy 3.4.0  ·  local teacher replies  ·  original student: 0 examples',
    118,
    964,
    30,
    C.muted,
  );
}
export default {
  id: 'bootstrap',
  draw: drawBootstrap,
  cues: [
    'teacher-output',
    'binary-threshold',
    'accept-trace',
    'copy-trace',
    'second-question',
    'same-output',
    'keep-question',
    'zero-score',
    'partial-trace',
    'bank-count',
  ],
};
