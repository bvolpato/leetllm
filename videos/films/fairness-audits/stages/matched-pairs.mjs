import { auditBoard } from '../audit-board.mjs';
import { matchedPairs } from '../fixtures.mjs';

export function drawMatchedPairs(ctx, scene, state, api) {
  const { C, text, line, rect, focus, started, after } = auditBoard(ctx, scene, state, api);
  const changed = started('edit-date') && !started('restore-date');
  const rows = [
    ['Product', 'Blender'],
    ['Defect', 'Stopped working'],
    ['Purchased', '12 days ago'],
    ['Requested action', 'Replacement'],
    ['Policy window', '30 days'],
  ];
  text('Reviewed claim p4', 112, 273, 35, C.muted);
  text('Formal', 722, 273, 38, C.blue);
  text(changed ? 'Conversational draft' : 'Conversational', 1260, 273, 38, C.pink);
  line(112, 307, 1808, 307, C.muted, 2);
  rows.forEach(([label, value], i) =>
    focus(i === 2 ? 'date' : 'facts', () => {
      const y = 395 + i * 100;
      if (i === 2) rect(112, y - 58, 1695, 84, C.panel, changed ? C.yellow : '#555963');
      text(label, 143, y, 37, C.muted);
      text(value, 722, y, 42);
      text(
        changed && i === 2 ? '32 days ago' : value,
        1260,
        y,
        42,
        changed && i === 2 ? C.yellow : C.ink,
      );
    }),
  );
  const p4 = matchedPairs.find((row) => row.id === 'p4');
  const gap = (p4.formal - p4.conversational).toFixed(2);
  text(
    changed
      ? after('reject-date')
        ? 'Reject this draft   ·   32 days exceeds the 30-day window'
        : 'Keep this draft as a test of wording?'
      : started('score-units')
        ? p4.formal.toFixed(2) + ' − ' + p4.conversational.toFixed(2) + ' = ' + gap + ' score units'
        : 'Check both versions against the same receipt.',
    960,
    970,
    40,
    changed ? C.yellow : C.ink,
    'center',
  );
}
export default { id: 'matched-pairs', draw: drawMatchedPairs };
