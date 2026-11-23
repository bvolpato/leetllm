// Both requests share the credential component. Only the second has the urgency component.
import { beside, dot, dynamic, line, rect, row, text } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';
import { COLOR, code, dictionary, vec } from './parts.mjs';

export const credential = vec.scale(dictionary[0], code[0]);
export const urgency = vec.scale(dictionary[1], code[1]);

export function resetState(request, { blue = 1, pink = 1, error = 0 } = {}) {
  const components = [vec.scale(credential, blue), vec.scale(urgency, request * pink), [0, error]];
  return { components, activation: components.reduce(vec.add, [0, 0]) };
}

const pairText = (v) => `[${v.map((n) => n.toFixed(2)).join(', ')}]`;

// The two meters share a zero and a scale. Each colored length is that component's dot
// product with the readout. Outlined marks can retain the original score through an edit.
export function requestMeters({ read, weights, max, quantity, original }) {
  const [head, first, second, comparison, footer] = area.rows([1, 1.65, 1.65, 0.9, 1], 'normal');
  const [names, scale] = area.inset('normal', 'none').columns([4, 7], 'wide');
  const rail = scale.inset('loose', 'none');
  const x = (value) => rail.left + (value / max) * (rail.width - 112);
  const colors = [COLOR.first, COLOR.second, COLOR.residual];
  const parts = (i) => read(i).components.map((v) => vec.dot(v, weights));
  const total = (i) => vec.dot(read(i).activation, weights);
  const headText = label(quantity, { size: 52 }).at(area.cx, head.cy);
  const rows = [first, second].map((band, i) => {
    const y = band.cy;
    const prompt = text('Reset my password', { size: 46, anchor: 'left' });
    const now = text('now', { size: 46, color: COLOR.second, anchor: 'left' });
    const phrase = row(i ? [prompt, now] : [prompt], { gap: 11 });
    beside(phrase, [names.left, y - 22], 'right', 0);
    const input =
      original &&
      dynamic(() =>
        text(`x = ${pairText(read(i).activation)}`, {
          size: 35,
          font: 'mono',
          color: 'dim',
          anchor: 'left',
        }).at(names.left, y + 43),
      );
    const track = line([x(0), y], [x(max), y], { stroke: 'faint', width: 4 });
    const ticks = Array.from({ length: max + 1 }, (_, n) => [
      line([x(n), y + 19], [x(n), y + 29], { stroke: 'dim', width: 3 }),
      mono(String(n), { size: 28, color: 'dim' }).at(x(n), y + 52),
    ]).flat();
    const end = dynamic(() => [
      dot(10, COLOR.mark).at(x(total(i)), y),
      text(total(i).toFixed(2), { size: 44, color: COLOR.mark, font: 'mono', anchor: 'left' }).at(
        x(total(i)) + 24,
        y - 49,
      ),
    ]);
    const plain = dynamic(() =>
      line([x(0), y], [x(total(i)), y], { stroke: COLOR.mark, width: 12 }),
    );
    const stack = dynamic(() => {
      let left = x(0);
      return parts(i).flatMap((value, k) => {
        const width = x(value) - x(0);
        if (width < 0.1) return [];
        const bar = rect(width, 26, { fill: colors[k], stroke: null }).at(left + width / 2, y);
        left += width;
        return [bar];
      });
    });
    const previous =
      original &&
      line([x(original[i]), y - 24], [x(original[i]), y + 20], {
        stroke: 'ink',
        width: 4,
        dash: [6, 5],
      });
    return { base: [...phrase.nodes, track, ...ticks], plain, stack, end, input, previous };
  });
  const gap = dynamic(() => {
    const a = x(total(0));
    const b = x(total(1));
    const y = comparison.cy - 18;
    return [
      ...(Math.abs(a - b) > 1 ? [line([a, y], [b, y], { stroke: COLOR.mark, width: 4 })] : []),
      ...[a, b].map((p) => line([p, y - 12], [p, y + 12], { stroke: COLOR.mark, width: 4 })),
      text(`urgent − plain = ${(total(1) - total(0)).toFixed(2)}`, {
        size: 36,
        color: COLOR.mark,
        font: 'mono',
      }).at((a + b) / 2, y + 46),
    ];
  });
  const caption = (words, color = 'ink') =>
    label(words, { color, size: 44 }).at(area.cx, footer.cy);
  const legend = (includeError) => {
    const items = [
      label('credential', { size: 36, color: colors[0] }),
      label('urgency', { size: 36, color: colors[1] }),
    ];
    if (includeError) items.push(label('residual', { size: 36, color: colors[2] }));
    return beside(row(items, { gap: 'wide' }), [names.left, comparison.cy], 'right', 0).nodes;
  };
  return { headText, rows, gap, caption, legend, footer };
}
