import { motion } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('row-group-split-mechanism', () => {
    if (state.beat === 0) {
      const drop = motion(state, 'row-group-split-b1', 0, 0.5, 0.73);
      const xs = [290, 700, 1170, 1590];
      ['Incident', 'Request', 'Completion', 'Decision'].forEach((v, j) =>
        text(ctx, api, v, xs[j], 365, 33, C.muted, 'center'),
      );
      const rows = [
        ['T102', 'Stale key', 'Open a ticket', 'Keep'],
        ['B550', 'Expired key', '(empty)', 'Set aside'],
        ['(missing)', 'Role change', 'Escalate', 'Set aside'],
      ];
      rows.forEach((row, i) => {
        const y = 505 + 146 * i;
        row.forEach((v, j) => {
          if (j < 3 || drop > 0)
            text(ctx, api, v, xs[j], y, 39, j === 3 ? (i ? C.pink : C.green) : C.ink, 'center');
        });
      });
      return;
    }
    const grouped = motion(state, 'row-group-split-b2', 1, 0.4, 0.64);
    text(ctx, api, 'Training incidents', 595, 333, 40, C.blue, 'center');
    text(ctx, api, 'Validation incidents', 1415, 333, 40, C.cyan, 'center');
    api.line(ctx, 965, 367, 965, 845, C.muted, 3);
    upgradeBox(ctx, api, 'T102   /   Key age?', 225, 417, 710, 98, C.blue, 39);
    upgradeBox(
      ctx,
      api,
      'T102   /   Who approves?',
      1030 - 805 * grouped,
      566,
      710,
      98,
      C.blue,
      39,
    );
    upgradeBox(ctx, api, 'P771', 225, 722, 710, 89, C.blue, 37);
    upgradeBox(ctx, api, 'R550', 1030, 722, 710, 89, C.cyan, 37);
    const note =
      state.beat === 2
        ? 'New documents require a document-level holdout.'
        : grouped === 1
          ? 'Shared incident IDs   ∅'
          : 'Same incident ID on both turns';
    text(ctx, api, note, 960, 949, 40, C.ink, 'center');
  });
}

export default {
  id: 'row-group-split',
  draw: draw,
  cues: ['row-group-split-b1', 'row-group-split-b2', 'row-group-split-b3'],
};
