import { dynamic, fadeIn, group, line, par, place, rect, seq, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import { fuse } from '../../films/hybrid-search/model.mjs';

// Retract the divider before moving it past an ID so the lettering stays legible.
export function cutoff(s, rows, left, right, count) {
  const level = (n) => rows[n - 1].bottom + 6;
  const y = s.value(level(count));
  const span = s.value(1);
  const mark = dynamic(() =>
    line([left - 8, y.value], [left - 3 + (right - left + 3) * span.value, y.value], {
      stroke: 'yellow',
      width: 5,
    }),
  );
  const move = (n) =>
    seq(
      span.to(0, { duration: 0.15 }),
      y.to(level(n), { duration: 0.35 }),
      span.to(1, { duration: 0.15 }),
    );
  return { mark, move };
}

// Each row belongs to one passage. Two separate rank slips can contribute to the same row.
export function rankSheet(title, { lanes, ids, k = 60 }) {
  const result = fuse(lanes, k);
  const [banner, work, foot] = area.rows([0.75, 4.9, 0.95], 'normal');
  const [header, data] = work.rows([0.65, 3.9], 'normal');
  const widths = [1.12, 0.78, 0.78, 2.05, 1.38];
  const cols = header.columns(widths, 'normal');
  const names = ['Passage', 'Lexical', 'Dense', 'Rank contributions', 'Fused order'];
  const ink = ['ink', 'cyan', 'pink', 'ink', 'ink'];
  const shell = [
    heading(title),
    ...cols.map((col, i) => place(label(names[i], { size: 38, color: ink[i] }), col)),
  ];
  const votes = [[], []];
  const scores = [];
  const order = [];
  const slots = data.rows(ids.length, 'normal');
  const output = cols.at(-1);
  shell.push(
    line([output.left - 8, header.top], [output.left - 8, data.bottom], {
      stroke: 'grid',
      width: 2,
    }),
  );
  for (const [i, id] of ids.entries()) {
    const [record, lexical, dense, sum, ranked] = slots[i].columns(widths, 'normal');
    shell.push(place(label(id, { size: 40 }), record));
    const ranks = lanes.map((lane) => lane.indexOf(id) + 1);
    ranks.forEach((rank, j) =>
      shell.push(
        place(
          mono(rank ? '#' + rank : '—', { size: 47, color: rank ? ink[j + 1] : 'dim' }),
          j ? dense : lexical,
        ),
      ),
    );
    const [strip, total] = sum.rows([1.35, 1], 'tight');
    const upperBound = 2 / (k + 1);
    const baseX = strip.left + 4;
    const scale = (strip.width - 14) / upperBound;
    const y = strip.point('center')[1];
    let offset = 0;
    for (const [j, rank] of ranks.entries()) {
      if (!rank) continue;
      const width = scale / (k + rank);
      const center = [baseX + offset + width / 2, y];
      const slip = group(
        rect(width - 4, 56, { fill: 'surface', stroke: ink[j + 1], width: 3, radius: 6 }).moveTo(
          center,
        ),
        mono('1/' + (k + rank), { size: 39, color: ink[j + 1] }).moveTo(center),
      );
      const lane = j ? dense : lexical;
      const travelY = lane.point('center')[1] + 66;
      slip.moveTo([lane.point('center')[0], travelY]);
      votes[j].push({ slip, center, travelY });
      offset += width;
    }
    const score = result.find((row) => row.id === id).score;
    scores.push(place(mono(score.toFixed(5), { size: 38 }), total, 'top'));
    order.push(place(label(i + 1 + '   ' + result[i].id, { size: 39 }), ranked));
  }
  const edge = (s, count) => cutoff(s, slots, output.left, output.right, count);
  const top = (words) => place(note(words, { size: 36 }), banner);
  const bottom = (words) => place(label(words, { size: 40, color: 'yellow' }), foot);
  const cast = (lane) =>
    par(
      ...votes[lane].map(({ slip, center, travelY }) =>
        seq(
          fadeIn(slip, { duration: 0.18 }),
          to(slip, (n) => n.moveTo([center[0], travelY]), { duration: 0.6 }),
          to(slip, (n) => n.moveTo(center), { duration: 0.3 }),
        ),
      ),
    );
  return { shell, cast, scores, order, edge, top, bottom, result };
}
