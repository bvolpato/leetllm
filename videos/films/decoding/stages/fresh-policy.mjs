import { decodeSoftmax } from '../arithmetic.mjs';
import { decodingFreshModel } from '../model.mjs';
import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

const names = ['ready', 'waiting', 'paused', 'checking', 'unknown'];
const f = decodingFreshModel();
const rollout = { time: '10:42', phase: 'paused' };

export function drawFreshPolicy(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  const at = (id, beat, end) => heard(state, id, beat, end);
  const crossing = at('dec-fresh-crossing-word', 1, 0.1);
  const hasP = at('dec-fresh-p', 1, 0.28);
  const hasK = at('dec-fresh-k', 1, 0.63);
  const hasMin = at('dec-fresh-minp', 1, 0.9);
  const cold = movement(state, 'dec-fresh-temperature', 2, 0.1, 0.55);
  const reset = movement(state, 'dec-fresh-reset', 3, 0.05, 0.18);
  const T = Math.round((1 - 0.5 * cold + 0.5 * reset) * 100) / 100;
  const masked = at('dec-fresh-mask-input', 3, 0.4);
  const rescale = movement(state, 'dec-fresh-rescale', 3, 0.45, 0.68);
  const row = masked
    ? f.row.map((v, i) => (i ? v + (f.masked[i] - v) * rescale : 0))
    : decodeSoftmax(f.row.map(Math.log), T);
  const scored = at('dec-fresh-mask-result', 4, 0.32);
  const evidence = at('dec-fresh-record', 4, 0.72);
  const verified = at('dec-fresh-verified', 5, 0.18);
  const count =
    b === 0 ? 1 + Math.floor(4 * movement(state, 'dec-fresh-deal', 0, 0.05, 0.64)) : names.length;
  api.focus.target('status-decision', () => {
    coreText(
      ctx,
      api,
      'The canary status is ' + (verified ? rollout.phase + '.' : '…'),
      120,
      264,
      52,
      verified ? C.green : C.ink,
      'left',
    );
    const label = masked
      ? rescale < 1
        ? 'Eligible weights'
        : 'After the grammar, before top-p'
      : 'Next-word probability';
    coreText(ctx, api, label, 335, 365, 29, C.muted, 'left');
    for (let i = 0; i < count; i++) {
      const y = 460 + i * 108;
      const forbidden = masked && i === 0;
      const tone = scored
        ? f.maskedP.ids.includes(i)
          ? C.green
          : C.muted
        : forbidden
          ? C.muted
          : b === 1 && crossing && i === f.p.ids.at(-1)
            ? C.yellow
            : C.blue;
      coreText(ctx, api, names[i], 120, y, 36, tone, 'left');
      api.line(ctx, 350, y - 10, 910, y - 10, C.panel, 5);
      if (row[i]) api.rect(ctx, 350, y - 33, row[i] * 560, 44, tone, undefined, 3);
      coreText(
        ctx,
        api,
        forbidden ? 'masked' : (100 * row[i]).toFixed(1) + '%',
        1080,
        y,
        32,
        tone,
        'right',
      );
    }
    const x = 1175;
    const line = (s, y, tone = C.ink, size = 34) => coreText(ctx, api, s, x, y, size, tone, 'left');
    if (b === 0) {
      line('Top-p  0.80', 470, C.yellow, 43);
      if (at('dec-fresh-deal', 0, 0.64)) {
        line('Add from the top.', 594);
        line('Which word gets you to 80%?', 680);
      }
    } else if (b === 1) {
      line(crossing ? 'Top-p  0.80   →   paused' : 'Top-p  0.80', 410, C.yellow);
      if (hasP) line('First two 0.74 · first three 0.88', 472);
      if (hasK) {
        line('Exact top-k  2', 588, C.cyan);
        line(
          'ready  ' + f.k.values[0].toFixed(3) + '     waiting  ' + f.k.values[1].toFixed(3),
          648,
        );
      }
      if (hasMin) {
        line('Min-p  0.20', 762, C.green);
        line('Floor   0.20 × 0.48 = ' + f.floor.toFixed(3), 822);
        line('Keep through paused.', 880);
      }
    } else if (b === 2) {
      line('Temperature  ' + T.toFixed(2), 480, C.yellow, 42);
      line('Square each original share at ½.', 608);
      line('Divide by the sum of all five squares.', 683, C.muted, 31);
    } else if (b === 3 || !evidence) {
      line(masked ? 'Grammar excludes ready' : 'Temperature  ' + T.toFixed(2), 403, C.yellow, 38);
      if (masked) {
        line('Eligible mass    1 − 0.48 = 0.52', 494);
        if (rescale === 1) {
          line('waiting + paused', 605, C.cyan);
          line('(0.26 + 0.14) / 0.52 ≈ 76.9%', 670);
          line(
            scored ? 'With checking   0.48 / 0.52 ≈ 92.3%' : 'Which word takes it to 80%?',
            790,
            scored ? C.green : C.ink,
            33,
          );
        }
      }
    } else {
      line('Example rollout log', 409, C.muted, 32);
      line(rollout.time + '   rollout.phase = ' + rollout.phase, 496, C.yellow, 36);
      if (!verified) line('Which state does this record support?', 635, C.ink, 33);
      line('Green words survive top-p 0.80.', 797, C.green, 30);
    }
  });
}
export default {
  id: 'fresh-policy',
  draw: drawFreshPolicy,
  cues: [
    'dec-fresh-deal',
    'dec-fresh-crossing-word',
    'dec-fresh-p',
    'dec-fresh-k',
    'dec-fresh-minp',
    'dec-fresh-temperature',
    'dec-fresh-reset',
    'dec-fresh-mask-input',
    'dec-fresh-rescale',
    'dec-fresh-mask-result',
    'dec-fresh-record',
    'dec-fresh-verified',
  ],
};
