import { directed, mix } from '../construction.mjs';
import { sum } from '../arithmetic.mjs';
import { drawAddedCell as cell, drawAddedText as text } from '../defaults.mjs';

const parameters = 7e9;
const capacityGB = 24;
const x = (gb) => 200 + gb * 13;

function tokenMean(ctx, state, api) {
  const { C, focus } = api;
  const losses = [[1], [3, 3, 3]];
  const subtotals = losses.map(sum);
  const count = losses.flat().length;
  const first = directed(state, 'micro-first', 4);
  const second = directed(state, 'micro-second', 4, 0.55, 0.8);
  const collect = directed(state, 'micro-denominator', 5, 0.03, 0.22);
  const add = directed(state, 'micro-sums', 5, 0.22, 0.43);
  const divide = directed(state, 'micro-divide', 5, 0.44, 0.58);
  const answer = directed(state, 'micro-mean', 5, 0.62, 0.76);
  const left = 335, step = 278, width = 238;
  text(ctx, api, 'Mean loss per valid token', 155, 280, 41, C.ink);
  focus.target('loss-tokens', () => {
    for (let group = 0; group < losses.length; group++) {
      const start = group === 0 ? left : left + step;
      const end = start + step * (losses[group].length - 1) + width;
      const color = group === 0 ? C.blue : C.cyan;
      text(ctx, api, 'Ticket ' + (group === 0 ? 'A' : 'B'), (start + end) / 2, 390, 34, color, 'center');
      api.line(ctx, start, 416, end, 416, color, 4);
      const arrived = (group === 0 ? first : second) * losses[group].length;
      losses[group].forEach((loss, i) => {
        const show = arrived >= i + 1;
        cell(ctx, api, show ? 'loss  ' + loss : '·', start + i * step, 455, width, 112,
          show ? color : C.muted, 40);
      });
    }
    if (collect > 0) {
      const end = left + (count - 1) * step + width;
      api.line(ctx, left, 591, left, 626, C.yellow, 4);
      api.line(ctx, left, 626, mix(left, end, collect), 626, C.yellow, 4);
      if (collect === 1) {
        api.line(ctx, end, 591, end, 626, C.yellow, 4);
        text(ctx, api, '4 valid tokens', (left + end) / 2, 681, 33, C.yellow, 'center');
      }
    }
  });
  focus.target('loss-sums', () => {
    const centers = [left + width / 2, left + 2 * step + width / 2];
    if (state.beat < 5) return;
    subtotals.forEach((subtotal, i) => {
      const label = add * 2 < i + 1 ? 'sum  ?'
        : divide === 1 ? subtotal + ' / ' + count : 'sum  ' + subtotal;
      text(ctx, api, label, centers[i], 780, 42, i === 0 ? C.blue : C.cyan, 'center', true);
    });
  });
  focus.target('combined-loss', () => {
    const expression = divide === 1 ? subtotals.map(s => s + '/' + count).join(' + ') : 'Combined mean';
    text(ctx, api, expression + (answer === 1 ? ' = ' + sum(subtotals) / count : ' = ?'),
      960, 934, 54, answer === 1 ? C.green : C.ink, 'center');
  });
}

function weightedTickets(ctx, state, api) {
  const { C, focus } = api;
  const scored = directed(state, 'equal-scores', 6, 0.16, 0.3) === 1;
  const baseLoss = directed(state, 'base-loss', 6, 0.32, 0.48) === 1;
  const weights = directed(state, 'micro-weight-units', 6, 0.52, 0.76);
  const summed = directed(state, 'weighted-sums', 7, 0.04, 0.19) === 1;
  const ignored = directed(state, 'ignore-target', 8, 0.25, 0.52) === 1;
  const counted = ignored ? [0, 0] : [0, 1];
  const fullWeight = sum(counted);
  const lossSums = counted.map(w => w * Math.log(2));
  const countWeight = ignored ? directed(state, 'no-target-weight', 9, 0.15, 0.38)
    : directed(state, 'weighted-total', 7, 0.33, 0.51);
  const localDivision = directed(state, 'local-mean', 7, 0.2, 0.31);
  const backward = fullWeight > 0 && directed(state, 'weighted-backward', 7, 0.55, 0.74) === 1;
  const skip = fullWeight === 0 && directed(state, 'skip-update', 9, 0.54, 0.7) === 1;

  text(ctx, api, 'One target per ticket', 160, 273, 42, C.ink);
  focus.target('raw-loss', () =>
    text(ctx, api, baseLoss ? 'Before weighting     −ln(½) = ln(2)' : 'Before weighting',
      160, 351, 34, C.ink));
  const xs = [240, 570, 905, 1230, 1605];
  ['Ticket', 'Target', 'Logits', 'Counted weight', 'Weighted loss sum'].forEach((label, i) =>
    text(ctx, api, label, xs[i], 459, 31, C.muted, 'center'));
  focus.target('ticket-scores', () => {
    for (const [i, name] of ['A', 'B'].entries()) {
      const y = 554 + 111 * i;
      const color = i === 0 ? C.blue : C.cyan;
      text(ctx, api, name, xs[0], y, 49, color, 'center');
      text(ctx, api, scored ? '[0, 0]' : '·', xs[2], y, 40, color, 'center', true);
    }
  });
  focus.target('target-weights', () => {
    for (let i = 0; i < counted.length; i++) {
      const y = 554 + 111 * i;
      const off = i === 1 && ignored;
      const color = off ? C.muted : i === 0 ? C.blue : C.cyan;
      text(ctx, api, off ? 'ignored' : i, xs[1], y, 40, color, 'center', true);
      text(ctx, api, off ? 'excluded' : weights * 2 >= i + 1 ? counted[i] : '·',
        xs[3], y, 40, color, 'center', true);
    }
  });
  focus.target('weighted-losses', () => {
    lossSums.forEach((value, i) => text(ctx, api, summed ? (value === 0 ? '0' : 'ln(2)') : '?',
      xs[4], 554 + 111 * i, 42, i === 0 ? C.blue : C.cyan, 'center', true));
  });
  api.line(ctx, 160, 722, 1760, 722, C.muted, 2);
  focus.target('full-weight', () => {
    text(ctx, api, 'Full batch weight', 180, 813, 39, C.ink);
    let tally = '?';
    if (countWeight > 0) tally = ignored ? '0' : counted[0] + ' + …';
    if (!ignored && countWeight >= 0.5) tally = counted.join(' + ');
    if (!ignored && countWeight === 1) tally += ' = ' + fullWeight;
    text(ctx, api, tally, 685, 813, 46, C.yellow, 'center', true);
  });
  focus.target('ticket-a-division', () => {
    if (ignored || localDivision === 0) return;
    text(ctx, api, backward ? 'A for backward' : 'A alone', 985, 813, 37, C.ink);
    const divisor = backward ? fullWeight : counted[0];
    const fraction = lossSums[0] + ' / ' + divisor;
    const result = localDivision < 1 ? '…' : backward ? fraction + ' = 0' : fraction;
    text(ctx, api, result, 1675, 813, 43, backward ? C.blue : C.pink, 'right', true);
  });
  focus.target('loss-update', () => {
    if (backward) {
      const mean = sum(lossSums) / fullWeight;
      text(ctx, api, '(loss_sum / full_weight).backward()', 180, 944, 37, C.ink, 'left', true);
      text(ctx, api, 'Mean loss ≈ ' + mean.toFixed(3), 1710, 944, 44, C.green, 'right');
    } else if (skip) {
      text(ctx, api, 'Mean undefined', 180, 944, 41, C.ink);
      text(ctx, api, 'Skip optimizer step', 1710, 944, 47, C.pink, 'right');
    } else text(ctx, api, 'Update   ?', 180, 944, 39, C.muted);
  });
}

