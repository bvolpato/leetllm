import { SHADOW_ROWS } from './fixtures.mjs';
import { shadowReplay } from './model.mjs';

const names = [
  'Key retention',
  'Audit-log wording',
  'Revoked keys',
  'Policy FAQ',
  'Restore a key?',
];
const project = (score) => 718 + (score - 0.99) * 78200;

export function scoreBoard(
  ctx,
  api,
  { cutoff, rows = SHADOW_ROWS, prompt, vector, excludeRestore = false },
) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const replay = shadowReplay(cutoff, rows);
  const proposed = new Set(replay.proposals.map((pair) => pair.id));
  txt('Reviewed question', 110, 254, 33, C.muted);
  txt('Similarity', 620, 254, 31, C.muted, 'right');
  txt('Proposal', 1575, 254, 31, C.muted);
  api.line(ctx, 110, 284, 1810, 284, C.muted, 2);
  focus.target('score-board', () => {
    for (const [i, row] of rows.slice(0, 5).entries()) {
      const y = 357 + 84 * i;
      const color = row.correct ? C.cyan : C.pink;
      const bypass = excludeRestore && i === 4;
      txt(names[i], 110, y + 13, 36, color);
      txt(
        bypass ? '—' : row.score.toFixed(vector && i === 4 ? 5 : 4),
        620,
        y + 13,
        33,
        color,
        'right',
      );
      api.line(ctx, project(0.99), y, project(1), y, C.panel, 4);
      if (!bypass) {
        api.circle(ctx, project(row.score), y, 13, proposed.has(row.id) ? color : C.bg, color, 3);
      }
      txt(
        bypass ? 'Bypass' : proposed.has(row.id) ? 'Propose' : 'Skip',
        1575,
        y + 13,
        35,
        bypass ? C.yellow : proposed.has(row.id) ? color : C.muted,
      );
    }
    const x = project(cutoff);
    api.line(ctx, x, 305, x, 733, C.yellow, 3);
    const atStop = [0.99, 0.995, 0.999, 1].includes(cutoff);
    txt(atStop ? '≥ ' + cutoff.toFixed(3) : 'Minimum', x, 244, 33, C.yellow, 'center');
    api.line(ctx, project(0.99), 752, project(1), 752, C.muted, 2);
    for (const tick of [0.99, 0.995, 1]) {
      const tx = project(tick);
      api.line(ctx, tx, 752, tx, 763, C.muted, 2);
      txt(tick.toFixed(3), tx, 800, 29, C.muted, 'center');
    }
  });
  focus.target('selection-counts', () => {
    if (vector) {
      txt('Restoration vector', 110, 887, 32, C.pink);
      txt('[' + vector.map((v) => Number(v.toFixed(4))).join(', ') + ']', 455, 887, 34);
      txt(replay.good.length + ' valid pairs proposed', 1795, 887, 36, C.cyan, 'right');
    } else {
      const correct = replay.good.length;
      txt('Precision', 110, 894, 33, C.muted);
      txt(correct + ' / ' + replay.proposals.length + ' proposed', 315, 894, 40, C.ink);
      txt('Recall', 1035, 894, 33, C.muted);
      txt(
        correct + ' / ' + rows.filter((r) => r.eligible && r.correct).length + ' acceptable',
        1210,
        894,
        40,
        C.ink,
      );
    }
  });
  if (prompt) txt(prompt, 960, 996, 35, C.yellow, 'center');
}
