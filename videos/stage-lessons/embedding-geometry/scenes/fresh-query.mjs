import { assertEqual, column, dot, line, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { QUANTIZATION_FIXTURE as F } from '../../../films/embedding-geometry/fixtures.mjs';
import { cosine, quantize } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function freshQuery(s, c) {
  const q = [0, 1];
  const rows = F.candidates.map((v, index) => {
    const code = quantize(v, F.step);
    return {
      name: ['C', 'D'][index],
      color: ['green', 'pink'][index],
      original: v,
      code,
      exact: cosine(q, v),
      approximate: cosine(q, code),
      index,
    };
  });
  const firstStage = [...rows].sort((a, b) => b.approximate - a.approximate || a.index - b.index);
  const rescore = (k) => firstStage.slice(0, k).sort((a, b) => b.exact - a.exact);
  assertEqual(rows[0].approximate, rows[1].approximate, 'tied codes for upward query');
  assertEqual([1, 2].map((k) => rescore(k)[0].name).join(','), 'C,D', 'winner after rescore');
  const [intro, headers, first, second, foot] = area.rows([1.2, 0.9, 2.3, 2.3, 1.2], 'normal');
  const cols = (r) => r.columns([2.8, 2.5, 1.6, 2.1], 'wide');
  const top = place(
    label('Upward query   [0, 1]     ·     two eligible passages', { size: 40 }),
    intro,
  );
  const names = ['Original', 'Rounded to 0.2', 'Shortlist', 'Original cosine'];
  const heads = cols(headers).map((r, i) => place(note(names[i], { size: 34 }), r));
  const cells = [first, second].map(cols);
  const labels = rows.map((r, i) =>
    place(
      column(
        [
          label('Passage ' + r.name, { color: r.color, size: 40 }),
          mono('[' + r.original.join(', ') + ']', { size: 38 }),
        ],
        { gap: 'normal' },
      ),
      cells[i][0],
    ),
  );
  const rounded = rows.map((r, i) =>
    place(
      column(
        [
          mono('[' + r.code.join(', ') + ']', { size: 38 }),
          note('cos ≈ ' + r.approximate.toFixed(3)),
        ],
        { gap: 'normal' },
      ),
      cells[i][1],
    ),
  );
  const reference = place(label('Full-precision reference    D first', { color: 'pink' }), foot);
  const tie = place(label('q = [0, 1]     ·     Tie order: C before D', { size: 40 }), intro);
  const question = place(label('One slot. Can rescoring return D?', { color: 'yellow' }), foot);
  const one = place(
    label('One original fetched    ·    C is the only result', { color: 'green' }),
    foot,
  );
  const two = place(label('Two originals fetched    ·    D ranks first', { color: 'pink' }), foot);
  const frames = cells.map((cellsInRow) => {
    const slot = cellsInRow[2];
    return rect(slot.width - 8, 112, { fill: null, stroke: 'blue', width: 4 }).moveTo(
      slot.point('center'),
    );
  });
  const routes = cells.map((r) => {
    const a = r[1].point('right'),
      b = r[2].point('left');
    return line([a[0] - 4, a[1]], [b[0] + 4, b[1]], { stroke: 'dim', width: 4 });
  });
  const picks = firstStage.map((r, i) =>
    mono(r.name, { size: 52, color: r.color }).moveTo(cells[i][1].point('right')),
  );
  const scores = rows.map((r, i) =>
    place(
      mono(r.exact.toFixed(4), {
        size: 48,
        color: r.color,
      }),
      cells[i][3],
    ),
  );
  const fetch = (i, cue, scoreCue) => {
    const start = cells[i][2].point('right'),
      end = cells[i][3].point('left');
    const trail = line(start, end, { stroke: rows[i].color, width: 3 });
    const mark = dot(8, rows[i].color).moveTo(start);
    c.show(cue, [trail, mark]);
    c.on(cue, () => s.play(to(mark, (n) => n.moveTo(end), { duration: 0.85 })));
    c.show(scoreCue, scores[i], { after: true });
  };
  const admit = (i, cue) => {
    c.show(cue, [routes[i], picks[i]]);
    c.on(cue, () =>
      s.play(to(picks[i], (n) => n.moveTo(cells[i][2].point('center')), { duration: 0.85 })),
    );
  };
  s.add(heading(c.title), top, heads[0], labels);
  c.show('reference', reference, { after: true });
  c.show('codes', [heads[1], rounded], { after: true });
  c.hide('tie', reference);
  c.swap('tie', top, tie);
  c.show('one', [heads[2], frames[0]]);
  c.show('ask', question);
  c.hide('omit', question);
  admit(0, 'omit');
  c.show('fetchc', heads[3]);
  fetch(0, 'fetchc', 'scorec');
  c.show('only', one, { after: true });
  c.show('widen', frames[1]);
  c.hide('widen', one);
  admit(1, 'admit');
  fetch(1, 'fetchd', 'scored');
  c.show('win', two, { after: true });
}
