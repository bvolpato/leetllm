import { column, moveTo, place, rect, row, text } from 'vizmatic/stage';
import { lossTrace } from '../../../films/softmax/arithmetic.mjs';
import { FRESH_LOGITS, GRAD, LOGITS, PROBS, TARGET } from '../../../films/softmax/fixtures.mjs';
import { completeModel } from '../../../films/softmax/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { WORDS, WORD_COLOR } from '../parts.mjs';
import { wordBudget } from '../word-budget.mjs';

export default function lossInputContract(s, c) {
  const model = completeModel();
  const [scores, modelBand, lossBand, readout] = area.rows([0.75, 1.65, 1.65, 1.3], 'normal');
  const [name1, track1] = modelBand.columns([1, 4], 'wide');
  const [name2, track2] = lossBand.columns([1, 4], 'wide');
  const input = LOGITS.map((z) => s.value(z));
  const original = wordBudget(s, track1, () => PROBS);
  const inside = wordBudget(
    s,
    track2,
    () =>
      lossTrace(
        input.map((z) => z.value),
        TARGET,
      ).probabilities,
  );
  for (const value of [...original.shown, ...inside.shown]) value.set(1);
  const title = heading(c.title);
  const sentence = place(
    row(
      [
        label('The dog slept', { size: 60 }),
        note('model scores'),
        mono(WORDS.map((word, i) => word + ' ' + LOGITS[i]).join('     ')),
      ],
      { gap: 'loose' },
    ),
    scores,
    'left',
  );
  const modelName = place(label('Model prediction'), name1, 'left');
  const lossName = place(label('Inside the loss'), name2, 'left');
  const [pathBox, costBox, gradBox] = readout.columns([2.6, 1.15, 1.5], 'wide');
  const call = (str) => place(mono(str, { size: 37 }), pathBox, 'left');
  const direct = call('F.cross_entropy(z, target)');
  const extra = call('p = z.softmax(dim=-1)\nF.cross_entropy(p, target)');
  const summary = (region, name, value, color) =>
    place(
      column([note(name), mono(value, { size: 56, color })], { gap: 'tight', align: 'left' }),
      region,
      'left',
    );
  const reports = (loss, grad) => [
    summary(costBox, 'Loss in nats', loss.toFixed(3), 'yellow'),
    summary(gradBox, 'Gradient on slept logit', '−' + Math.abs(grad).toFixed(3), 'green'),
  ];
  const rawResult = reports(lossTrace(LOGITS, TARGET).loss, GRAD[TARGET]);
  const extraResult = reports(model.second.loss, model.wrongGradient[TARGET]);
  const replayResult = reports(lossTrace(LOGITS, TARGET).loss, GRAD[TARGET]);
  const replayCall = call('F.cross_entropy(z, target)');
  const route = (values) => () =>
    s.play(...input.map((z, i) => z.to(values[i], { duration: 1.35 })));
  s.add(title, sentence, modelName, original.frame, original.body);
  c.show('loss-input-contract-0', [direct, lossName, inside.frame, inside.body]);
  c.show('api-direct-result', rawResult, { after: true });
  c.swap('loss-input-contract-1', [direct, rawResult], extra);
  c.on('api-extra-softmax', route(PROBS));
  c.show('api-extra-result', extraResult, { after: true });
  c.swap('api-remove-extra', [extra, extraResult], replayCall);
  c.on('api-remove-extra', route(LOGITS));
  c.show('api-restored', replayResult, { after: true });

  // Each number keeps its position and vocabulary identity through the change of axes.
  const [premise, cells, footer] = area.rows([1.2, 3.6, 1], 'normal');
  const shape = (message) => place(mono(message, { size: 49 }), premise, 'left');
  const shapeRows = shape('Logit shape  [B,T,V] = [1,2,3]     Target shape  [1,2]');
  const shapeColumns = shape('Logit shape  [B,V,T] = [1,3,2]     Target shape  [1,2]');
  const shapeFlat = shape('Logit shape  [B·T,V] = [2,3]       Target shape  [2]');
  const heads = ['bug', 'docs', 'today'];
  const prefixes = ['after bug', 'after bug docs'];
  const targetNames = ['docs', 'today'];
  const targetIds = [1, 2];
  const rawRows = [LOGITS, FRESH_LOGITS];
  const slots = (r, n, m) => r.rows(n, 'normal').map((band) => band.columns(m, 'wide'));
  const [matrix, key] = cells.columns([3.4, 1.4], 'loose');
  const rows = slots(matrix, 3, 4);
  const cols = slots(matrix, 4, 3);
  const makeText = (value, color, slot, size = 38) => place(text(value, { size, color }), slot);
  const rowHeaders = [
    ...heads.map((word, j) => makeText(word, WORD_COLOR[j], rows[0][j + 1])),
    ...prefixes.map((word, i) => makeText(word, 'ink', rows[i + 1][0], 33)),
  ];
  const colHeaders = [
    ...heads.map((word, j) => makeText(word, WORD_COLOR[j], cols[j + 1][0])),
    ...prefixes.map((word, i) => makeText(word, 'ink', cols[0][i + 1], 33)),
  ];
  const tiles = rawRows.flatMap((values, i) =>
    values.map((z, j) => {
      const style = {
        fill: 'surface',
        stroke: j === targetIds[i] ? 'yellow' : 'dim',
        width: j === targetIds[i] ? 4 : 1,
        radius: 8,
      };
      const faces = (slot) => [
        rect(140, 74, style).moveTo(slot.point('center')),
        mono(String(z), { size: 42, color: WORD_COLOR[j] }).moveTo(slot.point('center')),
      ];
      return {
        original: faces(rows[i + 1][j + 1]),
        transposed: j === targetIds[i] ? [] : faces(cols[j + 1][i + 1]),
        i,
        j,
      };
    }),
  );
  const labels = place(
    column(
      [
        note('Observed word  →  class index'),
        ...targetNames.map((word, i) =>
          mono(word + '  →  ' + targetIds[i], { size: 39, color: 'yellow' }),
        ),
      ],
      { gap: 'wide', align: 'left' },
    ),
    key,
    'left',
  );
  const kinds = place(
    row(
      [note('Hard target'), mono('long index'), note('Soft target'), mono('float distribution')],
      { gap: 'wide' },
    ),
    footer,
    'left',
  );
  const flatRule = place(label('Keep each score row beside its own next word.'), footer, 'left');
  c.swapAll('api-sequence', [shapeRows, rowHeaders, labels, tiles.map((t) => t.original)], {
    keep: [title],
  });
  c.show('api-target-types', kinds);
  const selected = tiles.filter((t) => t.j === targetIds[t.i]);
  function moveSelected(transpose) {
    s.play(
      ...selected.flatMap(({ original, i, j }) => {
        const slot = transpose ? cols[j + 1][i + 1] : rows[i + 1][j + 1];
        return original.map((node) => moveTo(node, slot.point('center'), { duration: 0.9 }));
      }),
    );
  }
  // The two selected cells stay in sight. The other four would cross each other during a transpose.
  const otherScores = tiles.filter((t) => t.j !== targetIds[t.i]).flatMap((t) => t.original);
  const transposedScores = tiles.flatMap((t) => t.transposed);
  c.hide('api-class-axis', [rowHeaders, shapeRows, kinds, otherScores]);
  c.on('api-class-axis', () => moveSelected(true), 0.35);
  c.show('api-transposed', [colHeaders, transposedScores]);
  c.show('api-transposed', shapeColumns, { after: true });
  c.hide('api-flatten', [colHeaders, shapeColumns, transposedScores]);
  c.on('api-flatten', () => moveSelected(false), 0.35);
  const flatHeaders = [
    ...heads.map((w, j) => makeText(w, WORD_COLOR[j], rows[0][j + 1])),
    ...prefixes.map((w, i) => makeText(w, 'ink', rows[i + 1][0], 33)),
  ];
  c.show('api-flat-result', [flatHeaders, otherScores]);
  c.show('api-flat-result', [shapeFlat, flatRule], { after: true });
}
