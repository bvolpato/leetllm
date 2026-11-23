import { assertEqual, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS, FLAT, WORDS, WORKSHEET } from '../parts.mjs';
import { massStrip } from '../ruler.mjs';

export default function filterP(s, c) {
  const [upper, lower, foot] = area.inset('normal').rows([2.5, 2.5, 0.85], 'normal');
  const threshold = 0.9;
  const worksheet = (values, region, name) => {
    const [head, track, result] = region.rows([1, 1.6, 1], 'tight');
    const selected = retainedPolicy(values, 'p', threshold);
    const before = selected.mass - values[selected.indices.at(-1)];
    const x = (p) => track.left + p * track.width;
    const pin = group(
      ...[-1, 1].map((side) =>
        line([x(threshold), track.cy + side * 38], [x(threshold), track.cy + side * 65], {
          stroke: 'ink',
          width: 5,
        }),
      ),
    );
    const target = mono('0.90', { size: 34 }).moveTo([x(threshold), head.cy]);
    let start = 0;
    const words = values.flatMap((p, i) => {
      const center = x(start + p / 2);
      start += p;
      return p * track.width >= 145
        ? [label(WORDS[i], { size: 42, color: 'surface' }).moveTo([center, track.cy])]
        : [];
    });
    const input = group(
      place(label(name, { size: 39 }), head, 'left'),
      ...massStrip(track, values, COLORS, 80),
      ...words,
      pin,
      target,
    );
    const kept = rect(selected.mass * track.width, 90, {
      stroke: 'yellow',
      fill: null,
      width: 5,
    }).moveTo([x(selected.mass / 2), track.cy]);
    const previous = place(
      mono(`Through ${WORDS[selected.indices.at(-2)]}   ${before.toFixed(3)}`, { size: 36 }),
      result,
      'left',
    );
    const total = place(
      mono(`${selected.indices.length} words kept    ${selected.mass.toFixed(3)}`, {
        size: 37,
        color: 'yellow',
      }),
      result,
      'right',
    );
    return { input, previous, kept, total, selected };
  };
  const peaked = worksheet(WORKSHEET, upper, 'Peaked row');
  const flat = worksheet(FLAT, lower, 'Flatter row');
  assertEqual(peaked.selected.indices.length, 2, 'peaked nucleus count');
  assertEqual(flat.selected.indices.length, 4, 'flat nucleus count');
  const shares = place(
    label(
      `Draw from the kept words:    create ${peaked.selected.probabilities[0].toFixed(3)}    revoke ${peaked.selected.probabilities[1].toFixed(3)}`,
      { size: 38 },
    ),
    foot,
  );
  const question = place(
    label('Which word takes the flatter row past the line?', { size: 42 }),
    foot,
  );
  s.add(heading(c.title), peaked.input, peaked.previous, flat.input);
  c.show('peak-crossing', [peaked.kept, peaked.total], { after: true });
  c.show('normalize-kept', shares);
  c.swap('flat-input', shares, question);
  c.show('flat-input', flat.previous);
  c.hide('flat-crossing', question, { after: true });
  c.show('flat-crossing', [flat.kept, flat.total], { after: true });
}
