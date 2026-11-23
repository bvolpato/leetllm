import { dynamic, group } from 'vizmatic/stage';
import {
  C,
  assertEqual,
  block,
  body,
  change,
  chapterModel,
  foot,
  measure,
  note,
  place,
  point,
  readout,
  start,
} from '../parts.mjs';
export default function latentStore(s, c) {
  start(s, 'What fits in one latent cache entry?');
  const content = 512,
    position = 64,
    model = chapterModel(c.id);
  assertEqual(content + position, model.latentNumbers, 'stored coordinates');
  const [entry, rows] = body.columns(2, 'loose'),
    [head, numbers, strip, total] = entry.rows([1, 2, 2, 2], 'normal');
  s.add(place(note('One token · one layer'), head, 'left'));
  const a = s.value(0),
    b = s.value(0),
    unit = strip.width / model.latentNumbers,
    y = strip.point('center')[1];
  s.add(
    block(strip.width, 54, ...strip.point('center'), 'grid'),
    dynamic(() =>
      group(
        block(Math.max(0.01, a.value * unit), 54, strip.left + (a.value * unit) / 2, y, C.key),
        block(
          Math.max(0.01, b.value * unit),
          54,
          strip.left + (content + b.value / 2) * unit,
          y,
          C.position,
        ),
      ),
    ),
  );
  readout(
    s,
    c,
    numbers,
    [
      [null, 'Content latent + positional key'],
      ['pos', content + ' content    +    ' + position + ' position', C.position, true],
    ],
    { size: 38 },
  );
  change(s, c, 'latent', a, content, true);
  change(s, c, 'pos', b, position, true);
  readout(s, c, total, [['sum', model.latentNumbers + ' stored numbers', C.result, true]], {
    size: 45,
  });
  const [title, ...bands] = rows.rows([1, 2, 2, 2, 2], 'tight');
  s.add(place(note('Explicit K/V · numbers per position'), title, 'left'));
  const heads = [128, 8, 4, 1],
    width = 128;
  bands.forEach((r, i) => {
    const n = 2 * heads[i] * width,
      name = ['MHA', 'GQA-8', 'GQA-4', 'MQA'][i],
      cue = ['mha', 'gqa8', 'gqa4', 'mqa'][i];
    const [txt, bar] = r.rows(2, 'tight');
    readout(
      s,
      c,
      txt,
      [
        [null, name],
        [cue, name + '     ' + n.toLocaleString('en-US'), 'ink', true],
      ],
      { size: 33 },
    );
    change(
      s,
      c,
      cue,
      measure(s, bar, { max: 2 * heads[0] * width, height: 25, color: C.key }),
      n,
      true,
    );
  });
  readout(
    s,
    c,
    foot,
    [
      ['queries', '128 query heads share one learned content latent.'],
      ['ratio', 'MHA / MLA ≈ 56.9     ·     GQA-8 / MLA ≈ 3.56', 'ink', true],
      ['scale', 'Attention scale = 1 / √(128 + 64) = 1 / √192', 'ink', true],
      ['temp', 'Profile retained state and temporary expansions separately.'],
    ],
    { align: 'center', size: 36 },
  );
}
