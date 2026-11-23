import { predict } from '../arithmetic.mjs';
import { stump } from '../fixtures.mjs';
import { fittedStump, policyCosts, stumpBill } from '../model.mjs';
import { drawConstructionText as label } from '../defaults.mjs';
import { ambiguityX, drawAmbiguityStrip, drawLegend } from '../ambiguity-strip.mjs';

const fresh = [3.35, 5, 1];
const score = predict(fittedStump, fresh);
const lowReviews = stump.left.filter((row) => row[2]).length;
const scoreFraction = lowReviews + ' / ' + stump.left.length;

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const done = (id, inBeat, start, end) =>
    beat > inBeat || (beat === inBeat && api.focus.progress(id, api.phase(p, start, end)) === 1);
  const scored = done('ticket-score', 1, 0, 0.13);
  if (beat === 0 || (beat === 1 && !scored)) {
    drawLegend(ctx, api);
    drawAmbiguityStrip(ctx, api, { cut: stump.cut, y: 535, labelCut: false });
    const at = ambiguityX(fresh[0]);
    label(ctx, api, 'New request · ' + fresh[0].toFixed(2), at, 345, 40, C.cyan);
    api.path(
      ctx,
      [
        { x: at - 15, y: 367 },
        { x: at + 15, y: 367 },
        { x: at, y: 393 },
        { x: at - 15, y: 367 },
      ],
      { color: C.cyan, fill: C.cyan, width: 2 },
    );
    label(ctx, api, '≤ cut: left leaf', 550, 790, 38);
    label(ctx, api, '> cut: right leaf', 1500, 790, 38);
    api.focus.target('ticket', () =>
      label(
        ctx,
        api,
        'At the cut, equality goes left. What is the review score?',
        960,
        946,
        45,
        C.yellow,
      ),
    );
    return;
  }

  const repriced = done('reprice', 3, 0.1, 0.32);
  const forty = done('forty-price', 1, 0.42, 0.69);
  const missPrice = repriced ? 30 : forty ? 40 : 120;
  const bills = [stumpBill(0.2, missPrice), stumpBill(0.5, missPrice)];
  const choice = repriced ? done('thirty-choice', 4, 0, 0.16) : done('forty-choice', 2, 0.4, 0.59);
  const routed = repriced ? done('thirty-route', 4, 0.65, 0.97) : done('forty-route', 2, 0.6, 0.8);
  const best = bills[0].total < bills[1].total ? bills[0] : bills[1];
  const [outcome] = policyCosts(fittedStump, best.threshold, [fresh], missPrice);
  const review = outcome.review;
  const open = done('open-ticket', 5, 0.09, 0.27);
  const charged = done('book-miss', 5, 0.28, 0.48);
  const compared = done('caught-review', 5, 0.55, 0.84);
  const extraTotal = !forty || done('forty-extra', 2, 0, 0.22);
  const missTotal =
    !forty ||
    (repriced ? done('thirty-misses', 4, 0.18, 0.35) : done('forty-misses', 2, 0.23, 0.39));

  api.focus.target('ticket', () => {
    api.rect(ctx, 110, 277, 630, 603, C.panel, C.cyan, 16);
    label(ctx, api, 'New request', 425, 350, 47, C.cyan);
    label(
      ctx,
      api,
      'Ambiguity  ' + fresh[0].toFixed(2) + ' ≤ ' + stump.cut.toFixed(2),
      425,
      415,
      34,
    );
    label(ctx, api, 'Score   ' + scoreFraction + '  =  ' + score.toFixed(2), 425, 492, 49);
    label(ctx, api, 'Queue when score ≥ cutoff', 425, 555, 29, C.muted);
    const at = (v) => 178 + 765 * v;
    const y = 631;
    api.line(ctx, at(0), y, at(0.65), y, C.muted, 3);
    bills.forEach((bill) => {
      const active = choice && bill === best;
      api.line(
        ctx,
        at(bill.threshold),
        y - (active ? 45 : 9),
        at(bill.threshold),
        y + 20,
        active ? C.yellow : C.muted,
        active ? 5 : 3,
      );
      label(
        ctx,
        api,
        bill.threshold.toFixed(2),
        at(bill.threshold),
        y + 60,
        28,
        active ? C.yellow : C.muted,
      );
    });
    api.circle(ctx, at(score), y, 15, C.cyan);
    label(
      ctx,
      api,
      routed ? (review ? 'Send to review' : 'Automatic') : 'Route pending',
      425,
      769,
      45,
      routed ? C.cyan : C.muted,
    );
    label(
      ctx,
      api,
      open ? 'Actual: needed review' : 'Actual label covered',
      425,
      836,
      32,
      open ? C.pink : C.muted,
    );
  });
  api.focus.target('bills', () => {
    label(ctx, api, 'Eight validation requests', 840, 335, 42, C.ink, 'left');
    label(
      ctx,
      api,
      '$18 per extra review   ·   $' + missPrice + ' per miss',
      840,
      408,
      36,
      C.yellow,
      'left',
    );
    label(ctx, api, 'Queue capacity: 8', 840, 472, 29, C.muted, 'left');
    bills.forEach((bill, i) => {
      const y = 592 + 171 * i;
      label(
        ctx,
        api,
        'Cutoff ' + bill.threshold.toFixed(2),
        840,
        y,
        37,
        choice && best === bill ? C.cyan : C.ink,
        'left',
      );
      const count = bill.extra ? bill.extra + ' extra reviews' : bill.misses + ' misses';
      const price = bill.extra ? 18 : missPrice;
      label(ctx, api, count + ' × $' + price, 840, y + 60, 33, C.muted, 'left');
      const total = (i === 0 ? extraTotal : missTotal) ? '$' + bill.total : '?';
      label(ctx, api, total, 1750, y + 33, 58, choice && best === bill ? C.cyan : C.ink, 'right');
      if (choice && best === bill) api.line(ctx, 825, y - 36, 825, y + 65, C.cyan, 6);
    });
  });
  let prompt = 'Choose the cheaper cutoff. Where does it send the new request?';
  if (routed)
    prompt =
      'Score ' +
      score.toFixed(2) +
      (review ? ' ≥ ' : ' < ') +
      best.threshold.toFixed(2) +
      (review ? '     ·     Queue' : '     ·     Automatic');
  if (open) prompt = 'Automatic route     ·     Actual label: needed review';
  if (charged) {
    prompt =
      'Fresh request     ·     ' + best.threshold.toFixed(2) + ' missed it: $' + outcome.cost;
    if (compared) {
      const other = bills.find((bill) => bill !== best);
      const [otherOutcome] = policyCosts(fittedStump, other.threshold, [fresh], missPrice);
      prompt += '     ·     ' + other.threshold.toFixed(2) + ' caught it: $' + otherOutcome.cost;
    }
  }
  api.focus.target('new-outcome', () =>
    label(ctx, api, prompt, 960, 985, 38, open ? C.pink : C.ink),
  );
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'ticket-score',
    'forty-price',
    'forty-extra',
    'forty-misses',
    'forty-choice',
    'forty-route',
    'reprice',
    'thirty-choice',
    'thirty-misses',
    'thirty-route',
    'open-ticket',
    'book-miss',
    'caught-review',
  ],
};
