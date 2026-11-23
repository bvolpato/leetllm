import { ASSERTION_TICKETS, FOUR_CHOICE_POLICY } from '../fixtures.mjs';
import { routeScoredChoice } from '../model.mjs';
import { phraseFinished, phraseProgress, phraseStarted } from '../clock.mjs';
import { drawRuler } from '../ruler.mjs';
import { drawTicket } from '../ticket.mjs';

// Storyboard progress includes the hold after each measured take.
const firstVerdictBeatSeconds = 14.085 + 1.05;
const secondVerdictBeatSeconds = 17.13 + 1.5;

function drawDispatch(ctx, state, api) {
  const { C } = api;
  const second = phraseStarted(state, 'next-ticket', 3, 0.47);
  const results = ASSERTION_TICKETS.map((ticket) => routeScoredChoice(ticket, FOUR_CHOICE_POLICY));
  const active = results[Number(second)];
  const scoreKnown = phraseStarted(state, 'first-score', 1, 0.24);
  const resultKnown = second
    ? phraseFinished(state, 'second-score', 4, 2.1 / secondVerdictBeatSeconds)
    : phraseFinished(state, 'fresh-four-choice-score', 2, 6.82 / firstVerdictBeatSeconds);
  const secondVerdictTime = state.beat === 4 ? (state.beatP ?? 0) * secondVerdictBeatSeconds : 0;
  const transfer = [
    phraseProgress(
      state,
      api,
      'first-destination',
      2,
      7.465 / firstVerdictBeatSeconds,
      9.215 / firstVerdictBeatSeconds,
    ),
    api.focus.progress(
      'second-destination',
      api.clamp((secondVerdictTime - 4.395) / (6.52 - 4.395)),
    ),
  ];
  api.text(
    ctx,
    'Four allowed choices   /   cutoff on confidence ≥ ' + active.cutoff.toFixed(2),
    108,
    257,
    40,
    C.ink,
  );
  api.focus.target('four-ruler', () => {
    if (scoreKnown) {
      drawRuler(ctx, api, {
        count: FOUR_CHOICE_POLICY.legalChoices.length,
        probability: active.p,
        y: 382,
        gap: 121,
        target: 'ticket-reading',
        showReading: resultKnown,
        gate: active.cutoff,
      });
    } else api.text(ctx, 'Reviewed description   A · Test regression', 110, 427, 51, C.cyan);
  });
  const inputX = 302;
  const reviewX = 1110;
  const queueX = 1585;
  api.text(ctx, 'Returned choice', inputX, 668, 37, C.muted, 'center');
  api.text(ctx, 'Human review', reviewX, 668, 37, C.muted, 'center');
  api.text(ctx, 'Test investigation', queueX, 668, 37, C.muted, 'center');
  const visibleCount = second ? 2 : 1;
  results.slice(0, visibleCount).forEach((result, i) => {
    const targetX = result.eligible ? queueX : reviewX;
    const t = transfer[i];
    const x = inputX + (targetX - inputX) * t;
    const y = 743 + i * 123;
    const ink = t === 1 ? (result.eligible ? C.green : C.yellow) : C.cyan;
    const id = i === Number(second) ? 'active-ticket' : 'earlier-ticket';
    api.focus.target(id, () => {
      if (x - 190 > inputX - 181) api.line(ctx, inputX - 181, y, x - 190, y, C.muted, 2);
      api.line(ctx, x + 190, y, 1805, y, C.muted, 2);
      api.rect(ctx, x - 181, y - 44, 362, 88, C.panel, ink, 8);
      const converted = i < Number(second) || resultKnown;
      api.text(
        ctx,
        result.id + '   ' + result.choice,
        x,
        y + (scoreKnown ? -6 : 14),
        35,
        ink,
        'center',
      );
      if (scoreKnown) {
        const reading = converted
          ? 'Confidence ' + result.value.toFixed(2)
          : 'Probability ' + result.p.toFixed(2);
        api.text(ctx, reading, x, y + 31, 31, ink, 'center');
      }
    });
  });
  api.line(ctx, 110, 937, 1807, 937, C.muted, 2);
  api.focus.target(second ? 'grant-scope' : 'routing-calculation', () => {
    const floor = 1 / FOUR_CHOICE_POLICY.legalChoices.length;
    const p = active.p.toFixed(2);
    const range = (1 - floor).toFixed(2);
    if (!second && scoreKnown) {
      const relation = active.eligible ? '\\ge ' : '<';
      const comparison = resultKnown
        ? active.value.toFixed(2) + relation + active.cutoff.toFixed(2)
        : '?';
      const equation = `c=(${p}-${floor.toFixed(2)})/${range}=${comparison}`;
      api.math(ctx, equation, 110, 1015, 43, C.ink);
      if (resultKnown) {
        const destination = active.eligible ? 'test investigation' : 'human review';
        api.text(ctx, `Route ${active.id} to ${destination}`, 1807, 1015, 40, C.yellow, 'right');
      }
      return;
    }
    const scopeKnown = phraseStarted(state, 'grant-scope', 4, 7.19 / secondVerdictBeatSeconds);
    const expression = `c = (${p} − ${floor.toFixed(2)}) / ${range}`;
    const status = scopeKnown
      ? 'Ticket routing is authorized. Credential changes and incident closure need separate grants.'
      : scoreKnown
        ? expression + (resultKnown ? ' = ' + active.value.toFixed(2) : ' = ?')
        : 'Image pull succeeded   /   test assertion failed';
    api.text(ctx, status, 110, 1015, scopeKnown ? 36 : 43, scopeKnown ? C.yellow : C.ink);
  });
}
export function drawRelease(ctx, scene, state, api) {
  if (state.beat === 0) {
    const detailed = phraseStarted(state, 'fresh-log', 0, 0.1);
    const testsKnown = phraseStarted(state, 'assertion-line', 0, 0.32);
    drawTicket(ctx, api, { run: 'RUN-843', count: 4, detailed, testsKnown, testFailure: true });
    api.line(ctx, 105, 842, 1810, 842, api.C.muted, 2);
    api.text(ctx, 'Which cause does the detailed log support?', 110, 945, 43, api.C.yellow);
  } else drawDispatch(ctx, state, api);
}
export default {
  id: 'release',
  draw: drawRelease,
  cues: [
    'fresh-log',
    'assertion-line',
    'fresh-call',
    'first-score',
    'new-choice-count',
    'where-first',
    'convert-first',
    'fresh-four-choice-score',
    'first-destination',
    'next-ticket',
    'second-score',
    'second-destination',
    'grant-scope',
  ],
};
