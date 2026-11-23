// Scene `coverage`: an exact rebuild can hide a feature, and a recovered share follows its baseline.
//
// The picture: a dot made of a general arrow and a specific part. One diagonal arrow takes the
// place of both: the rebuild is exact, and the shadow of the dot on the detector of the general
// feature is at zero. Then a ruler of losses: the damage of the rebuild keeps its length, the
// baseline slides, and the recovered share changes. At the end the first example comes back, and
// an edit moves one readout while a control stays.
import { assertEqual, column, fade, indicate, place, steps, tex } from 'vizmatic/stage';
import { coverageFixture } from '../../../films/sparse-autoencoders/model.mjs';
import { chipRow, heading, label, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  SIDE,
  board,
  code,
  lossRuler,
  readoutBars,
  rebuild,
  target,
  vec,
} from '../parts.mjs';

/** The losses of the lesson: the clean model, the model with the rebuilt activation, and two ablation baselines. */
const LOSS = { clean: 2, rebuilt: 2.4, ablated: 6, later: 10, max: 11 };
/** The detector of the general feature reads x1 − x2. */
const DETECTOR = [1, -1];

export default function coverage(s, c) {
  const b = board();
  const fixture = coverageFixture();
  assertEqual(fixture.general, 0, 'the detector of the general feature is silent');
  assertEqual(
    fixture.reconstructed.map((value) => Number(value.toFixed(9))),
    fixture.activation,
    'the combined direction alone rebuilds the activation',
  );
  const [formulaBand, barsBand, noteBand] = SIDE.rows([2, 5, 2], 'normal');
  s.add(heading(c.title));
  c.take(b.plane);

  // Beat 0. A general feature and a specific part. Then one combined column takes both.
  const x = fixture.activation;
  const general = [x[0], 0];
  const absorbed = s.value(0);
  const point = b.dotOf(x, COLOR.activation);
  const generalArrow = b.arrowOf([0, 0], general, COLOR.first);
  const specificArrow = b.arrowOf(general, x, COLOR.second);
  const combinedArrow = b.arrowOf(
    [0, 0],
    () => vec.scale(fixture.combinedDirection, fixture.combined * absorbed.value),
    COLOR.other,
    { width: 9 },
  );
  const generalTag = b.tagOf([0.5, 0], 'bird', COLOR.first, [0, -40], {
    font: undefined,
    size: 36,
  });
  const specificTag = b.tagOf([1, 0.5], 'sparrow', COLOR.second, [26, 0], {
    font: undefined,
    size: 36,
    anchor: 'left',
  });
  s.add(point, generalArrow, specificArrow);
  c.show('cov-absorb', [generalTag, specificTag]);
  const entries = readoutBars(
    barsBand.rows([3, 2], 'none')[0],
    [
      { name: 'bird detector', color: COLOR.first, read: () => fixture.general },
      { name: 'sparrow slot', color: COLOR.other, read: () => fixture.combined * absorbed.value },
    ],
    2,
  );
  c.show('cov-combined', [combinedArrow, entries.names[1], entries.bars]);
  c.on('cov-combined', () => {
    s.play(absorbed.to(1, { duration: 1.6 }));
    s.play(
      ...[generalArrow, specificArrow, generalTag, specificTag].map((node) => fade(node, 0.3)),
      { duration: 0.5 },
    );
  });
  const exact = b.ringOf(x, COLOR.activation, 24);
  const exactNote = place(label('rebuilt exactly, with 1 active entry'), noteBand, 'top');
  c.show('coverage-b1-1', [exact, exactNote], { after: true });
  // The detector of the general feature: the shadow of the dot on its line is at zero.
  const detector = [
    b.rulerOf(DETECTOR, COLOR.first, -1.3, 1.3, { width: 4, dash: [14, 10] }),
    b.shadowOf(x, DETECTOR, COLOR.wrong, 11),
  ];
  const silent = place(tex('z_g = \\max(0,\\ x_1 - x_2) = 0', { size: 46 }), formulaBand);
  silent.part('= 0').forEach((glyph) => glyph.color(COLOR.wrong));
  c.show('coverage-general-silent', [...detector, entries.names[0], silent]);
  const recall = place(note('A sparrow the bird detector misses'), noteBand, 'bottom');
  c.show('cov-recall', recall);

  // Beat 1. The ruler of losses: the damage stays, the baseline slides, the share changes.
  const ruler = lossRuler(s, barsBand, LOSS);
  assertEqual(
    [Math.round(ruler.recovered() * 100), Math.round((1 - 0.4 / (LOSS.later - LOSS.clean)) * 100)],
    [90, 95],
    'the two shares',
  );
  c.swap(
    'cov-loss',
    [silent, entries.names, entries.bars, exactNote, recall, ...detector],
    [ruler.axis, ruler.parts, ruler.share],
  );
  c.on('coverage-b2-1', () => s.play(ruler.baseline.to(LOSS.later, { duration: 2.2 })));
  c.show('cov-same', ruler.damage);
  const raw = place(label('keep the raw losses in view', { color: COLOR.mark }), formulaBand);
  c.show('coverage-b2-2', raw);
  const also = place(
    chipRow(['support counts', 'counterexamples', 'matched controls', 'edits at the hook'], {
      maxWidth: noteBand.width,
    }),
    noteBand,
    'left',
  );
  c.show('cov-combine', also);

  // Beat 2. The first example again: a rebuild is one stage, and an edit with a control is the next.
  const a1 = s.value(code[0]);
  const first = rebuild(b, () => [a1.value, code[1]]);
  const editedPoint = b.dotOf(first.tip, COLOR.activation);
  const firstPlace = b.ringOf(target, 'faint', 15);
  const stages = place(
    steps(['rebuild', 'predict', 'edit', 'check the controls'], {
      direction: 'column',
      width: 420,
      size: 34,
      current: 0,
    }),
    barsBand,
  );
  const predicted = b.shadowOf(first.tip, [1, 0], COLOR.mark, 11);
  const control = b.shadowOf(first.tip, [0, 1], COLOR.first, 11);
  const predictedNote = place(
    label('Horizontal   2.30 → 0.80', { color: COLOR.mark }),
    noteBand,
    'top',
  );
  const controlNote = place(
    label('Vertical   0.60 → 0.60', { color: COLOR.first, size: 36 }),
    noteBand,
    'bottom',
  );
  c.swap(
    'cov-separate',
    [
      point,
      generalArrow,
      specificArrow,
      combinedArrow,
      generalTag,
      specificTag,
      exact,
      ruler.axis,
      ruler.parts,
      ruler.share,
      ruler.damage,
      raw,
      also,
    ],
    [firstPlace, first.blue, first.pink, editedPoint],
  );
  c.show('cov-stage', stages);
  c.on('cov-edit', () => s.play(stages.go(2)));
  c.show('cov-edit', [predicted, control]);
  c.on('coverage-b3-1', () => s.play(a1.to(0, { duration: 1.4 })));
  c.show('coverage-b3-1', predictedNote, { after: true });
  c.on('cov-controls', () => s.play(stages.go(3)), 0.5);
  c.show('cov-controls', controlNote);
  // The next scene shows a model and no plane, so the plane leaves with this scene.
}
