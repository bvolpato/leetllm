import { mix, smooth } from '../construction.mjs';
import { mark, request, T } from '../defaults.mjs';
import { openingRequest } from '../fixtures.mjs';
import { costForCounts, policyAt } from '../model.mjs';
import { scoreRuler } from '../policy-desk.mjs';

const seats = 4;
const candidate = policyAt(0.5);
const charge = costForCounts({ fp: Number(openingRequest.label === 0), fn: 0 });

export function drawDecision(ctx, scene, state, api) {
  const closedBeat = state.beat > 0 ? 1 : 0;
  const route = api.focus.progress('final-route', closedBeat);
  const closed = api.focus.progress('final-label', closedBeat) === 1;
  const unnecessary = api.focus.progress('final-verdict', closedBeat) === 1;
  const priced = api.focus.progress('final-outcome', closedBeat) === 1;
  const summary = api.focus.progress('final-receipt', 0) === 1;
  const { C } = api;

  mark(api, 'request-ruler', () => {
    T(ctx, api, 'Frozen policy · ' + seats + ' review slots', 235, 262, 34, C.muted, 'left');
    scoreRuler(ctx, api, { cut: candidate.threshold, showScore: true, y: 369 });
  });
  api.rect(ctx, 1130, 558, 580, 246, C.bg, C.yellow, 12);
  T(ctx, api, 'Review desk', 1420, 537, 36, C.yellow);
  mark(api, 'final-request-route', () => {
    request(ctx, api, mix(210, 1170, smooth(route)), 581, {
      score: openingRequest.p.toFixed(3),
      outcome: closed ? 'routine' : 'pending',
    });
  });
  mark(api, 'final-request-outcome', () => {
    let bill = 'Mistake bill · awaiting outcome';
    if (route === 1) bill = 'Can we enter a mistake charge yet?';
    if (closed) bill = 'Routine handling was acceptable. What did this review cost?';
    if (unnecessary) bill = 'Unnecessary review · $?';
    if (priced) bill = 'Unnecessary review · $' + charge;
    T(ctx, api, bill, 960, 893, 43, priced ? C.yellow : C.ink);
  });
  if (state.beat === 1) {
    mark(api, 'final-policy-receipt', () => {
      const missed = api.focus.progress('final-miss', 0) === 1;
      const extra = api.focus.progress('final-extra', 0) === 1;
      T(ctx, api, 'Eight validation cases', 535, 590, 35, C.ink);
      api.line(ctx, 227, 617, 843, 617, C.muted, 2);
      if (missed) {
        T(ctx, api, 'Missed review', 240, 688, 36, C.ink, 'left');
        T(
          ctx,
          api,
          '$' + costForCounts({ fp: 0, fn: candidate.counts.fn }),
          831,
          688,
          43,
          C.pink,
          'right',
        );
      }
      if (extra) {
        T(ctx, api, 'Unnecessary review', 240, 767, 36, C.ink, 'left');
        T(
          ctx,
          api,
          '$' + costForCounts({ fp: candidate.counts.fp, fn: 0 }),
          831,
          767,
          43,
          C.blue,
          'right',
        );
      }
      const receipt = `Validation candidate: ${candidate.queue} reviews · $${candidate.cost} · capacity ${seats}`;
      if (summary) T(ctx, api, receipt, 960, 985, 34, C.green);
    });
  }
}

export default {
  id: 'decision',
  draw: drawDecision,
  cues: [
    'frozen-cut',
    'final-route',
    'final-label',
    'final-verdict',
    'final-outcome',
    'final-miss',
    'final-extra',
    'final-receipt',
  ],
};
