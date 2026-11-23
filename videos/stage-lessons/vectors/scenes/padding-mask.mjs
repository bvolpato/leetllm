import { place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, H } from '../parts.mjs';
import { countedRows } from '../counted-rows.mjs';

export default function (s, c) {
  const f = frame(c);
  const padded = s.value(0),
    filter = s.value(0),
    empty = s.value(0);
  const real = H[0].slice(0, 2);
  const rows = () =>
    [...real, [0, 0], [0, 0]].map((values, i) => ({
      name: empty.value || i >= 2 ? 'padding' : 'token ' + i,
      values,
      present: i < 2 || Boolean(padded.value),
      counted: !empty.value && (i < 2 || !filter.value),
    }));
  const ledger = countedRows(f.body, { rows, width: 2, max: 0.5, title: 'Stored token rows' });
  const plain = place(mono('mean(axis=1)', { size: 38 }), f.foot);
  const masked = place(
    mono('valid[:, :, None]    [true, true, false, false]', { size: 36, color: 'cyan' }),
    f.foot,
  );
  const stop = place(
    mono('No valid positions. Stop before division.', { size: 36, color: 'red' }),
    f.foot,
  );
  s.add(f.title, ledger.sheet, ledger.sum, ledger.count, ledger.means, plain);
  c.after('padding-add', () => padded.set(1));
  c.after('padding-select', () => filter.set(1));
  c.swap('padding-select', plain, masked, { after: true });
  c.on('clear-mask', () => empty.set(1));
  c.hide('clear-mask', masked);
  c.show('padding-empty', stop, { after: true });
}