export function drawLargeModelBudget(ctx, scene, state, api) {
  if (state.beat >= 6) return weightedTickets(ctx, state, api);
  if (state.beat >= 4) return tokenMean(ctx, state, api);
  const { C, focus } = api;
  const weights = directed(state, 'large-weights', 0);
  const gradients = directed(state, 'large-gradients', 1);
  const moments = directed(state, 'large-moments', 1);
  const fp32 = state.beat === 2 ? directed(state, 'large-fp32', 2) : 0;
  const shrink = directed(state, 'large-fixed-floor', 3);
  const perTensorGB = (parameters * mix(2, 4, fp32)) / 1e9;
  const terms = [
    ['Weights', weights * perTensorGB, C.blue],
    ['Gradients', gradients * perTensorGB, C.cyan],
    ['Two Adam moments', moments * 2 * perTensorGB, C.pink],
  ];
  if (state.beat === 3) terms.push(['Saved activations', mix(8, 4, shrink), C.green]);

  text(ctx, api, '7 billion parameters   /   memory in decimal GB', 160, 281, 38, C.ink);
  text(ctx, api, state.beat === 2 ? 'Compare storage at 2 and 4 bytes per value'
    : 'Weights, gradients and moments at 2 bytes per value', 160, 355, 30, C.muted);
  let total = 0;
  focus.target('budget-stack', () => {
    api.rect(ctx, x(0), 500, x(capacityGB) - x(0), 120, C.panel, C.muted, 0);
    terms.forEach(([name, gb, color], i) => {
      if (gb > 0) api.rect(ctx, x(total), 500, x(gb) - x(0), 120, color, undefined, 0);
      total += gb;
      const col = 165 + i * 421;
      text(ctx, api, name, col, 786, 31, color);
      text(ctx, api, gb === 0 ? '·' : gb.toLocaleString('en', { maximumFractionDigits: 1 }) + ' GB',
        col, 853, 38, color, 'left', true);
    });
    api.line(ctx, x(capacityGB), 466, x(capacityGB), 648, C.yellow, 6);
    text(ctx, api, capacityGB + ' GB capacity', x(capacityGB), 441, 33, C.yellow, 'center');
  });
  [0, 24, 56, 84, 112].forEach(gb => {
    api.line(ctx, x(gb), 662, x(gb), 680, C.muted, 2);
    text(ctx, api, gb, x(gb), 722, 27, C.muted, 'center', true);
  });
  focus.target('budget-total', () => {
    const label = state.beat === 3 ? 'Including example activations' : 'Parameter state';
    text(ctx, api, label + '   ' + total.toLocaleString('en', { maximumFractionDigits: 1 }) + ' GB',
      960, 967, 44, total > capacityGB ? C.pink : C.ink, 'center');
  });
}

export default {
  id: 'large-model-budget',
  draw: drawLargeModelBudget,
  cues: ['large-weights', 'large-gradients', 'large-moments', 'large-fp32', 'large-fixed-floor',
    'micro-first', 'micro-second', 'micro-denominator', 'micro-sums', 'micro-divide', 'micro-mean',
    'equal-scores', 'base-loss', 'micro-weight-units', 'weighted-sums', 'local-mean', 'weighted-total',
    'weighted-backward', 'ignore-target', 'no-target-weight', 'skip-update'],
};
