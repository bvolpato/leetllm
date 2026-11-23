import { confusion } from '../arithmetic.mjs';
import { test } from '../fixtures.mjs';

export function drawSelectiveLabels(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const threshold = 0.5;
  const reviewed = test.filter((r) => r.p >= threshold);
  const automatic = test.filter((r) => r.p < threshold);
  const { tp, fp } = confusion(reviewed, threshold);
  const hasAudit = beat === 0 || beat >= 4;
  const sampled = automatic[0];
  api.text(ctx, 'August requests · threshold 0.50', 130, 260, 40, C.ink);
  for (const [j, group] of [reviewed, automatic].entries()) {
    const y = 480 + j * 227;
    api.text(ctx, j === 0 ? 'Sent to review' : 'Automatic', 135, y + 20, 38, C.ink);
    group.forEach((row, i) => {
      const x = 548 + 352 * i;
      const observed = !j || (hasAudit && (beat === 0 || row === sampled));
      api.rect(ctx, x, y - 80, 296, 143, C.panel, j ? C.blue : C.yellow, 12);
      api.text(
        ctx,
        'r' + test.indexOf(row) + '    ' + row.p.toFixed(2),
        x + 148,
        y - 22,
        36,
        C.ink,
        'center',
      );
      api.text(
        ctx,
        observed ? (row.y ? 'Needed review' : 'Routine') : 'Unknown',
        x + 148,
        y + 35,
        31,
        observed ? C.ink : C.muted,
        'center',
      );
    });
  }
  api.text(
    ctx,
    tp + ' needed review out of ' + (tp + fp) + ' sent',
    960,
    330,
    35,
    C.yellow,
    'center',
  );
  if (beat === 1) {
    api.text(
      ctx,
      'How many needed reviews did the router catch?',
      960,
      931,
      42,
      C.yellow,
      'center',
    );
  } else if (beat === 2 || beat === 3) {
    const cases = beat === 2 ? 1 : automatic.length + 1;
    for (let misses = 0; misses < cases; misses++) {
      const x = 337 + 408 * misses;
      api.text(
        ctx,
        misses + (misses === 1 ? ' possible miss' : ' possible misses'),
        x,
        871,
        29,
        C.muted,
        'center',
      );
      api.text(ctx, 'Recall  ' + tp + '/' + (tp + misses), x, 954, 43, C.ink, 'center');
    }
  } else if (beat >= 4) {
    api.text(
      ctx,
      'r' +
        test.indexOf(sampled) +
        ' adds one observed miss. Two automatic outcomes are still unknown.',
      960,
      934,
      35,
      C.ink,
      'center',
    );
  } else {
    api.text(ctx, 'All six audited · r1 was a missed review', 960, 931, 37, C.ink, 'center');
  }
}

export default { id: 'selective-labels', draw: drawSelectiveLabels };
