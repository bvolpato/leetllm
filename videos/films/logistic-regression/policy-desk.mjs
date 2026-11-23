import { mix, phase, smooth } from './construction.mjs';
import { T, mark } from './defaults.mjs';
import { openingRequest, validationScores } from './fixtures.mjs';
import { costForCounts, policies } from './model.mjs';

const sorted = [...validationScores].sort((a, b) => b.p - a.p);
const xAtScore = (p) => 235 + 1450 * p;

export function thresholdTrial(api, initialCut, changes) {
  let trial = { from: initialCut, to: initialCut, move: 1 };
  for (const [cue, to] of changes) {
    const move = api.focus.progress(cue, 0);
    if (move === 0) break;
    trial = { from: trial.to, to, move };
  }
  return trial;
}

export function scoreRuler(ctx, api, { cut, showScore, proposed = false, y = 543, thickness = 9 }) {
  const { C } = api;
  const scoreX = xAtScore(openingRequest.p);
  const cutX = xAtScore(cut);
  T(ctx, api, 'Automatic', 235, y - 38, 33, C.muted, 'left');
  T(ctx, api, 'Human review', 1685, y - 38, 33, C.yellow, 'right');
  api.line(ctx, 235, y, cutX, y, C.muted, thickness);
  api.line(ctx, cutX, y, 1685, y, C.yellow, thickness);
  for (const p of [0, 1]) T(ctx, api, p.toFixed(1), xAtScore(p), y + 65, 33, C.muted);
  if (proposed) {
    const x = xAtScore(0.5);
    api.line(ctx, x, y + 12, x, y + 42, C.muted, 3);
    T(ctx, api, 'Try 0.50', x, y + 95, 34, C.muted);
  }
  api.line(ctx, cutX, y - 14, cutX, y + 43, C.yellow, 5);
  T(ctx, api, 'Cut ' + cut.toFixed(2), cutX, y + 95, 40, C.yellow);
  if (showScore) {
    T(ctx, api, 'Score ' + openingRequest.p.toFixed(3), scoreX, y - 79, 54, C.cyan);
    api.line(ctx, scoreX, y - 61, scoreX, y - 12, C.cyan, 4);
    api.circle(ctx, scoreX, y, 12, C.cyan);
  }
}

export function requestRuler(ctx, api, { cut, drop, proposal, move, automatic, review }) {
  const { C } = api;
  const railY = 647;
  const scoreX = xAtScore(openingRequest.p);
  const markerY = railY - 165 * (1 - drop);
  const cardY = markerY - 249;
  const cardX = scoreX - 300;
  mark(api, 'request-ruler', () => {
    scoreRuler(ctx, api, {
      cut,
      showScore: false,
      proposed: proposal > 0 && move === 0,
      y: railY,
      thickness: 16,
    });
    api.line(ctx, scoreX, cardY + 203, scoreX, markerY, C.cyan, 6);
    api.circle(ctx, scoreX, markerY, 15, C.cyan);
    api.rect(ctx, cardX, cardY, 600, 205, C.cyan, undefined, 23);
    // The lock travels with the score so the marker stays identifiable as the request.
    const lockX = cardX + 82;
    api.path(
      ctx,
      [
        { x: lockX - 24, y: cardY + 99 },
        { x: lockX - 24, y: cardY + 76 },
        { x: lockX - 17, y: cardY + 59 },
        { x: lockX, y: cardY + 52 },
        { x: lockX + 17, y: cardY + 59 },
        { x: lockX + 24, y: cardY + 76 },
        { x: lockX + 24, y: cardY + 99 },
      ],
      { color: C.bg, width: 9 },
    );
    api.rect(ctx, lockX - 40, cardY + 96, 80, 62, C.bg, undefined, 9);
    api.circle(ctx, lockX, cardY + 123, 7, C.cyan);
    api.line(ctx, lockX, cardY + 123, lockX, cardY + 138, C.cyan, 5);
    T(ctx, api, openingRequest.text, cardX + 163, cardY + 66, 39, C.bg, 'left');
    T(ctx, api, openingRequest.p.toFixed(3), cardX + 159, cardY + 171, 100, C.bg, 'left');
  });
  mark(api, 'request-record', () => {
    if (!automatic) {
      T(ctx, api, 'At 0.80, who handles this request?', 960, 962, 48);
      return;
    }
    const firstX = mix(960, 586, smooth(proposal));
    T(ctx, api, 'Cut 0.80', firstX, 888, 34, C.muted);
    T(ctx, api, 'Automatic', firstX, 963, 56);
    if (proposal > 0) {
      T(ctx, api, 'Cut 0.50', 1334, 888, 34, C.yellow);
      T(
        ctx,
        api,
        review ? 'Human review' : 'Which route?',
        1334,
        963,
        56,
        review ? C.yellow : C.ink,
      );
    }
  });
}

