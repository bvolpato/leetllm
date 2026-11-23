import { rates } from '../model.mjs';
import { wilson } from '../arithmetic.mjs';
import { auditBoard, wordings, wordingLabel, wordingColor } from '../audit-board.mjs';

export function drawUncertaintyAndSlices(ctx, scene, state, api) {
  const { C, text, line, rect, dot, focus, after, started } = auditBoard(ctx, scene, state, api);
  if (state.beat === 3) {
    focus('cells', () => {
      text('Support in each required cell', 112, 271, 45);
      wordings.forEach((key, j) =>
        text(wordingLabel(key), 747 + j * 660, 365, 37, wordingColor(C, key), 'center'),
      );
      ['Chat', 'Email'].forEach((label, i) => {
        const y = 470 + i * 230;
        text(label, 115, y + 60, 47);
        wordings.forEach((key, j) => {
          const x = 484 + j * 660;
          rect(x, y - 24, 527, 158, C.panel, wordingColor(C, key));
          text('3 of 50 ready', x + 38, y + 41, 38);
          text('2 of 30 unclear', x + 38, y + 102, 37);
        });
      });
      text(
        'All four cells need more independently sampled claims.',
        960,
        972,
        39,
        C.yellow,
        'center',
      );
    });
    return;
  }
  const added = after('seventh');
  const x = (p) => 504 + p * 1150;
  focus('bounds', () => {
    text(
      added ? 'Add one ready claim served in both wordings' : 'Original ready claims',
      115,
      269,
      45,
    );
    wordings.forEach((key, j) => {
      const color = wordingColor(C, key),
        y = 455 + j * 240;
      const r = rates(key),
        k = r.tp + Number(added),
        n = r.ready + Number(added);
      const [lo, hi] = wilson(k, n);
      text(wordingLabel(key), 116, y + 9, 37, color);
      text(k + ' / ' + n, 116, y + 86, 49, color);
      line(x(0), y, x(1), y, '#383e48', 2);
      line(x(lo), y, x(hi), y, color, 7);
      for (const bound of [lo, hi]) {
        line(x(bound), y - 15, x(bound), y + 15, color, 3);
        text((100 * bound).toFixed(1) + '%', x(bound), y - 38, 33, color, 'center');
      }
      dot(x(k / n), y, 13, C.yellow);
      text(((100 * k) / n).toFixed(1) + '%', x(k / n), y + 72, 36, C.ink, 'center');
    });
    text(
      started('another-ready') && !added
        ? '+1 ready pair, both served   ·   Where will each dot move?'
        : 'Dots show the service rate. Lines show the 95% Wilson interval.',
      960,
      958,
      37,
      C.muted,
      'center',
    );
  });
}
export default { id: 'uncertainty-and-slices', draw: drawUncertaintyAndSlices };
