import { encode8, even, stochasticNeighbor } from '../encoding.mjs';
import { motion, settled } from '../timing.mjs';

const lower = 1;
const upper = 1.125;
const update = 1 / 32;
const updated = lower + update;
const fp8 = encode8(updated).value;
const bf16 = 1 + even(update * 128) / 128;
const trial = 1.01;
const chance = stochasticNeighbor(trial, lower, upper);
const x = (v) => 430 + ((v - lower) / (upper - lower)) * 1190;

export function drawRoundingProbability(ctx, scene, state, api) {
  const { C } = api;
  const candidate = lower + update * motion(state, 'round-candidate', 0);
  const fp8Stored = settled(state, 'round-store', 1);
  const trialMove = motion(state, 'round-trial', 2);
  const point =
    updated + (trial - updated) * trialMove + (upper - trial) * motion(state, 'round-exact', 4);
  const mass = motion(state, 'round-mass', 3);
  const expected = settled(state, 'round-expectation', 3);
  api.focus.target('round-rulers', () => {
    api.text(
      ctx,
      state.beat < 2 ? 'Same update to a weight of 1' : 'One E4M3 gap',
      150,
      270,
      39,
      C.ink,
    );
    api.text(
      ctx,
      state.beat < 2
        ? '1 + 1/32 = ' + updated
        : state.beat === 4
          ? 'Check the endpoints'
          : 'Next trial    1 + 0.01',
      1715,
      270,
      40,
      C.blue,
      'right',
    );
    const lanes =
      state.beat < 2
        ? [
            ['E4M3', 3, fp8, 480],
            ['BF16', 7, bf16, 730],
          ]
        : [['E4M3', 3, fp8, 480]];
    for (const [name, bits, rounded, y] of lanes) {
      api.text(ctx, name, 145, y + 15, 47, C.ink);
      api.line(ctx, x(lower), y, x(upper), y, C.muted, 3);
      const gap = 2 ** -bits;
      for (let v = lower; v <= upper; v += gap)
        api.line(ctx, x(v), y - 14, x(v), y + 14, C.muted, 3);
      api.text(ctx, lower, x(lower), y + 64, 32, C.muted, 'center');
      api.text(ctx, upper, x(upper), y + 64, 32, C.muted, 'center');
      if (state.beat < 2) {
        api.circle(ctx, x(candidate), y - 60, 11, C.blue);
        const commit = name === 'BF16' ? motion(state, 'round-bf16', 1) : 0;
        const stored = name === 'BF16' ? settled(state, 'round-bf16', 1) : fp8Stored;
        const px = x(lower + (rounded - lower) * commit);
        api.circle(ctx, px, y - 20, 12, C.cyan);
        api.text(
          ctx,
          stored ? 'Stored ' + rounded : 'Stored weight',
          px,
          y - 102,
          32,
          C.cyan,
          'center',
        );
      } else {
        api.circle(ctx, x(point), y - 18, 13, C.blue);
        api.text(ctx, String(Number(point.toFixed(5))), x(point), y - 65, 34, C.blue, 'center');
      }
    }
  });
  api.focus.target('round-outcomes', () => {
    if (state.beat < 2) {
      api.text(
        ctx,
        fp8Stored ? 'The next E4M3 update starts at 1 again.' : 'Which stored weight will move?',
        960,
        957,
        45,
        C.ink,
        'center',
      );
      return;
    }
    if (state.beat === 4) {
      if (settled(state, 'round-exact', 4))
        api.text(ctx, 'Exact grid point   1.125 → 1.125', 960, 740, 45, C.cyan, 'center');
      if (settled(state, 'round-limits', 4))
        api.text(
          ctx,
          'Beyond the grid   500 → 448   (saturating E4M3)',
          960,
          913,
          40,
          C.pink,
          'center',
        );
      return;
    }
    const left = 395;
    const width = 1260;
    const lowShare = 1 - chance.p;
    api.text(ctx, 'Probability of each stored value', left, 688, 33, C.ink);
    api.rect(ctx, left, 730, width, 55, C.panel, C.muted, 0);
    if (mass > 0) {
      api.rect(ctx, left, 730, width * lowShare * mass, 55, C.cyan, undefined, 0);
      api.rect(
        ctx,
        left + width * lowShare,
        730,
        width * chance.p * mass,
        55,
        C.yellow,
        undefined,
        0,
      );
    }
    api.text(
      ctx,
      mass >= 1 ? '1    ·    ' + Math.round(lowShare * 100) + '%' : 'Store 1',
      left,
      846,
      34,
      C.cyan,
    );
    api.text(
      ctx,
      mass >= 1 ? '1.125    ·    ' + Math.round(chance.p * 100) + '%' : 'Store 1.125',
      left + width,
      846,
      34,
      C.yellow,
      'right',
    );
    api.text(
      ctx,
      expected
        ? '0.92 × 1 + 0.08 × 1.125 = ' + chance.expected.toFixed(2)
        : 'Chance of moving up = distance from 1 ÷ gap width',
      960,
      968,
      38,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'rounding-probability',
  draw: drawRoundingProbability,
  cues: [
    'round-candidate',
    'round-store',
    'round-bf16',
    'round-trial',
    'round-mass',
    'round-expectation',
    'round-exact',
    'round-limits',
  ],
};