// Give a crossing request its own travel time. A closed case keeps its identity and label
// while only its route, occupied seat and associated mistake charge change.
export function policyDesk(ctx, api, { from, to, move, seats, known, selected, prompt }) {
  const { C } = api;
  const changed = sorted.filter((v) => v.p >= from !== v.p >= to);
  if (to > from) changed.reverse();
  const between = move > 0 && move < 1;
  const threshold = move === 1 ? to : from;
  const seatX = (i) => 372 + i * 193;
  mark(api, 'policy-desk', () => {
    T(
      ctx,
      api,
      between ? 'Cut ' + from.toFixed(2) + ' → ' + to.toFixed(2) : 'Cut ' + threshold.toFixed(2),
      110,
      260,
      48,
      C.yellow,
      'left',
    );
    T(ctx, api, 'Eight closed requests, highest score first', 1110, 260, 36, C.ink);
    T(ctx, api, 'Automatic', 104, 407, 34, C.muted, 'left');
    T(ctx, api, 'Review', 104, 587, 34, C.yellow, 'left');
    T(ctx, api, seats + ' slots', 104, 638, 30, C.muted, 'left');
    T(ctx, api, 'Error cost', 104, 745, 32, C.muted, 'left');
    sorted.forEach((row, i) => {
      const x = seatX(i);
      const order = changed.indexOf(row);
      const landed =
        order < 0 ? 0 : phase(move, order / changed.length, (order + 1) / changed.length);
      const start = Number(row.p >= from);
      const end = Number(row.p >= to);
      const depth = mix(start, end, smooth(landed));
      const y = mix(324, 512, depth);
      const ink = row.label ? C.pink : C.blue;
      const overflow = i >= seats && depth === 1;
      if (i < seats) {
        api.rect(ctx, x - 90, 503, 180, 164, C.bg, C.yellow, 9);
      }
      api.rect(ctx, x - 81, y, 162, 145, C.panel, overflow ? C.red : ink, 7);
      T(ctx, api, row.id, x, y + 38, 32, ink);
      T(ctx, api, row.p.toFixed(3), x, y + 89, 42);
      T(ctx, api, row.label ? 'Required' : 'Routine', x, y + 129, 27, ink);
      if (overflow) T(ctx, api, 'No slot', x, 493, 30, C.red);
      if (depth === 0 || depth === 1) {
        const cost = costForCounts({
          fp: Number(!row.label && depth === 1),
          fn: Number(row.label && depth === 0),
        });
        T(ctx, api, '$' + cost, x, 745, cost ? 40 : 31, cost ? C.ink : C.muted);
      }
    });
    const lastSeat = seatX(seats - 1) + 96;
    api.line(ctx, seatX(0) - 90, 678, lastSeat, 678, C.yellow, 4);
    api.line(ctx, lastSeat, 493, lastSeat, 678, C.yellow, 4);
  });
  mark(api, 'policy-ledger', () => {
    const left = 112;
    api.line(ctx, left, 789, 1806, 789, C.muted, 2);
    for (const [i, p] of policies.entries()) {
      const x = 405 + 551 * i;
      const chosen = selected === p.threshold;
      if (chosen) api.rect(ctx, x - 247, 809, 494, 103, C.panel, C.green, 9);
      T(ctx, api, 'Cut ' + p.threshold.toFixed(2), x, 851, 31, chosen ? C.green : C.muted);
      T(
        ctx,
        api,
        known.includes(p.threshold) ? p.queue + ' reviews  ·  $' + p.cost : 'Pending',
        x,
        894,
        37,
        chosen ? C.green : C.ink,
      );
    }
    T(ctx, api, prompt, 960, 1002, 39, C.ink);
  });
}
