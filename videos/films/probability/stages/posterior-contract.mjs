import { checkedPosterior, mix } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

const unit = Number.MIN_VALUE;
const prior = 0.01;
const trueMass = prior * 0.95;
const falseMass = (1 - prior) * 0.05;
const tinyRisk = checkedPosterior(unit, 0.5, unit);
const logAbuse = Math.log(unit) + Math.log(0.5);
const logClean = Math.log1p(-unit) + Math.log(unit);
const logMax = Math.max(logAbuse, logClean);
const weights = [logAbuse, logClean].map(logMass => Math.exp(logMass - logMax));

export function drawPosteriorContract(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b) => cueProgress(state, id, b);
  if (beat <= 1) {
    const empty = beat === 1 && q('empty-rates', 1) > 0;
    const abuse = empty ? 0 : trueMass;
    const clean = empty ? 0 : falseMass;
    const width = 1460;
    const scale = width / (trueMass + falseMass);
    focus(api, 'posterior-inputs', () => {
      text(ctx, api, 'Abusive signups', 470, 318, 46, C.red);
      text(ctx, api, 'Clean signups', 1400, 318, 46, C.blue);
      text(ctx, api, empty ? '0.01 × 0' : '0.01 × 0.95', 470, 420, 62, C.ink);
      text(ctx, api, empty ? '0.99 × 0' : '0.99 × 0.05', 1400, 420, 62, C.ink);
      const a = empty ? 0 : q('true-source', 0);
      const c = empty ? 0 : q('source-masses', 0);
      rectangle(ctx, api, 230, 585, width, 105, C.panel);
      if (a > 0) rectangle(ctx, api, 230, 585, a * abuse * scale, 105, C.red);
      if (c > 0) rectangle(ctx, api, 230 + abuse * scale, 585, c * clean * scale, 105, C.blue);
      if (empty || a === 1) text(ctx, api, abuse.toFixed(4), 470, 515, 48, C.red);
      if (empty || c === 1) text(ctx, api, clean.toFixed(4), 1400, 515, 48, C.blue);
      if (empty || c === 1) {
        text(ctx, api, empty ? 'Flag probability   0' : 'Flag probability   0.0590', 960, 790, 51, C.yellow);
      }
      if (empty && q('empty-result', 1) === 1)
        text(ctx, api, '0 / 0   ·   undefined', 960, 936, 49, C.ink);
      if (beat === 0) {
        const invalid = q('invalid-prior', 0) === 1 && q('true-source', 0) === 0;
        text(ctx, api, invalid ? 'Reject prior 1.4   ·   allowed range [0, 1]' : 'Valid inputs are finite probabilities from 0 to 1',
          960, 942, 39, invalid ? C.yellow : C.muted);
      }
    });
    return;
  }

  text(ctx, api, 'u = smallest positive binary64 value', 960, 266, 41, C.ink);
  focus(api, 'posterior-numerics', () => {
    if (q('tiny-inputs', 2) > 0)
      text(ctx, api, 'Prior  u       ·       flag rate in abuse  ½       ·       flag rate in clean  u', 960, 353, 38, C.muted);
    if (beat === 2) {
      const rounded = q('round-half', 2);
      const x0 = 350, step = 600, y = 625;
      line(ctx, api, x0, y, x0 + 2 * step, y, C.muted, 5);
      ['0', 'u', '2u'].forEach((label, i) => {
        const x = x0 + i * step;
        line(ctx, api, x, y - 18, x, y + 22, C.ink, 4);
        text(ctx, api, label, x, y + 90, 48);
      });
      if (q('half-unit', 2) > 0) {
        text(ctx, api, 'u / 2', x0 + step / 2, y + 91, 40, C.red);
        api.circle(ctx, x0 + step / 2, y - 12, 11, C.bg, C.red);
        const x = mix(x0 + step / 2, x0, rounded);
        text(ctx, api, rounded === 1 ? 'Stored as 0' : 'Abusive flags   u / 2', x, 490, 40, C.red);
        line(ctx, api, x, 522, x, y - 22, C.red, 4);
        api.circle(ctx, x, y - 12, 11, C.red);
      }
      if (q('clean-unit', 2) > 0) {
        text(ctx, api, 'Clean flags   ≈ u', x0 + step + 100, 545, 37, C.blue);
        api.circle(ctx, x0 + step, y - 12, 11, C.blue);
      }
      text(ctx, api, 'First three values a binary64 number can store at or above zero', 960, 822, 34, C.muted);
      if (q('raw-result', 2) === 1) text(ctx, api, 'Direct division   0 / u = 0', 960, 954, 50, C.yellow);
      return;
    }

    const normalize = q('log-normalize', 3);
    text(ctx, api, normalize === 1 ? 'Flag masses on the same relative scale' : 'Log mass minus the larger log mass', 960, 470, 42);
    const x = 585, width = 920;
    ['Abusive', 'Clean'].forEach((label, i) => {
      const y = 555 + i * 142;
      const color = i === 0 ? C.red : C.blue;
      text(ctx, api, label, x - 55, y + 53, 42, color, 'right');
      rectangle(ctx, api, x, y, width, 74, C.panel);
      if (normalize > 0) rectangle(ctx, api, x, y, width * weights[i] * normalize, 74, color);
      const value = i === 0 ? 'exp(−0.693…) ≈ 0.5' : 'exp(0) = 1';
      text(ctx, api, normalize === 1 ? value : (i === 0 ? '−0.693…' : '0'), x, y + 115, 34, color, 'left');
    });
    const answer = q('stable-result', 3) === 1;
    text(ctx, api, answer ? '0.5 / (0.5 + 1)  ≈  ' + (100 * tinyRisk).toFixed(1) + '%' : 'Abusive weight / total weight', 960, 965, 51, C.yellow);
  });
}
export default {
  id: 'posterior-contract', draw: drawPosteriorContract,
  cues: ['invalid-prior', 'true-source', 'source-masses', 'empty-rates', 'empty-result', 'tiny-inputs', 'half-unit', 'round-half', 'clean-unit', 'raw-result', 'log-normalize', 'stable-result'],
};
