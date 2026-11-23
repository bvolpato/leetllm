import { batchComparison, calculation, drawBatch } from '../batch.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const fresh = batchComparison(3, 4, 1);
const reference = batchComparison(3, 3, 1);
const beforeBias = batchComparison(3, 4);
function thirds(value) {
  return (
    Math.round(value * 3)
      .toString()
      .replace('-', '−') + '/3'
  );
}
export function drawLastBatch(ctx, scene, state, api) {
  const { C } = api;
  const inputs = fresh.batch;
  const changed = operationProgress(state, 'last-bias') > 0;
  const selected = resultAfter(state, 'last-select');
  const answered = resultAfter(state, 'last-loss');
  const compare = operationProgress(state, 'last-check') > 0;
  const data = changed ? fresh : beforeBias;
  drawBatch(ctx, api, data, {
    caption: 'Last batch     [4, 2]',
    errorCount: changed ? Math.ceil(4 * operationProgress(state, 'last-errors')) : 0,
    mask: selected ? inputs.map((row) => row.valid) : undefined,
    bracketSlots: selected ? 3 : 0,
  });
  if (compare) {
    const matched = resultAfter(state, 'last-match');
    api.focus.target('last-checks', () => {
      const xs = [115, 765, 1055, 1345, 1635];
      ['Run', 'Mean loss', '∂L/∂w₀', '∂L/∂w₁', '∂L/∂b'].forEach((s, i) =>
        api.text(ctx, s, xs[i], 782, 30, C.muted, 'left'),
      );
      const checks = [
        ['Three real rows', ...[reference.loss.naive, ...reference.naiveGradient].map(thirds)],
        [
          'Four slots, masked',
          ...[fresh.loss.masked, ...fresh.validGradient].map((v) => (matched ? thirds(v) : '?')),
        ],
      ];
      checks.forEach((row, i) =>
        row.forEach((s, j) =>
          api.text(ctx, s, xs[j], 855 + i * 78, 42, i && matched ? C.green : C.ink, 'left'),
        ),
      );
    });
  } else if (answered) {
    calculation(
      ctx,
      api,
      'Three real examples',
      '(1 + 4 + 0) / 3 = 5/3',
      'The perfect prediction still counts. The padding error stays out of the sum.',
    );
  } else if (selected) {
    calculation(ctx, api, 'Keep examples 1, 2 and 3', '(1 + 4 + 0) / 3 = ?');
  } else {
    calculation(
      ctx,
      api,
      changed
        ? 'Which errors enter the sum? How many examples count?'
        : 'Three real rows and one padding row',
      changed ? 'Sum = ?       Count = ?' : 'Prediction = x · w + b',
    );
  }
}
export default {
  id: 'last-batch',
  draw: drawLastBatch,
  cues: ['last-bias', 'last-errors', 'last-select', 'last-loss', 'last-check', 'last-match'],
};
