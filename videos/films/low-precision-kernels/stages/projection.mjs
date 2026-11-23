import { experiment, projection } from '../model.mjs';
import { motion, settled } from '../timing.mjs';

const mixed = projection();
const isolated = projection(true);
const x = experiment.rows[1];
const decoded = experiment.block[1].map((entry) => entry.reconstructed);
const printable = (value) => String(value).replace('-', '−');

function product(value, weight, term, showProduct) {
  const factor = weight === 0 ? '0' : weight === 1 ? '1' : '−1/' + Math.abs(1 / weight);
  return printable(value) + ' × ' + factor + ' = ' + (showProduct ? printable(term) : '?');
}

export function drawProjection(ctx, scene, state, api) {
  const { C } = api;
  const opened = settled(state, 'projection-original-pair', 0);
  const first = settled(state, 'projection-first-error', 1);
  const second = settled(state, 'projection-second-error', 1);
  const totals = settled(state, 'projection-equal', 2);
  const change = motion(state, 'projection-one-hot', 2);
  const selector = change >= 1;
  const result = settled(state, 'projection-selected', 3);
  const convertedWeights = Math.floor(change * 32);
  const repeatWidth = 358;
  const left = 307;
  api.focus.target('projection-weights', () => {
    api.text(ctx, 'Weights', 140, 322, 35, C.ink);
    for (let repeat = 0; repeat < 4; repeat++) {
      const start = left + repeat * repeatWidth;
      api.line(ctx, start, 317, start + 319, 317, C.muted, 2);
      for (let j = 0; j < 8; j++) {
        const k = repeat * 8 + j;
        const px = start + 18 + j * 40;
        const turned = k < convertedWeights;
        const w = turned ? isolated.weights[k] : mixed.weights[k];
        const h = Math.max(4, Math.abs(w) * 58);
        const color = k === 3 || (!turned && (j === 3 || j === 7)) ? C.yellow : C.muted;
        api.rect(ctx, px - 10, w >= 0 ? 317 - h : 317, 20, h, color, undefined, 0);
      }
      api.text(ctx, repeat * 8 + '–' + (repeat * 8 + 7), start + 160, 400, 27, C.muted, 'center');
    }
    api.text(
      ctx,
      selector
        ? 'Index 3 has weight 1. All other weights are zero.'
        : 'One weight per position in the activation row',
      960,
      235,
      30,
      C.muted,
      'center',
    );
  });
  api.focus.target('projection-products', () => {
    const columns = [800, 1460];
    api.text(ctx, 'Position in first repeat', 145, 515, 30, C.muted);
    for (const [i, k] of [3, 7].entries()) {
      const col = columns[i];
      api.text(ctx, 'Index ' + k, col, 515, 38, C.yellow, 'center');
      const turned = k < convertedWeights;
      const trace = turned ? isolated : mixed;
      const original = product(
        x[k],
        trace.weights[k],
        trace.originalTerms[k],
        opened && (!turned || result),
      );
      api.text(ctx, original, col, 619, 45, C.blue, 'center');
      const known = i === 0 ? first : second;
      api.text(
        ctx,
        known
          ? product(
              decoded[k],
              trace.encodedWeights[k],
              trace.reconstructedTerms[k],
              !turned || result,
            )
          : '·',
        col,
        730,
        45,
        known ? C.cyan : C.muted,
        'center',
      );
      if (known && (!turned || result)) {
        const error = trace.reconstructedTerms[k] - trace.originalTerms[k];
        api.text(
          ctx,
          (error > 0 ? '+' : '') + printable(error),
          col,
          825,
          43,
          error ? C.pink : C.muted,
          'center',
        );
      }
    }
    for (const [label, y, color] of [
      ['Original', 619, C.blue],
      ['Reconstructed', 730, C.cyan],
      ['Change in product', 825, C.pink],
    ]) {
      api.text(ctx, label, 145, y, 34, color);
    }
  });
  api.focus.target('projection-output', () => {
    if (state.beat >= 1 && change === 0) {
      const delta = (k) => mixed.reconstructedTerms[k] - mixed.originalTerms[k];
      const net =
        delta(3) * motion(state, 'projection-first-error', 1) +
        delta(7) * motion(state, 'projection-second-error', 1);
      const zero = 1370;
      const unit = 720;
      const y = 890;
      api.text(ctx, 'Net change per repeat', 145, y + 10, 31, C.muted);
      api.line(ctx, zero + unit * delta(3), y, zero, y, C.muted, 3);
      for (const tick of [delta(3), 0]) {
        api.line(ctx, zero + unit * tick, y - 10, zero + unit * tick, y + 10, C.muted, 3);
        api.text(ctx, printable(tick), zero + unit * tick, y + 50, 26, C.muted, 'center');
      }
      api.circle(ctx, zero + unit * net, y - 12, 11, C.pink);
    }
    let label = 'Original dot product   =   ' + mixed.original.at(-1) + '   across 32 terms';
    if (second) label = mixed.original.at(-1) + ' + 4 × (−0.75 + 0.75)   =   ?';
    if (totals)
      label =
        'Full dot product     ' +
        mixed.original.at(-1) +
        ' original     /     ' +
        mixed.reconstructed.at(-1) +
        ' reconstructed';
    if (change > 0 && !selector) label = 'Replacing weights   ·   both activation rows stay fixed';
    if (selector)
      label = result
        ? 'Spike-only dot     ' +
          isolated.original.at(-1) +
          ' original     /     ' +
          isolated.reconstructed.at(-1) +
          ' reconstructed'
        : 'Spike-only dot     original = ?     /     reconstructed = ?';
    api.text(ctx, label, 960, 1017, 42, result ? C.cyan : C.ink, 'center');
  });
}

export default {
  id: 'projection',
  draw: drawProjection,
  cues: [
    'projection-original-pair',
    'projection-first-error',
    'projection-second-error',
    'projection-equal',
    'projection-one-hot',
    'projection-selected',
  ],
};
