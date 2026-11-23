import { THRESHOLD, matchedPairs } from '../fixtures.mjs';
import { auditBoard, isAuto } from '../audit-board.mjs';

export function drawPairFlips(ctx, scene, state, api) {
  const { C, text, line, dot, rect, focus, progress, started } = auditBoard(ctx, scene, state, api);
  const x = (score) => 493 + (score - 0.5) * 2290;
  const dropped = started('drop-pair') && !started('restore-pair');
  const shown = Math.max(1, Math.ceil(progress('all-pairs') * matchedPairs.length));
  text('Expected claim', 105, 264, 29, C.muted);
  text('Human review', 475, 240, 33, C.ink);
  text('Automatic service', 1460, 240, 33, C.ink, 'center');
  text('0.70', x(THRESHOLD), 265, 37, C.yellow, 'center');
  line(x(THRESHOLD), 289, x(THRESHOLD), 880, C.yellow, 3);
  let crossings = 0;
  matchedPairs.forEach((row, i) => {
    const y = 330 + i * 55 + (row.ready ? 0 : 30);
    focus('pair-scores', () => {
      const target =
        row.id === 'p4' ? 'missing-pair' : row.ready ? 'ready-crossings' : 'unclear-crossing';
      focus(target, () => {
        text(row.id, 120, y + 10, 32, C.ink);
        if (i === 0 || i === 6) text(row.ready ? 'Ready' : 'Unclear', 232, y + 10, 30, C.muted);
        if (dropped && row.id === 'p4') {
          rect(455, y - 21, 1248, 43, C.panel, C.yellow);
          text('Both versions missing', 1080, y + 10, 27, C.yellow, 'center');
          return;
        }
        if (i >= shown) return;
        const flip = isAuto(row.formal) !== isAuto(row.conversational);
        if (flip) crossings++;
        line(
          x(row.conversational),
          y,
          x(row.formal),
          y,
          flip && started('route-flips') ? C.yellow : '#4a4f5b',
          flip ? 4 : 2,
        );
        for (const [variant, color] of [
          ['formal', C.blue],
          ['conversational', C.pink],
        ]) {
          if (row.ready) dot(x(row[variant]), y, 12, color);
          else rect(x(row[variant]) - 10, y - 10, 20, 20, color, null, 1);
        }
      });
    });
  });
  text('Formal', 120, 990, 32, C.blue);
  text('Conversational', 275, 990, 32, C.pink);
  const status = dropped
    ? '9 of 10 pairs returned   ·   Reject incomplete run'
    : started('route-flips')
      ? crossings + ' pairs cross the cutoff'
      : '10 pairs requested';
  text(status, 1780, 990, 35, dropped ? C.yellow : C.ink, 'right');
}
export default { id: 'pair-flips', draw: drawPairFlips };
