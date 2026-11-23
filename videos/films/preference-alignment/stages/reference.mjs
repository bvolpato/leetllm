import { EXAMPLE } from '../fixtures.mjs';
import { dpoExample } from '../model.mjs';
import { progress, heard } from '../clock.mjs';

export function drawReference(ctx, scene, state, api) {
  const { C } = api;
  const x = (score) => 565 + (score + 4.2) * 760;
  const d = dpoExample();
  api.text(ctx, 'Whole-reply log probability', 130, 279, 43, C.ink);
  api.focus.target('ref-ruler', () => {
    for (const [i, r] of [EXAMPLE.chosen, EXAMPLE.rejected].entries()) {
      const y = 455 + i * 240,
        color = i === 0 ? C.green : C.blue;
      const q = progress(state, i === 0 ? 'ref-ticket' : 'ref-detour', 1);
      api.text(ctx, i === 0 ? 'A   Station' : 'B   Entrance', 130, y + 14, 40, color);
      api.line(ctx, x(-4.2), y, x(-2.8), y, C.muted, 2);
      const start = x(r.reference),
        end = x(r.policy);
      api.circle(ctx, start, y, 12, C.bg, color, 4);
      api.circle(ctx, end, y, 12, color);
      if (Math.abs(q * (end - start)) > 3) {
        api.arrow(ctx, start, y, start + q * (end - start), y, color, 6);
      }
      api.text(ctx, 'Ref  ' + r.reference.toFixed(1), start, y - 47, 32, C.muted, 'center');
      api.text(ctx, 'Policy  ' + r.policy.toFixed(1), end, y + 72, 35, color, 'center');
      if (q >= 1) {
        const delta = r.policy - r.reference;
        api.text(
          ctx,
          (delta > 0 ? '+' : '−') + Math.abs(delta).toFixed(1),
          1730,
          y + 15,
          48,
          color,
          'center',
        );
      }
    }
  });
  const seen = heard(state, 'ref-margin', 2);
  api.focus.target('ref-margin', () => {
    const line =
      state.beat === 0
        ? 'Compare each dot with its own reference ring.'
        : 'A’s change minus B’s change    ·    +0.6 − (−0.4) = ' +
          (seen ? d.margin.toFixed(1) : '?');
    if (state.beat !== 1 || heard(state, 'ref-detour', 1))
      api.text(ctx, line, 960, 952, 43, C.yellow, 'center');
  });
}

export default {
  id: 'reference',
  draw: drawReference,
  cues: ['ref-tie', 'ref-ticket', 'ref-detour', 'ref-margin'],
};
