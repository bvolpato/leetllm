import { matchedPairs } from '../fixtures.mjs';
import { rates } from '../model.mjs';
import { auditBoard, isAuto, routeLedger } from '../audit-board.mjs';

export function drawConfusionMatrices(ctx, scene, state, api) {
  const b = auditBoard(ctx, scene, state, api);
  const { C, text, focus, progress, after, started } = b;
  const ready = state.beat < 2;
  const rows = matchedPairs.filter((row) => row.ready === ready);
  const sort = progress(ready ? 'ready-sort' : 'unclear-sort');
  const countVisible = (key) =>
    ready
      ? after(key === 'formal' ? 'ready-rates' : 'conversational-count')
      : after('unclear-count');
  const tally = (key) => rows.filter((row) => isAuto(row[key])).length;
  const gap = Math.abs(tally('formal') - tally('conversational'));
  focus('routes', () => {
    text(ready ? 'Ready for a replacement' : 'Need clarification', 112, 262, 48);
    text('Same ' + rows.length + ' claims in each wording', 1808, 262, 33, C.muted, 'right');
    routeLedger(
      b,
      rows,
      (row, key) => {
        const destination = isAuto(row[key]) ? 0 : 1;
        return 0.5 + (destination - 0.5) * sort;
      },
      (key) => (countVisible(key) ? tally(key) : null),
      'counts',
    );
  });
  const f = rates('formal'),
    c = rates('conversational');
  const percent = 100 * Math.abs(ready ? f.tpr - c.tpr : f.fpr - c.fpr);
  const gapShown = after(ready ? 'ready-gap' : 'unclear-gap');
  focus('counts', () =>
    text(
      gapShown
        ? (ready ? 'True' : 'False') +
            ' positive rate gap     ' +
            gap +
            ' / ' +
            rows.length +
            '  =  ' +
            percent.toFixed(1) +
            ' percentage points'
        : ready
          ? 'Count the ready claims that get automatic service.'
          : 'How many unclear claims got automatic service in each row?',
      960,
      984,
      39,
      gapShown ? C.yellow : C.ink,
      'center',
    ),
  );
}
export default { id: 'confusion-matrices', draw: drawConfusionMatrices };
