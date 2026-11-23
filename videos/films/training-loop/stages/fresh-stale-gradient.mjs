import { heldOutUpdate } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { LR } from '../fixtures.mjs';
import { routeRuler, signed, ticketStrip } from '../route-ruler.mjs';
import { finished } from '../scene-clock.mjs';

// Both replays use the same training rows, initial weights, rate and held-out input.
const stale = heldOutUpdate(false);
const cleared = heldOutUpdate(true);

export function drawFreshStaleGradient(ctx, scene, state, api) {
  const { C } = api;
  const replay = finished(state, 'fresh-rewind', 2, 0.32);
  const clear = finished(state, 'loop-clear-stale', 2, 0.46);
  const trial = clear ? cleared : stale;
  const sum = replay ? state.beat >= 3 : finished(state, 'loop-stale-sum', 1, 0.26);
  const step = replay
    ? finished(state, 'fresh-fixed-update', 3, 0.25)
    : finished(state, 'loop-stale-update', 1, 0.48);
  const verdict = replay
    ? finished(state, 'loop-fixed-route', 3, 0.38)
    : finished(state, 'loop-bad-route', 1, 0.6);
  const logits = replay
    ? finished(state, 'fresh-good-logits', 3, 0.52)
    : finished(state, 'fresh-bad-logits', 1, 0.73);
  const showStale = finished(state, 'fresh-bad-gap', 1, 0.84);
  const showClear = finished(state, 'fresh-good-gap', 3, 0.61);
  const probability = replay
    ? finished(state, 'fresh-good-prob', 3, 0.73)
    : finished(state, 'fresh-bad-prob', 1, 0.94);
  api.focus.target('fresh-ticket', () => ticketStrip(ctx, api, 'Held-out ticket', trial.ticket));
  api.focus.target('fresh-calculation', () => {
    text(
      ctx,
      api,
      'Train on A and B   ·   initial W = 0   ·   SGD rate ' + LR,
      150,
      341,
      34,
      C.ink,
    );
    if (clear)
      api.text(
        ctx,
        'optimizer.zero_grad(set_to_none=False)',
        1760,
        341,
        27,
        C.yellow,
        'right',
        'mono',
      );
    else text(ctx, api, 'Each pair is [urgency, severity]', 1760, 341, 30, C.muted, 'right');
    const xs = [625, 957, 1300, 1615];
    for (const [j, name] of [
      'Old .grad',
      'Add A and B',
      'Stored .grad',
      'Weight after step',
    ].entries()) {
      text(ctx, api, name, xs[j], 413, 31, C.muted, 'center');
    }
    for (const [i, route] of ['Standard', 'Escalate'].entries()) {
      const y = 490 + 85 * i;
      text(ctx, api, route, 150, y, 40, i ? C.green : C.blue);
      // The urgency and severity entries are equal for this symmetric batch. Show both.
      const pair = (row) =>
        '[' +
        row
          .map((v) => (v > 0 ? '+' : '') + Number(v.toFixed(2)).toString().replace('-', '−'))
          .join(', ') +
        ']';
      const entries = [
        pair(trial.old[i]),
        pair(trial.current[i]),
        sum ? pair(trial.stored[i]) : '?',
        step ? pair(trial.weights[i]) : '?',
      ];
      entries.forEach((v, j) =>
        text(ctx, api, v, xs[j], y, 38, [C.pink, C.yellow, C.ink, C.ink][j], 'center'),
      );
    }
  });
  const marks = [];
  if (showStale) {
    const { gap } = stale;
    marks.push({
      gap,
      label: 'Kept buffer  ' + signed(gap),
      color: replay ? C.muted : C.blue,
      hollow: replay,
    });
  }
  if (showClear) {
    const { gap } = cleared;
    marks.push({ gap, label: 'Cleared  ' + signed(gap), color: C.green });
  }
  routeRuler(ctx, api, 773, marks);
  api.focus.target('fresh-scores', () => {
    const route = trial.logits[1] > trial.logits[0] ? 'Escalate' : 'Standard';
    const question = replay
      ? 'After clearing, where will this ticket land?'
      : 'Which queue will get the held-out ticket?';
    const showFormula = finished(state, 'fresh-logistic', 3, 0.79);
    const accuracy = state.cues?.['fresh-accuracy']
      ? state.cues['fresh-accuracy'].phase !== 'before'
      : state.beat === 3 && state.beatP >= 0.89;
    const reading = verdict ? 'Predicted queue   ' + route : question;
    const chance =
      probability && (!showFormula || accuracy)
        ? '     ·     P(escalate) = ' + trial.probabilities[1].toFixed(3)
        : '';
    text(
      ctx,
      api,
      reading + chance,
      960,
      953,
      40,
      verdict ? (clear ? C.green : C.blue) : C.ink,
      'center',
    );
    if (accuracy) {
      text(
        ctx,
        api,
        'Separate labeled set      Accuracy = correctly routed tickets / total tickets',
        960,
        1020,
        35,
        C.ink,
        'center',
      );
    } else if (showFormula) {
      const chancePair =
        stale.probabilities[1].toFixed(3) + ' → ' + cleared.probabilities[1].toFixed(3);
      text(
        ctx,
        api,
        'P(escalate) = 1 / (1 + exp(−gap))     ·     ' + chancePair,
        960,
        1020,
        34,
        C.ink,
        'center',
      );
    } else if (logits) {
      trial.weights.forEach((row, i) => {
        const dot = row.map((w, j) => '(' + signed(w) + ' × ' + trial.ticket[j] + ')').join(' + ');
        text(
          ctx,
          api,
          (i ? 'Escalate' : 'Standard') + '   ' + dot + ' = ' + signed(trial.logits[i]),
          i ? 1395 : 525,
          1020,
          28,
          i ? C.green : C.blue,
          'center',
        );
      });
    } else {
      text(
        ctx,
        api,
        'Each route score = (urgency weight × 1.5) + (severity weight × 1)',
        960,
        1020,
        31,
        C.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'fresh-stale-gradient',
  draw: drawFreshStaleGradient,
  cues: [
    'fresh-input',
    'fresh-old',
    'fresh-ask',
    'loop-stale-sum',
    'loop-stale-update',
    'loop-bad-route',
    'fresh-bad-logits',
    'fresh-bad-gap',
    'fresh-bad-prob',
    'fresh-rewind',
    'loop-clear-stale',
    'fresh-replay',
    'fresh-fixed-update',
    'loop-fixed-route',
    'fresh-good-logits',
    'fresh-good-gap',
    'fresh-good-prob',
    'fresh-logistic',
    'fresh-accuracy',
  ],
};
