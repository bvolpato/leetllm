import { mix, smooth } from '../construction.mjs';
import { T, mark } from '../defaults.mjs';
import { expectedPolicy, probabilityCost } from '../model.mjs';
import { thresholdTrial } from '../policy-desk.mjs';

const probabilities = [0.05, 0.18, 0.45, 0.75];
const missed = 108;
const unnecessary = 12;
const seats = 2;
const offers = [0.1, 0.3, 0.6].map((cut) =>
  expectedPolicy(probabilities, cut, unnecessary, missed, seats),
);
const cash = (amount) => '$' + amount.toFixed(2);
const middleRows = offers[1].rows;
const autoSubtotal = middleRows.reduce((sum, row) => sum + (row.review ? 0 : row.cost), 0);
const reviewSubtotal = offers[1].cost - autoSubtotal;

export function drawFreshOperatingPoint(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => api.focus.progress(id, 0);
  const seated = cue('lr-new-mid-queue');
  const low = cue('lr-new-low-selection');
  const reset = cue('restore-middle');
  const high = cue('lr-new-high-selection');
  const choice = cue('lr-new-selected-policy');
  const trial = thresholdTrial(api, 0.3, [
    ['lr-new-low-selection', 0.1],
    ['restore-middle', 0.3],
    ['lr-new-high-selection', 0.6],
    ['lr-new-selected-policy', 0.3],
  ]);
  const known = [cue('lr-new-low-policy'), cue('lr-new-mid-total'), cue('lr-new-high-policy')];
  const revealed = Math.ceil(cue('new-scores') * probabilities.length);

  mark(api, 'expected-desk', () => {
    T(ctx, api, 'Two review slots', 122, 273, 40, C.yellow, 'left');
    T(ctx, api, 'Cut ' + trial.to.toFixed(2), 1800, 273, 40, C.yellow, 'right');
    T(ctx, api, 'Request', 122, 354, 30, C.muted, 'left');
    T(ctx, api, 'Probability', 122, 413, 35, C.ink, 'left');
    T(ctx, api, 'Automatic handling', 122, 507, 35, C.ink, 'left');
    T(ctx, api, '$108 × p', 122, 551, 31, C.muted, 'left');
    T(ctx, api, 'Human review', 122, 651, 35, C.ink, 'left');
    T(ctx, api, '$12 × (1 − p)', 122, 695, 31, C.muted, 'left');
    probabilities.forEach((p, i) => {
      const x = 621 + 357 * i;
      T(ctx, api, 'N' + (i + 1), x, 354, 33, C.muted);
      T(ctx, api, i < revealed ? p.toFixed(2) : '?', x, 418, 49, C.cyan);
      if (i >= revealed) return;
      const risk = probabilityCost(p, unnecessary, missed);
      const depth = mix(Number(p >= trial.from), Number(p >= trial.to), smooth(trial.move));
      const on = i < 2 ? cue('fresh-auto-routes') === 1 : seated === 1;
      for (const [side, value] of [risk.automatic, risk.review].entries()) {
        const y = 521 + 143 * side;
        const selected = on && depth === side;
        const priceVisible = cue(side ? 'review-prices' : 'auto-prices') === 1;
        api.rect(
          ctx,
          x - 117,
          y - 48,
          234,
          85,
          selected ? C.yellow : C.panel,
          selected ? C.yellow : C.muted,
          8,
        );
        T(ctx, api, priceVisible ? cash(value) : '?', x, y + 14, 43, selected ? C.bg : C.muted);
      }
      if (on) {
        const trackX = x - 140;
        api.line(ctx, trackX, 521, trackX, 664, C.muted, 2);
        api.circle(ctx, trackX, mix(521, 664, depth), 9, C.yellow);
      }
    });
  });
  mark(api, 'expected-bills', () => {
    api.line(ctx, 120, 735, 1800, 735, C.muted, 2);
    offers.forEach((offer, i) => {
      const x = 410 + i * 550;
      const selected = choice === 1 && offer.cut === 0.3;
      if (selected) api.rect(ctx, x - 235, 761, 470, 125, C.panel, C.green, 8);
      T(ctx, api, 'Cut ' + offer.cut.toFixed(2), x, 809, 33, selected ? C.green : C.muted);
      let label = 'Pending';
      if (known[i] === 1)
        label = offer.queue + ' review' + (offer.queue > 1 ? 's' : '') + '  ·  ' + cash(offer.cost);
      T(ctx, api, label, x, 864, 39, selected ? C.green : C.ink);
    });
    let note = 'At 0.30, which four amounts belong on the bill?';
    if (seated === 1) note = 'Add one expected cost from each column.';
    if (cue('lr-new-mid-auto') === 1)
      note =
        'Automatic  ' +
        cash(middleRows[0].cost) +
        ' + ' +
        cash(middleRows[1].cost) +
        ' = ' +
        cash(autoSubtotal);
    if (cue('lr-new-mid-review') === 1)
      note = 'Automatic  ' + cash(autoSubtotal) + '     +     review  ' + cash(reviewSubtotal);
    if (low > 0) note = 'N2 switches from automatic handling to review.';
    if (reset > 0) note = 'Return to the two requests reviewed at 0.30.';
    if (high > 0) note = 'N3 switches from review to automatic handling.';
    if (known[2] === 1) note = 'Which tested cut has the smallest expected bill that fits?';
    if (choice === 1) note = 'N3 and N4 take the two review slots.';
    T(ctx, api, note, 960, 987, 38);
  });
}

export default {
  id: 'fresh-operating-point',
  draw: drawFreshOperatingPoint,
  cues: [
    'new-scores',
    'auto-prices',
    'review-prices',
    'expected-question',
    'fresh-auto-routes',
    'lr-new-mid-queue',
    'lr-new-mid-auto',
    'lr-new-mid-review',
    'lr-new-mid-total',
    'lr-new-low-selection',
    'lr-new-low-policy',
    'restore-middle',
    'lr-new-high-selection',
    'lr-new-high-policy',
    'lr-new-selected-policy',
  ],
};
