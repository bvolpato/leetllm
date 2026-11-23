import { mean, predict, totalCost } from '../arithmetic.mjs';
import { forest, tree, validationRows } from '../fixtures.mjs';
import { fittedStump, policyCosts, stumpBill, validationAfterBoosting } from '../model.mjs';
import { drawConstructionText as label } from '../defaults.mjs';

const strict = stumpBill(0.5);
const wide = stumpBill(0.2);
const shuffled = validationRows.map((r, i) => [
  validationRows[validationRows.length - 1 - i][0],
  r[1],
  r[2],
]);
const shuffledBill = policyCosts(fittedStump, 0.5, shuffled);
const forestCost = validationRows.reduce((bill, row) => {
  const review = mean(forest.map((member) => predict(member, row))) >= 0.2;
  return bill + (review ? (row[2] ? 0 : 18) : row[2] ? 120 : 0);
}, 0);

function comparison(ctx, api) {
  const { C } = api;
  const costs = [
    wide.total,
    totalCost(policyCosts(tree)),
    forestCost,
    validationAfterBoosting(4).cost,
    36,
  ];
  label(ctx, api, 'Eight validation requests · $18 per extra review · $120 per miss', 960, 295, 36);
  api.teaching.bars({
    x: 210,
    y: 425,
    width: 1490,
    height: 390,
    values: costs,
    labels: ['Stump .20', 'Deep tree .50', 'Forest .20', 'Boost .50', 'Logistic .20'],
    colors: [C.blue, C.blue, C.blue, C.blue, C.cyan],
    max: 260,
    showValues: true,
    format: (v) => '$' + v,
    fontSize: 33,
  });
  label(ctx, api, 'Thresholds are printed under the models.', 960, 968, 32, C.muted);
}

export function drawEvaluate(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  if (beat === 3) return comparison(ctx, api);
  if (beat >= 4) {
    const amount = api.focus.progress('permute-ambiguity', api.phase(p, 0.2, 0.52));
    label(ctx, api, 'Stump at 0.50 · reverse only the ambiguity column', 960, 280, 38);
    label(ctx, api, 'Request', 104, 395, 32, C.muted, 'left');
    label(ctx, api, 'Ambiguity', 104, 535, 32, C.muted, 'left');
    label(ctx, api, 'Actual label', 104, 690, 32, C.muted, 'left');
    label(ctx, api, 'Error cost', 104, 813, 32, C.muted, 'left');
    const x = (i) => 525 + 175 * i;
    validationRows.forEach((r, i) => {
      label(ctx, api, 'V' + (i + 1), x(i), 395, 40);
      label(ctx, api, r[2] ? 'Review' : 'Routine', x(i), 690, 29, r[2] ? C.pink : C.blue);
      // Mirrored pairs cross in separate lanes and converge only in the new columns.
      const to = validationRows.length - 1 - i;
      const lift = (i - 3.5) * 27 * Math.sin(Math.PI * amount);
      api.focus.target('permuted-feature', () =>
        label(ctx, api, r[0].toFixed(1), api.lerp(x(i), x(to), amount), 535 + lift, 35, C.yellow),
      );
      const entry = amount === 1 ? shuffledBill[i] : strict.entries[i];
      if (amount === 0 || amount === 1) label(ctx, api, '$' + entry.cost, x(i), 813, 37);
    });
    label(
      ctx,
      api,
      amount === 1
        ? '$' + strict.total + ' → $' + totalCost(shuffledBill) + '     One permutation'
        : 'Original bill   $' + strict.total,
      960,
      990,
      46,
      C.yellow,
    );
    return;
  }
  const misses =
    beat > 1 ||
    (beat === 1 && api.focus.progress('validation-misses', api.phase(p, 0, 0.14)) === 1);
  const strictTotal =
    beat > 1 || (beat === 1 && api.focus.progress('strict-total', api.phase(p, 0.22, 0.46)) === 1);
  const lower =
    beat > 1 ||
    (beat === 1 && api.focus.progress('lower-threshold', api.phase(p, 0.52, 0.76)) === 1);
  const extras = beat === 2 && api.focus.progress('extra-reviews', api.phase(p, 0.23, 0.5)) === 1;
  const x = (i) => 510 + 179 * i;
  label(ctx, api, 'Eight later requests · score ≥ cutoff goes to review', 960, 252, 38);
  label(ctx, api, 'Request', 110, 366, 33, C.muted, 'left');
  label(ctx, api, 'Actual label', 110, 440, 33, C.muted, 'left');
  label(ctx, api, 'Leaf score', 110, 512, 33, C.muted, 'left');
  strict.entries.forEach((e, i) => {
    label(ctx, api, e.id, x(i), 366, 40);
    label(ctx, api, e.row[2] ? 'Review' : 'Routine', x(i), 440, 31, e.row[2] ? C.pink : C.blue);
    label(ctx, api, e.score.toFixed(2), x(i), 512, 38);
  });
  api.line(ctx, 110, 560, 1820, 560, C.muted, 2);
  [strict, wide].forEach((bill, row) => {
    if (
      row &&
      !lower &&
      (beat === 0 || api.focus.progress('lower-threshold', api.phase(p, 0.52, 0.76)) === 0)
    )
      return;
    const y = 635 + row * 163;
    const visible = !row || lower;
    const priced = row ? extras : misses;
    api.focus.target(row ? 'wide-bill' : 'strict-bill', () => {
      label(ctx, api, 'Cutoff ' + bill.threshold.toFixed(2), 110, y, 37, C.yellow, 'left');
      if (!visible) return;
      bill.entries.forEach((e, i) => {
        label(ctx, api, e.review ? 'Queue' : 'Auto', x(i), y, 34, C.ink);
        if (priced && e.cost) label(ctx, api, '+$' + e.cost, x(i), y + 55, 35, C.yellow);
      });
      if (row ? extras : strictTotal)
        label(ctx, api, '$' + bill.total + ' total', 110, y + 55, 32, C.ink, 'left');
    });
  });
  label(
    ctx,
    api,
    beat === 0
      ? 'Which required reviews went through automatically?'
      : extras
        ? 'Same F1 = ⅔       ·       Queue load: 2 of 8 versus 8 of 8'
        : '$18 per extra review       ·       $120 per missed review',
    960,
    987,
    37,
    C.ink,
  );
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: [
    'validation-misses',
    'strict-total',
    'lower-threshold',
    'extra-reviews',
    'permute-ambiguity',
  ],
};
