import { column, fadeOut, line, place, rect, shift } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';

// One horizontal unit always represents one unit of centered exponential mass.
// Removing a candidate shortens the denominator and leaves the other terms at their original scale.
export function poolPicture(query, names, colors, scores, all, tau) {
  const [top, operands, first, second, foot] = area.rows([1, 2, 1.6, 1.6, 1.4], 'normal');
  const [queryRegion, tempRegion] = top.columns([3, 1], 'loose');
  const header = [
    place(label(query, { color: 'cyan', size: 44 }), queryRegion, 'left'),
    place(mono('τ = ' + tau.toFixed(2), { size: 40 }), tempRegion, 'right'),
  ];
  const cards = operands.columns(3, 'loose');
  const inputs = [],
    weights = [];
  for (const [i, card] of cards.entries()) {
    const [name, score, mass] = card.rows(3, 'tight');
    inputs.push(place(label(names[i], { size: 40, color: colors[i] }), name));
    inputs.push(place(mono('cosine ' + scores[i].toFixed(3), { size: 36 }), score));
    weights.push(
      place(mono('mass ' + all.masses[i].toFixed(4), { color: colors[i], size: 36 }), mass),
    );
  }

  function strip(region, name, row) {
    const [terms, value] = region.columns([2, 1], 'loose');
    const [caption, track] = terms.rows([1, 1], 'tight');
    const start = track.left,
      y = track.point('center')[1],
      unit = track.width / 2.12;
    let x = start;
    const pieces = row.masses.flatMap((mass, i) => {
      if (!mass) return [];
      const width = unit * mass;
      const block = rect(width, 46, { fill: colors[i], stroke: null }).moveTo([x + width / 2, y]);
      x += width;
      return [block];
    });
    const rail = line([start, y + 35], [track.right, y + 35], { stroke: 'dim', width: 2 });
    const ticks = [0, 1, 2].map((n) =>
      line([start + n * unit, y + 29], [start + n * unit, y + 42], { stroke: 'dim', width: 2 }),
    );
    const captionNode = place(label(name, { size: 35 }), caption, 'left');
    const result = place(
      column(
        [
          mono(Number(row.masses[0].toFixed(4)) + ' / ' + row.sum.toFixed(4), { size: 38 }),
          label('target share ' + (row.probs[0] * 100).toFixed(1) + '%', {
            color: colors[0],
            size: 38,
          }),
        ],
        { gap: 'tight', align: 'center' },
      ),
      value,
    );
    return { frame: [captionNode, rail, ticks], pieces, result, unit, masses: row.masses };
  }
  const footer = (words, color = 'ink') => place(label(words, { color, size: 40 }), foot);
  const instruction = (words, color = 'dim') => place(note(words, { color, size: 34 }), foot);
  return { header, inputs, weights, first, second, strip, footer, instruction };
}

// Remove the second copy from a full three-entry row, then close the visible gap.
// The last term keeps its exact width throughout the move.
export function removeCopy(s, strip) {
  s.play(fadeOut(strip.pieces[1], { duration: 0.4 }));
  s.wait(0.55);
  s.play(shift(strip.pieces[2], -strip.unit * strip.masses[1], 0, { duration: 0.85 }));
}
