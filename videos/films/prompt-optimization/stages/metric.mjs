import { metricCases } from '../fixtures.mjs';
import { scorePair } from '../model.mjs';
import { complete, started } from '../policy-sheet.mjs';
import { text } from '../defaults.mjs';

export function drawMetric(ctx, scene, state, api) {
  const { C } = api;
  const corrected = complete(state, 'restore-id');
  const deploy = started(state, 'deploy-label');
  const gold = metricCases[deploy ? 1 : 0].gold;
  const prediction = corrected
    ? metricCases[0].prediction
    : { route: 'SERVE', recordId: 'approval-9999' };
  const score = scorePair(gold, prediction);
  const reveal = deploy
    ? complete(state, 'wrong-action-zero')
    : corrected
      ? complete(state, 'both-fields')
      : complete(state, 'wrong-id');
  api.focus.target('pairs', () => {
    text(
      ctx,
      api,
      deploy ? 'Deploy payment-service?' : 'Roll back payment-tests?',
      112,
      278,
      55,
      C.ink,
    );
    text(ctx, api, 'Route', 695, 405, 34, C.muted);
    text(ctx, api, 'Record ID', 1220, 405, 34, C.muted);
    [
      [gold, 'Reviewed label', 494],
      [prediction, 'Assistant’s reply', 664],
    ].forEach(([pair, label, y], i) => {
      text(ctx, api, label, 112, y + 32, 40, i ? C.yellow : C.blue);
      ['route', 'recordId'].forEach((key, j) => {
        const match = pair[key] === gold[key];
        const color = i && reveal ? (match ? C.green : C.pink) : C.ink;
        const x = j ? 1220 : 695;
        const waiting = i && key === 'recordId' && !started(state, 'compare-id');
        text(ctx, api, waiting ? '…' : pair[key] || '""', x, y + 39, 53, color);
        if (i && reveal) text(ctx, api, match ? 'match' : 'mismatch', x, y + 100, 30, color);
      });
    });
    api.line(ctx, 112, 584, 1795, 584, C.muted, 2);
  });
  api.focus.target('metric-score', () => {
    if (complete(state, 'id-only-replay')) {
      const citesApproval = prediction.recordId === metricCases[0].gold.recordId;
      text(ctx, api, 'ID-only grader', 112, 860, 37, C.muted);
      text(ctx, api, 'Route + record grader', 970, 860, 37, C.muted);
      text(ctx, api, Number(citesApproval) + ' / 1', 112, 950, 66, C.yellow);
      text(ctx, api, score + ' / 1', 970, 950, 66, C.pink);
      return;
    }
    text(ctx, api, 'Score', 112, 917, 40, C.muted);
    text(
      ctx,
      api,
      reveal ? 'exact contract · ' + score : '? / 1',
      470,
      930,
      55,
      reveal ? (score ? C.green : C.pink) : C.yellow,
    );
    if (deploy && reveal)
      text(ctx, api, 'route and evidence mismatch', 1170, 924, 40, C.pink);
  });
}
export default {
  id: 'metric',
  draw: drawMetric,
  cues: [
    'compare-id',
    'wrong-id',
    'restore-id',
    'both-fields',
    'deploy-label',
    'wrong-action-zero',
    'id-only-replay',
  ],
};
