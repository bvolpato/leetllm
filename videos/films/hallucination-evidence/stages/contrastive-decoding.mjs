import { cadDistribution, dolaDistribution } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

const tokens = ['investigating', 'resolved', 'unknown'];
const final = [0.7, 0.2, 0.1];
const earlier = [
  [0.4, 0.3, 0.3],
  [0.2, 0.3, 0.5],
];
const withoutRecord = [0.1, 0.8, 0.1];

function divergence(p, q) {
  const mean = p.map((v, i) => (v + q[i]) / 2);
  return p.reduce(
    (sum, v, i) => sum + (v * Math.log(v / mean[i]) + q[i] * Math.log(q[i] / mean[i])) / 2,
    0,
  );
}
const distances = earlier.map((layer) => divergence(layer, final));
const selected = distances.indexOf(Math.max(...distances));
const layer = dolaDistribution(final, earlier[selected], 0.2);
const context = cadDistribution(final, withoutRecord, 1);

export function drawContrastiveDecoding(ctx, scene, state, api) {
  const { C, left, text, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const cad = state.beat >= 3;
  const selecting = state.beat === 0;
  const inputs = selecting ? [final, ...earlier] : [final, cad ? withoutRecord : earlier[selected]];
  const headers = selecting
    ? ['Final layer', 'Earlier 1', 'Earlier 2']
    : cad
      ? ['With record', 'Without record', 'Weight', 'New probability']
      : ['Final layer', 'Earlier ' + (selected + 1), 'Weight', 'New probability'];
  const cols = [515, 841, 1170, 1500];
  const gate = !cad && cue('apply-mask', 1) === 1;
  const ratios = (cad ? cue('context-weights', 4) : cue('layer-weights', 2)) === 1;
  const normalized = (cad ? cue('context-normalize', 4) : cue('layer-normalize', 2)) === 1;
  const result = cad ? context : layer;
  text(
    selecting
      ? 'DoLa   /   choose an earlier layer'
      : cad
        ? 'Context-aware decoding   /   same question and prefix'
        : 'DoLa   /   keep plausible final-layer choices',
    left,
    254,
    44,
    C.ink,
    'left',
    'serif',
  );
  text('Toy token', left, 357, 30, C.muted);
  headers.forEach((v, j) => text(v, cols[j], 357, 29, C.muted));
  api.line(ctx, left, 381, 1798, 381, C.muted, 2);

  function bar(x, y, probability, color) {
    api.line(ctx, x, y, x + 206, y, C.muted, 2);
    if (probability > 0) api.rect(ctx, x, y - 8, 206 * probability, 16, color, null, 2);
  }
  tokens.forEach((token, i) => {
    const y = 473 + i * 140;
    const masked = gate && layer.weights[i] === 0;
    text(token, left, y, 45, masked ? C.muted : C.ink);
    inputs.forEach((values, j) => {
      const color =
        selecting && j === selected + 1 && cue('choose-layer', 0) === 1
          ? C.green
          : j === 0
            ? C.blue
            : C.cyan;
      text(values[i].toFixed(2), cols[j], y, 40, color);
      bar(cols[j], y + 33, values[i], color);
      if (gate && j === 0) {
        const x = cols[j] + layer.cutoff * 206;
        api.line(ctx, x, y + 16, x, y + 54, C.yellow, 3);
      }
    });
    if (selecting) return;
    if (masked) text('masked', cols[2], y, 37, C.muted);
    else if (ratios)
      text(
        cad ? result.weights[i].toFixed(2) : i === 1 ? '2/3' : result.weights[i].toFixed(1),
        cols[2],
        y,
        42,
      );
    if (!masked && (state.beat === 2 || state.beat === 4)) {
      const numerator = final[i].toFixed(2) + (cad ? '²' : '');
      const denominator = (cad ? withoutRecord : earlier[selected])[i].toFixed(2);
      text(numerator + ' / ' + denominator, cols[2], y + 47, 28, C.muted);
    }
    if (normalized) {
      text(result.probabilities[i].toFixed(cad ? 3 : 2), cols[3], y, 42, C.green);
      bar(cols[3], y + 33, result.probabilities[i], C.green);
    }
  });
  if (selecting) {
    footer(
      cue('choose-layer', 0) === 1
        ? 'Jensen–Shannon divergence     ' +
            distances.map((v, i) => 'Earlier ' + (i + 1) + ' = ' + v.toFixed(3)).join('     /     ')
        : 'Which earlier layer differs most from the final distribution?',
    );
  } else if (cad) {
    if (cue('negative-weight', 3) === 1 && state.beat === 3)
      footer('Subtracting probabilities gives resolved a weight of 0.20 − 0.80 = −0.60.', C.yellow);
    else if (normalized)
      footer(
        'Total weight = 4.90 + 0.05 + 0.10 = ' +
          context.sum.toFixed(2) +
          '. Divide each weight by this total.',
        C.green,
      );
    else footer('At α = 1, weight = p(with record) × p(with record) / p(without record).');
  } else if (ratios) footer('Divide each surviving ratio by their sum, 3.5 + 2/3.');
  else
    footer(
      gate
        ? 'Cutoff = 0.20 × 0.70 = 0.14. The third choice falls below it.'
        : 'Keep a choice if its final probability reaches 0.20 × the largest.',
    );
}

export default {
  id: 'contrastive-decoding',
  draw: drawContrastiveDecoding,
  cues: [
    'layer-input',
    'choose-layer',
    'apply-mask',
    'layer-weights',
    'layer-normalize',
    'context-input',
    'negative-weight',
    'context-weights',
    'context-normalize',
  ],
};
