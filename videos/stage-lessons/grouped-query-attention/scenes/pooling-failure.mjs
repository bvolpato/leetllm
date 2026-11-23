import { dynamic, group, line, dot, tokens } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import {
  C,
  assertEqual,
  block,
  body,
  change,
  chapterModel,
  foot,
  mono,
  note,
  place,
  point,
  readout,
} from '../parts.mjs';
import { meanVisible } from '../../../films/grouped-query-attention/model.mjs';

export default function poolingFailure(s, c) {
  const title = heading(c.title);
  const [caption, samples, result] = body.rows([1, 4, 1], 'normal');
  const coordinates = [1, 3, 3, 5],
    pooled = meanVisible(coordinates);
  assertEqual(pooled, 3, 'pooled projection coordinate');
  const progress = s.value(0);
  s.add(
    title,
    place(note('One coordinate from each of four learned key projections'), caption, 'left'),
  );
  const lanes = samples.columns(4, 'normal'),
    center = samples.point('center')[0];
  const numbers = lanes.map((r, i) =>
    mono(String(coordinates[i]), { size: 54, color: C.key }).moveTo(point(r, 0.5, 0.95)),
  );
  const baseline = point(samples, 0.5, 0.81)[1],
    unit = samples.height * 0.13;
  s.add(
    dynamic(() =>
      group(
        ...lanes.flatMap((r, i) => {
          const x = r.point('center')[0] * (1 - progress.value) + center * progress.value;
          const n = coordinates[i] * (1 - progress.value) + pooled * progress.value;
          const tip = [x, baseline - n * unit];
          return [
            line([x, baseline], tip, { stroke: C.key, width: 12 }),
            dot(10, C.key).at(...tip),
          ];
        }),
      ),
    ),
  );
  c.show('samples', numbers);
  c.swap(
    'pool',
    numbers,
    mono(String(pooled), { size: 54, color: C.result }).moveTo(point(samples, 0.5, 0.95)),
    { after: true },
  );
  change(s, c, 'pool', progress, 1, true, 0.65);
  c.show(
    'pool',
    place(mono('(1 + 3 + 3 + 5) / 4 = ' + pooled, { size: 49, color: C.result }), result),
    { after: true },
  );

  const model = chapterModel(c.id),
    [inputs, results] = body.columns(2, 'loose');
  const [head, ...pairs] = inputs.rows([1, 3, 3], 'normal');
  const board = [place(note('Two visible positions · scalar query = 1'), head, 'left')];
  const strips = pairs.map((r, i) => {
    const [name, space] = r.rows([1, 3], 'normal');
    const strip = place(
      tokens(['p0', 'p1'], {
        size: 44,
        rows: { K: i ? [-1, 1] : [1, -1], V: i ? [0, 10] : [10, 0] },
      }),
      space,
    );
    board.push(place(note('Reader ' + i + ' · projected coordinates'), name, 'left'), strip);
    return strip;
  });
  const [axis, ...bars] = results.rows([1, 3, 3], 'normal');
  board.push(place(note('Output per reader · common scale from 0 to 10'), axis, 'left'));
  for (const [i, r] of bars.entries()) {
    const [label, track] = r.rows(2, 'tight');
    const cue = i ? 'new' : 'old',
      name = i ? 'Pooled model' : 'Original model';
    const out = i ? model.pooledOutput : model.oldOutput;
    const color = i ? C.result : C.query;
    const gauge = s.value(0),
      y = track.point('center')[1];
    board.push(
      block(track.width, 40, ...track.point('center'), 'grid'),
      dynamic(() => {
        const width = Math.max(0.01, (track.width * gauge.value) / 10);
        return block(width, 40, track.left + width / 2, y, color);
      }),
    );
    readout(
      s,
      c,
      label,
      [
        ['opposing', name],
        [cue, name + '    ' + Number(out.toFixed(3)), color, true],
      ],
      { size: 40 },
    );
    change(s, c, cue, gauge, out, true, 0.55);
  }
  c.swapAll('opposing', board, { keep: [title], lead: 0.2 });
  for (const strip of strips) {
    for (const [cue, id, n] of [
      ['keys', 'K', 0],
      ['values', 'V', 5],
    ]) {
      c.after(cue, () =>
        s.play(strip.setValue(id, 0, n), strip.setValue(id, 1, n), { duration: 0.55 }),
      );
    }
  }
  readout(
    s,
    c,
    foot,
    [
      ['old', 'Both readers put about 88% of their weight on the value 10.', 'ink', true],
      ['values', 'Both keys are zero. What can a mixture of 5 and 5 return?', C.result, true],
      ['new', 'Both readers now return 5.', C.result, true],
      ['init', 'Average compatible K/V projection slices and biases within each group.'],
      ['recipe', 'T5 conversion used 5% of the original pretraining steps.', 'ink', true],
      ['paper', 'T5-XXL mean task score     GQA-8: 47.1     MHA: 47.2', C.result, true],
      ['test', 'Check cache parity separately from held-out quality.'],
    ],
    { align: 'center', size: 36 },
  );
}
