import { indicate, place } from 'vizmatic/stage';
import { area, heading, label, note } from '../../kit-narrated.mjs';
import { renewalSheet } from '../renewals.mjs';
import { caseBoard, scoreCases } from '../parts.mjs';

export default function slices(s, c) {
  const old = caseBoard();
  const [top, body, balance, bottom] = area.rows([1, 4.4, 1, 1], 'normal');
  const sheet = renewalSheet(body);
  const [a, b] = sheet.rows;
  const title = heading('Where did the renewal gains go?');
  const lock = place(note('Same 100 library questions'), top);
  const diff = (slice) => scoreCases('B', slice).correct - scoreCases('A', slice).correct;
  const gain = diff('renewal'),
    loss = diff('ordinary');
  const [left, center, right] = balance.columns(3, 'normal');
  const extra = place(label(`Renewals   +${gain}`, { color: 'green' }), right);
  const lost = place(label(`Ordinary   −${-loss}`, { color: 'red' }), left);
  const sum = place(label(`Net change   ${gain + loss}`), center);
  const ask = place(label('Where did the overall gain go?', { color: 'yellow' }), bottom);
  const floor = place(label('Renewal desk requires 8/10'), top);
  const result = place(label('A   2/10       B   9/10  ✓', { color: 'yellow' }), bottom);
  c.take(old.nodes);
  s.add(title);
  c.swapAll(
    'slice-open',
    [lock, sheet.titles, sheet.idLabels, a.totals, b.totals, a.frames, b.frames, a.marks, b.marks],
    { keep: [title] },
  );
  const focus = (id, indices) =>
    c.on(id, () =>
      s.play(
        indicate(
          indices.flatMap((i) => [sheet.idLabels[i], a.marks[i], b.marks[i]]),
          { scale: 1.08, color: 'yellow' },
        ),
      ),
    );
  focus('shared-pass', [0, 1]);
  focus('shared-miss', [9]);
  focus('switches', [2, 3, 4, 5, 6, 7, 8]);
  c.show('gain', extra, { after: true });
  c.show('offset-ask', [ask, a.ordinaryCount, b.ordinaryCount]);
  c.on('ordinary-loss', () =>
    s.play(indicate([a.ordinaryCount, b.ordinaryCount], { scale: 1.1, color: 'yellow' })),
  );
  c.show('loss-count', lost, { after: true });
  c.show('net-zero', sum, { after: true });
  c.hide('net-zero', ask);
  c.swap('renewal-floor', lock, floor, { after: true });
  c.show('slice-fire', result, { after: true });
  focus('shared-failure', [9]);
}
