import { place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { speculativeMass } from '../../../films/beam-search/arithmetic.mjs';
import { rotationRow } from '../parts.mjs';

export default function speculativeBalance(s, c) {
  const ledger = speculativeMass([0.6, 0.3, 0.1], [0.8, 0.1, 0.1]);
  const board = rotationRow(s, {
    values: ledger.draft,
    words: ['create', 'revoke', 'rename'],
    guide: false,
  });
  const keys = [
    'Outline: target p · fill: draft q',
    'Draft q → accepted min(p, q)',
    'Accepted mass + residual → target p',
    'Target outline · fill moves to biased redraw',
  ].map((words) => place(note(words), board.top));
  const accepted = place(mono('Accepted .80 · rejected .20', { color: 'yellow' }), board.foot);
  const restored = place(
    label('Residual .20 → revoke · target restored', { color: 'yellow' }),
    board.foot,
  );
  const biased = place(label('Unadjusted redraw: .72 / .16 / .12', { color: 'red' }), board.foot);
  s.add(heading(c.title), [board.nodes, keys[0]]);
  c.onBeat(0, () => s.play(board.chart.reference(ledger.target, { duration: 0.6 })));
  c.after('speculative-balance-build-0', () => s.play(...board.update(ledger.accepted)));
  c.swap('speculative-balance-build-0', keys[0], keys[1], { after: true });
  c.show('speculative-balance-build-0', accepted, { after: true, lead: -1.3 });
  c.after('speculative-balance-build-1', () => s.play(...board.update(ledger.restored, 0.35)));
  c.swap('speculative-balance-build-1', keys[1], keys[2]);
  c.swap('speculative-balance-build-1', accepted, restored, { after: true });
  c.after('speculative-balance-build-2', () => s.play(...board.update(ledger.wrongRedraw)));
  c.swap('speculative-balance-build-2', keys[2], keys[3]);
  c.swap('speculative-balance-build-2', restored, biased, { after: true, lead: -1.3 });
}
