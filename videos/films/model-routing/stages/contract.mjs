import { facts, policy } from '../fixtures.mjs';
import { compile } from '../model.mjs';
import { progress } from '../timing.mjs';
import { text } from '../defaults.mjs';

export function drawContract(ctx, scene, state, api) {
  const { C, focus } = api;
  const hinted = progress(state, 'client-hint', 2, 0.05, 0.35) > 0;
  const contract = compile(hinted ? { ...facts, data: 'public', citations: false } : facts);
  const evidence = [
    [
      'Private notes',
      contract.data === 'private' ? 'Keep inside the tenant boundary' : 'Public handling',
    ],
    ['Access decision', 'Cite the evidence in the versioned form'],
    [
      `Risk   $${facts.risk / 100}    /    threshold   $${policy.reviewThreshold / 100}`,
      contract.review ? 'Send the answer for human review' : 'Review optional',
    ],
    [
      `${contract.context.toLocaleString('en-US')} input tokens`,
      'Require room for the complete input',
    ],
    ['Release policy', 'Screen the lane estimate at $0.005'],
  ];
  text(ctx, api, 'Server record   /   R900', 145, 300, 42, C.ink);
  focus.target('contract-fields', () => text(ctx, api, 'Required together', 990, 300, 42, C.cyan));
  const add = progress(state, 'compile-fields', 0, 0.1, 0.88);
  const risk = progress(state, 'accumulate-requirements', 1, 0.24, 0.65);
  evidence.forEach(([fact, value], i) => {
    const y = 410 + i * 104;
    text(ctx, api, fact, 145, y, 34, C.ink);
    const p = Math.min(1, Math.max(0, add * evidence.length - i));
    const active = i === 2 && state.beat === 1 && risk > 0;
    const color = active ? C.yellow : C.cyan;
    focus.target('contract-fields', () => {
      api.circle(ctx, 980, y - 8, 7, p === 1 ? color : C.muted);
      if (p > 0) api.line(ctx, 740, y - 8, 740 + 210 * p, y - 8, color, 4);
      if (p === 1) text(ctx, api, value, 1010, y, 35, color);
    });
  });
  focus.target('client-input', () =>
    text(
      ctx,
      api,
      hinted
        ? 'Client says “public, no citations”   ·   server access policy still applies'
        : state.beat === 1
          ? 'An early return at “private” would skip the risk check'
          : policy.schema,
      960,
      985,
      32,
      hinted ? C.yellow : C.muted,
      'center',
    ),
  );
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: ['compile-fields', 'accumulate-requirements', 'client-hint'],
};
