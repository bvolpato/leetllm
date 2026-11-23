import { assertEqual, column, fade, numberLine, place, recolor } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
export default function ivf(s, c) {
  const f = frame(c, { shelfVisible: false });
  const [main, stats] = f.body.rows([3, 1], 'loose');
  const ruler = place(
    numberLine({
      range: [0, 10],
      ticks: [0, 4, 4.9, 5.1, 10],
      tickLabels: [0, 10],
      length: main.width - 240,
      size: 34,
      labelSize: 34,
      levels: 5,
      points: [
        { name: 'center L', value: 0, color: 'dim' },
        { name: 'record L', label: 'record L · 4', value: 4, color: 'blue' },
        { name: 'query', label: 'query · 4.9', value: 4.9, color: 'pink' },
        { name: 'record R', label: 'record R · 5.1', value: 5.1, color: 'blue' },
        { name: 'center R', value: 10, color: 'dim' },
        { name: 'best', label: false, value: 4, color: 'yellow' },
      ],
      thresholds: [{ at: 5, label: 'list border' }],
      bands: [
        { name: 'left list', color: 'dim' },
        { name: 'right list', color: 'dim', hollow: true },
      ],
    }),
    main,
  );
  ruler.pointNodes[5].opacity(0);
  const leftProbe = ruler.bracket(0, 5, { label: 'one list searched' });
  const twoProbes = ruler.bracket(0, 10, { label: 'both lists searched' });
  leftProbe.opacity(0);
  twoProbes.opacity(0);
  const leftDistance = place(mono('distance |4.9 − 4| = 0.9', { color: 'blue' }), f.foot);
  const rightDistance = place(mono('distance |5.1 − 4.9| = 0.2', { color: 'green' }), f.foot);
  assertEqual((4.9 - 4).toFixed(1), '0.9', 'left distance');
  assertEqual((5.1 - 4.9).toFixed(1), '0.2', 'right distance');
  const answer = place(label('Second probe finds the nearer record', { color: 'yellow' }), f.foot);
  const rawGB = (1_000_000 * 384 * 4) / 1e9;
  const data = place(
    column(
      [
        mono('1,000,000 vectors  ×  384 coordinates  ×  4 bytes'),
        label(rawGB + ' GB of raw vectors', { color: 'cyan', size: 65 }),
      ],
      { gap: 'normal' },
    ),
    main,
  );
  const centers = 1000,
    listSize = 1000;
  const work = (probes) =>
    place(
      column(
        [
          note('1,000 trained centers    ·    1,000 records per list'),
          mono(
            centers.toLocaleString('en-US') +
              ' + ' +
              probes +
              ' × 1,000 = ' +
              (centers + probes * listSize).toLocaleString('en-US') +
              ' comparisons',
            { size: 43 },
          ),
        ],
        { gap: 'tight' },
      ),
      stats,
    );
  const ten = work(10),
    twenty = work(20);
  assertEqual(rawGB, 1.536, 'decimal GB');
  assertEqual(centers + 20 * listSize, 21000, 'twenty probe work');
  s.add(f.title, data);
  c.swap(1, data, ruler);
  c.after('ivf-one', () => s.play(fade(leftProbe, 1), fade(ruler.pointNodes[5], 1)));
  c.show('ivf-one', leftDistance, { after: true });
  c.swap('ivf-nearest', leftDistance, rightDistance, { after: true });
  c.after('ivf-nearest', () => s.play(recolor(ruler.pointNodes[3], 'green')));
  c.swap('ivf-both', rightDistance, answer, { after: true });
  c.after('ivf-both', () =>
    s.play(fade(leftProbe, 0), fade(twoProbes, 1), ruler.move('best', 5.1)),
  );
  c.show('ivf-ten', ten, { after: true });
  c.swap('ivf-work', ten, twenty, { after: true });
}
