import { barChart, place } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { WORK, open, finish, windowPicture } from '../parts.mjs';
export default function managed(s, c) {
  const b = open(s, c, 'managed-unmanaged'),
    [left, right] = WORK.columns(2, 'loose');
  const [clockArea, clockFoot] = left.rows([5, 1], 'normal');
  const win = windowPicture(s, clockArea, 'W0: engine step clock', 0, 'step calls');
  const wrong = place(note('8 backward calls, only 1 engine step'), clockFoot);
  const fixed = place(note('8 backward calls, 8 managed engine steps'), clockFoot);
  const caller = place(note('Unmanaged: caller selects the update boundary'), clockFoot);
  const [plot, foot] = right.rows([5, 1], 'normal');
  const chart = place(
    barChart(
      [
        { label: 'intended', value: 1, color: 'cyan' },
        { label: 'extra division', value: 1, color: 'red' },
      ],
      {
        width: plot.width - 140,
        height: plot.height - 130,
        max: 1,
        labelSize: 34,
        showValues: true,
      },
    ),
    plot,
  );
  const version = place(note('Exact commit + resolved config + loop'), foot);
  s.add(win.nodes, chart, wrong);
  c.on('wrong', () => s.play(win.count.to(1, { duration: 1 }), win.buffer.to(8, { duration: 1 })));
  c.on('scale', () => s.play(chart.update([1, 1 / 8], { duration: 1.4 })));
  c.swap('managed', wrong, fixed);
  c.on('managed', () => s.play(win.count.to(8, { duration: 1 })));
  c.after('managed', () =>
    s.play(win.updates.to(1, { duration: 0.5 }), win.buffer.to(0, { duration: 0.5 })),
  );
  c.swap('caller', fixed, caller);
  c.on('caller', () => {
    win.count.set(0);
    win.updates.set(0);
    win.buffer.set(8);
    s.play(win.count.to(1, { duration: 1 }));
  });
  c.after('caller', () =>
    s.play(win.updates.to(1, { duration: 0.5 }), win.buffer.to(0, { duration: 0.5 })),
  );
  c.show('version', version);
  finish(c, b, 'managed-unmanaged');
}
