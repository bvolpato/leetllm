import { mix, smooth } from '../construction.mjs';
import { T, mark } from '../defaults.mjs';
import { fittedWeights, openingRequest } from '../fixtures.mjs';

const weights = [1, 1, 2].map((digits, i) => Number(fittedWeights[i].toFixed(digits)));
const terms = weights.map((w, i) => w * [1, openingRequest.a, openingRequest.s][i]);
const running = terms.reduce((sums, term) => [...sums, sums.at(-1) + term], [0]);
const xAt = (value) => 1080 + 110 * value;
const cues = ['score-intercept', 'score-ambiguity', 'score-support'];

export function drawEvidenceScore(ctx, scene, state, api) {
  const { C } = api;
  T(ctx, api, openingRequest.id + '    ·    ambiguity 3    ·    policy support 5', 960, 267, 41);
  const labels = ['Intercept', 'Ambiguity', 'Policy support'];
  const formulas = [
    weights[0].toFixed(1),
    weights[1] + ' × ' + openingRequest.a,
    weights[2] + ' × ' + openingRequest.s,
  ];
  const colors = [C.blue, C.pink, C.green];
  mark(api, 'score-contributions', () => {
    api.line(ctx, xAt(0), 345, xAt(0), 781, C.muted, 2);
    for (const [i, term] of terms.entries()) {
      const y = 395 + i * 146;
      const q = api.focus.progress(cues[i], 0);
      T(ctx, api, labels[i], 108, y - 3, 34, colors[i], 'left');
      T(ctx, api, formulas[i], 108, y + 43, 38, C.ink, 'left');
      if (q > 0) {
        const x = xAt(running[i]);
        const end = xAt(mix(running[i], running[i + 1], smooth(q)));
        if (Math.abs(end - x) > 4) api.arrow(ctx, x, y, end, y, colors[i], 6);
        if (q === 1) {
          const labelX = x + (end - x) * 0.65;
          T(
            ctx,
            api,
            (term > 0 ? '+' : '−') + Math.abs(term).toFixed(1),
            labelX,
            y - 28,
            40,
            colors[i],
          );
          api.line(ctx, end, y + 8, end, i === 2 ? 808 : y + 137, colors[i], 2);
        }
      }
    }
    api.line(ctx, xAt(-6), 818, xAt(6), 818, C.muted, 3);
    for (const z of [-6, -4, -2, 0, 2, 4, 6]) {
      api.line(ctx, xAt(z), 810, xAt(z), 829, C.muted, 3);
      T(ctx, api, z, xAt(z), 869, 30, C.muted);
    }
  });
  mark(api, 'score-result', () => {
    const done = api.focus.progress('score-total', 0) === 1;
    T(
      ctx,
      api,
      done
        ? 'Rounded logit   −4.9 + 10.2 − 4.8 = ' + running.at(-1).toFixed(1)
        : 'Where do these rounded weights put the logit?',
      960,
      973,
      44,
      done ? C.yellow : C.ink,
    );
  });
}

export default {
  id: 'evidence-score',
  draw: drawEvidenceScore,
  cues: [...cues, 'score-total'],
};
