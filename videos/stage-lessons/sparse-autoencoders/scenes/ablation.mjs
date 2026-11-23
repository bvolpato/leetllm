import { assertEqual, dynamic, line, place, rect, text } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, SIDE, board } from '../parts.mjs';

const x = [1, 0.1];
const rebuilt = [1, 0];
const score = (v) => 100 * v[1];

export default function ablation(s, c) {
  const b = board({ x: [-0.2, 1.35], y: [-0.43, 0.52], xStep: 0.5, yStep: 0.25 });
  b.plane.numbers.opacity(0);
  const amount = s.value(1);
  const errorInCopy = s.value(1);
  const residual = x[1] - rebuilt[1];
  const current = (keep) => [amount.value * rebuilt[0], residual * keep];
  const clean = () => current(1);
  const copy = () => current(errorInCopy.value);
  assertEqual(Number((residual ** 2 / x.length).toFixed(3)), 0.005, 'activation MSE');
  assertEqual(
    [score(x), score([0, residual]), score(rebuilt), score([0, 0])],
    [10, 10, 0, 0],
    'scores before and after subtracting the horizontal feature',
  );

  const [header, originalBand, copyBand, foot] = SIDE.rows([1.15, 2, 2, 1.6], 'normal');
  const blue = b.arrowOf([0, 0], () => [amount.value, 0], COLOR.first);
  const green = b.segmentOf(() => [amount.value, 0], clean, COLOR.residual, { width: 10 });
  const upper = b.dotOf(clean, COLOR.residual, 10);
  const lower = b.ringOf(copy, COLOR.second, 13);
  const featureLabel = b.tagOf([0.45, -0.145], 'feature [1, 0]', COLOR.first, [0, 0], { size: 34 });
  const gapLabel = b.tagOf(x, 'residual [0, 0.1]', COLOR.residual, [12, -72], { size: 34 });
  const originalMark = b.ringOf(x, 'faint', 17);
  s.add(heading(c.title), b.plane, blue, upper, originalMark, featureLabel);
  s.add(
    ...[0, 0.5, 1].map((n) =>
      b.tagOf([n, -0.075], String(n), 'dim', [n === 0 ? -26 : 0, 0], { size: 30 }),
    ),
    ...[-0.25, 0.25, 0.5].map((n) =>
      b.tagOf([-0.06, n], String(n), 'dim', [0, 0], { size: 29, anchor: 'right' }),
    ),
    b.tagOf([1.25, -0.08], 'x₁', 'dim'),
    b.tagOf([0.12, 0.43], 'x₂', 'dim'),
  );

  const lane = (band, name, read, color) => {
    const v = dynamic(() =>
      text(`[${read()[0].toFixed(2)}, ${read()[1].toFixed(2)}]`, {
        size: 46,
        font: 'mono',
        anchor: 'left',
        color,
      }).at(band.left, band.cy),
    );
    const nameNode = label(name, { size: 38, anchor: 'left' }).at(band.left, band.top + 29);
    const y = band.bottom - 18;
    const width = band.width - 180;
    const gauge = dynamic(() => {
      const value = score(read());
      const fill = (width * value) / score(x);
      return [
        line([band.left, y], [band.left + width, y], { width: 4, stroke: 'faint' }),
        ...(fill > 0.1
          ? [rect(fill, 19, { fill: color, stroke: null }).at(band.left + fill / 2, y)]
          : []),
        text(`score ${Math.round(value)}`, { size: 36, font: 'mono', anchor: 'right', color }).at(
          band.right,
          y,
        ),
      ];
    });
    return { v, nameNode, gauge };
  };
  const original = lane(originalBand, 'From the original', clean, COLOR.residual);
  const reconstruction = lane(copyBand, 'From the reconstruction', copy, COLOR.second);
  const uneditedCopy = label('Copy of the original', { size: 38, anchor: 'left' }).at(
    copyBand.left,
    copyBand.top + 29,
  );
  s.add(original.nameNode, original.v);
  const formula = place(mono('score = 100 × x₂', { size: 49 }), header);
  c.show('abl-gain', [formula, original.gauge]);
  c.show('abl-residual', [green, gapLabel]);
  c.show('abl-copy', [lower, uneditedCopy, reconstruction.v, reconstruction.gauge]);
  c.swap('abl-miss', uneditedCopy, reconstruction.nameNode);
  c.on('abl-miss', () => s.play(errorInCopy.to(0, { duration: 1.0 })));
  const mse = place(mono('MSE = 0.10² / 2 = 0.005', { size: 35 }), foot, 'top');
  const before = place(note('Scores before feature removal'), foot, 'bottom');
  c.show('abl-mse', [mse, before]);

  const subtract = place(
    mono('Subtract [1, 0] from each', { size: 37, color: COLOR.first }),
    foot,
    'top',
  );
  const ask = place(
    label('Which score will change?', { color: COLOR.mark, size: 42 }),
    foot,
    'bottom',
  );
  c.swap('abl-predict', [mse, before], [subtract, ask]);
  c.hide('abl-apply', [gapLabel, featureLabel, ask]);
  c.on('abl-apply', () => s.play(amount.to(0, { duration: 1.65 })));
  const effects = [
    place(mono('10 → 10', { size: 40, color: COLOR.residual }), originalBand, 'right'),
    place(mono('0 → 0', { size: 40, color: COLOR.second }), copyBand, 'right'),
  ];
  c.show('abl-results', effects[0], { after: true });
  c.show('abl-copy-result', effects[1], { after: true });
  const verdict = place(label('Feature removal changes neither score.', { size: 34 }), foot, 'top');
  c.swap('abl-verdict', subtract, verdict);
}
