import { effectDecision } from '../arithmetic.mjs';

export function drawDualUse(ctx, scene, state, api) {
  const { C, focus } = api;
  const grants = { readGranted: true, bulkExportGranted: false, ownerApproved: false };
  const decision = effectDecision(grants);
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  write('Support tool', 125, 278, 45, C.ink, 'serif');
  write('Permission check', 891, 278, 36, C.muted);
  write('Recorded effect', 1386, 278, 36, C.muted);
  focus.target('dual-benefit', () => {
    write('Read one case for triage', 125, 407, 43, C.ink, 'serif');
    write(decision.triage ? 'Read granted' : 'Read denied', 891, 407, 38, C.green);
    write('Case available', 1386, 407, 39, C.green);
  });
  api.line(ctx, 125, 472, 1785, 472, '#555961', 2);
  const requested = focus.visible('dual-use-export'),
    p = focus.progress('dual-use-control');
  focus.target('dual-export', () => {
    if (requested) write('Export private cases in bulk', 125, 570, 43, C.ink, 'serif');
  });
  focus.target('dual-control', () => {
    if (!requested) return;
    write(grants.bulkExportGranted ? 'Export granted' : 'Export denied', 891, 570, 38, C.pink);
    const y = 658,
      x0 = 176,
      stop = 963;
    api.line(ctx, x0, y, stop, y, '#595d68', 3);
    api.line(ctx, stop, y - 34, stop, y + 34, C.pink, 7);
    api.circle(ctx, x0 + (stop - 23 - x0) * api.ease(p), y, 18, C.yellow);
    if (p === 1) write(decision.exportCount + ' exports', 1386, 570, 43, C.ink);
  });
  if (focus.visible('export-log'))
    focus.target('audit-record', () =>
      write('Audit log: bulk export request denied.', 125, 819, 36, C.muted),
    );
  if (state.beat === 1) {
    focus.target('dual-reversal', () => write('Before expanding access', 125, 918, 33, C.muted));
    focus.target('dual-risk', () =>
      write('Which other actions can the tool take?', 672, 920, 43, C.yellow, 'serif'),
    );
  }
}
export default {
  id: 'dual-use',
  draw: drawDualUse,
  cues: [
    'dual-use-benefit',
    'dual-use-export',
    'dual-use-control',
    'export-log',
    'dual-use-residual',
    'dual-use-change',
  ],
};
