import { lp, mask, tokens } from '../fixtures.mjs';
import { sum } from '../arithmetic.mjs';
import { validateSample } from '../model.mjs';
import { progress } from '../phrase-clock.mjs';

const observation = tokens.indexOf(50);
const samples = [mask, mask.map((bit, i) => (i === observation ? 1 : bit))];

export function drawSampleChecks(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  return api.focus.target('adapter-comparison', () => {
    api.text(
      ctx,
      'Rollout 7   /   completed   /   reward 1.0   /   sampled v11',
      960,
      278,
      35,
      C.ink,
      'center',
    );
    const selected = p('run-count') === 1;
    const means = p('compare-means') === 1;
    const verdict = p('test-producer') === 1;
    api.text(ctx, 'Response ID', 120, 412, 31, C.muted);
    api.text(ctx, 'Log p', 120, 487, 31, C.muted);
    const x = (i) => 550 + i * 222;
    api.text(ctx, 'Returned by the tool', (x(2) + x(3)) / 2, 338, 29, C.yellow, 'center');
    api.line(ctx, x(2) - 55, 357, x(3) + 55, 357, C.yellow, 3);
    tokens.forEach((id, i) => {
      const color = mask[i] ? C.blue : C.yellow;
      api.text(ctx, String(id), x(i), 414, 45, color, 'center');
      api.text(ctx, String(lp[i]).replace('-', '−'), x(i), 487, 36, color, 'center');
    });
    samples.forEach((bits, row) => {
      const y = 550 + row * 173;
      const adapter = row ? 'Adapter B' : 'Adapter A';
      const ok = validateSample(bits);
      api.text(
        ctx,
        verdict ? adapter + (ok ? '  ·  accept' : '  ·  hold') : adapter,
        120,
        y + 61,
        37,
        verdict ? (ok ? C.green : C.pink) : C.ink,
      );
      bits.forEach((bit, i) => {
        const color = i === observation && verdict ? C.yellow : C.muted;
        api.rect(ctx, x(i) - 65, y, 130, 76, C.panel, color, 7);
        api.text(ctx, String(bit), x(i), y + 55, 42, C.ink, 'center');
      });
      if (selected) {
        const count = sum(bits);
        const total = -sum(lp.filter((_, i) => bits[i]));
        api.text(
          ctx,
          `trainable_positions(sample) → ${count}`,
          165,
          y + 129,
          33,
          C.cyan,
          'left',
          'mono',
        );
        if (means)
          api.text(
            ctx,
            `Negative mean = ${total.toFixed(1)} / ${count} = ${(total / count).toFixed(2)}`,
            1010,
            y + 129,
            37,
            C.cyan,
          );
      }
    });
    const line = verdict
      ? 'B selects the tool’s zero placeholder. Correct the mask before training.'
      : means
        ? 'Which adapter would you trust with this update?'
        : 'Same IDs and probabilities. Compare the bit under ID 50.';
    api.text(ctx, line, 960, 977, 39, verdict ? C.ink : C.yellow, 'center');
  });
}
export default {
  id: 'sample-checks',
  draw: drawSampleChecks,
  cues: ['run-count', 'compare-means', 'test-producer', 'mutations'],
};
