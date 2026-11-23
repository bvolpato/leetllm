import { matchedPairs, THRESHOLD } from '../fixtures.mjs';
import { candidateRows, rates } from '../model.mjs';
import { auditBoard, wordingColor, wordings } from '../audit-board.mjs';

export function drawCriterionChoice(ctx, scene, state, api) {
  const { C, text, line, dot, rect, focus, progress, started } = auditBoard(ctx, scene, state, api);
  const candidate = started('candidate-table');
  const rows = candidate ? candidateRows() : matchedPairs;
  const movingCutoff = candidate
    ? THRESHOLD
    : started('strict-cut')
      ? 0.5 + 0.45 * progress('strict-cut')
      : THRESHOLD - 0.2 * progress('lenient-cut');
  const cutoff = Math.round(100 * movingCutoff) / 100;
  const x = (score) => 341 + (score - 0.48) * 1930;
  const formal = rates('formal', cutoff, rows),
    casual = rates('conversational', cutoff, rows);
  focus('threshold', () => {
    text(candidate ? 'Candidate scores' : 'Baseline scores', 114, 254, 38);
    text('Cutoff  ' + cutoff.toFixed(2), x(cutoff), 336, 32, C.yellow, 'center');
    line(x(cutoff), 359, x(cutoff), 745, C.yellow, 4);
    text(
      'Below cutoff → review     ·     At or above cutoff → auto',
      730,
      800,
      30,
      C.muted,
      'center',
    );
    wordings.forEach((key, j) => {
      const color = wordingColor(C, key);
      text(j ? 'Conversational' : 'Formal', 113, 413 + j * 217, 30, color);
      rows.forEach((row, i) => {
        const y = 384 + i * 17 + j * 217;
        if (row.ready) dot(x(row[key]), y, 6, color);
        else rect(x(row[key]) - 6, y - 6, 12, 12, color, null, 1);
      });
    });
  });
  focus('rates', () => {
    text('Formal   /   Conversational', 1592, 260, 28, C.ink, 'center');
    for (const [i, title, a, b, limit] of [
      [0, 'Ready served', formal.tpr, casual.tpr, 'At least 80% each'],
      [1, 'Unclear served', formal.fpr, casual.fpr, 'At most 10% each'],
    ]) {
      const y = 360 + i * 240;
      text(title, 1592, y, 37, C.ink, 'center');
      text(
        (100 * a).toFixed(0) + '%   /   ' + (100 * b).toFixed(0) + '%',
        1592,
        y + 74,
        50,
        C.ink,
        'center',
      );
      text(limit, 1592, y + 134, 31, C.muted, 'center');
    }
    text('Each gap must be ≤ 10 percentage points', 960, 900, 35, C.yellow, 'center');
  });
  focus('support', () => {
    text(
      started('support')
        ? 'Support per wording     6 of 50 ready     ·     4 of 30 unclear'
        : '10 matched claims   ·   circles ready   ·   squares unclear',
      960,
      987,
      36,
      C.muted,
      'center',
    );
  });
}
export default { id: 'criterion-choice', draw: drawCriterionChoice };
