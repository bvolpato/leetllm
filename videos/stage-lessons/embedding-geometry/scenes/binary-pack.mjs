import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { arrayCells, row, column, place, boxOf, to, indicate, assertEqual } from 'vizmatic/stage';
import { signCode } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function binaryPack(s, c) {
  const vectors = [
    [0.3, -0.1, 0.8, -0.4],
    [0.5, -0.2, 0.7, 0.1],
  ];
  const codes = vectors.map(signCode),
    xor = codes[0] ^ codes[1];
  assertEqual(xor, 8, 'only dimension three differs');
  const [inputs, bytes, foot] = area.rows([3.3, 4.2, 0.5], 'wide');
  const inputColumns = inputs.columns(2, 'loose');
  const inputSlots = inputColumns.map((r) => r.rows([2, 1], 'normal'));
  const strips = vectors.map((v, i) =>
    place(
      row(
        [
          label(['A', 'B'][i], { color: ['green', 'pink'][i] }),
          arrayCells(v, { cell: 100, size: 40, indices: true, indexSize: 34 }),
        ],
        { gap: 'wide' },
      ),
      inputSlots[i][0],
    ),
  );
  const signs = vectors.map((v, i) =>
    place(
      arrayCells(
        v.map((x) => (x > 0 ? 1 : 0)),
        { cell: 70, size: 38, indices: false, color: ['green', 'pink'][i] },
      ),
      inputSlots[i][1],
    ),
  );
  const byteSlots = bytes.rows([0.6, 1, 1, 1], 'normal');
  const byteRegions = byteSlots.slice(1).map((r) => r.columns([1, 4], 'wide'));
  const byteLabels = ['A byte', 'B byte', 'XOR'].map((x, i) =>
    place(label(x, { size: 36, color: i === 2 ? 'yellow' : 'dim' }), byteRegions[i][0], 'right'),
  );
  const arrays = [...codes, xor].map((v, i) =>
    place(
      arrayCells(
        Array.from({ length: 8 }, (_, j) => (v >> (7 - j)) & 1),
        { cell: 96, size: 38, indices: false },
      ),
      byteRegions[i][1],
    ),
  );
  const skeleton = arrays.map((b) =>
    arrayCells(Array(8).fill(''), { cell: 96, size: 38, indices: false, color: 'dim' }).moveTo(
      boxOf(b).point('center'),
    ),
  );
  const bitPositions = Array.from({ length: 8 }, (_, j) =>
    note('bit ' + (7 - j)).moveTo([boxOf(arrays[0].cell(j)).cx, byteSlots[0].cy]),
  );
  const travelers = signs.map((strip, i) =>
    vectors[i].map((v, j) =>
      mono(String(v > 0 ? 1 : 0), { size: 38, color: ['green', 'pink'][i] }).moveTo(
        boxOf(strip.cell(j)).point('center'),
      ),
    ),
  );
  const answer = place(
    mono('popcount = ' + xor.toString(2).replace(/0/g, '').length, { color: 'yellow' }),
    foot,
  );
  s.add(heading(c.title), strips, skeleton, bitPositions, byteLabels);
  c.show('signs', signs, { after: true });
  c.hide('pack', signs);
  c.on(
    'pack',
    () => {
      for (let j = 0; j < 4; j++) {
        const active = travelers.map((bits) => bits[j]);
        s.add(active);
        s.play(
          ...travelers.map((bits, i) =>
            to(bits[j], (x) => x.moveTo(boxOf(arrays[i].cell(7 - j)).point('center')), {
              duration: 0.4,
            }),
          ),
        );
      }
    },
    0.8,
  );
  const hex = place(
    mono(
      'A = 0x' +
        codes[0].toString(16).padStart(2, '0') +
        '     B = 0x' +
        codes[1].toString(16).padStart(2, '0'),
      { size: 36 },
    ),
    foot,
  );
  c.swap('packed', [skeleton.slice(0, 2), ...travelers], arrays.slice(0, 2));
  c.show('packed', hex, { after: true });
  c.swap('xor', skeleton[2], arrays[2], { after: true });
  c.swap('count', hex, answer, { after: true });
  c.on('padding', () =>
    s.play(...arrays.slice(0, 2).flatMap((b) => [0, 1, 2, 3].map((i) => b.mark(i, 'dim'))), {
      duration: 1,
    }),
  );
}
