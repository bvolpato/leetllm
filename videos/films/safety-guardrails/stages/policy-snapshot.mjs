import { POLICY_V7 } from '../fixtures.mjs';
import { guardDone, snapshotDecision } from '../model.mjs';
import { resultAfter } from '../../../lib/lesson-definition.mjs';

const v8 = { ...POLICY_V7, revision: 'policy-8', injectionThreshold: 0.99 };
const score = 0.91;

export function paintPolicySnapshot(ctx, scene, state, api) {
  const { C, text, line, circle } = api;
  const beat = state.beat ?? 0;
  const done = (id, b, a, z) =>
    state.cues?.[id]?.phase ? resultAfter(state, id) : guardDone(state, id, b, a, z);
  const reloaded = done('sg-policy-reload', 2, 0.05, 0.35);
  const active = reloaded ? v8 : POLICY_V7;
  const r1Captured = done('policy-snapshot-b2-1', 1, 0.02, 0.32);
  const r1Scored = r1Captured && done('sg-policy-score', 1, 0.33, 0.58);
  const r1Decided = r1Scored && done('policy-snapshot-b2-2', 1, 0.68, 0.88);
  const r2Scored = reloaded && done('sg-policy-newrequest', 2, 0.42, 0.7);
  const r2Decided = r2Scored && done('policy-new-result', 3, 0, 0.16);
  const x = (n) => 465 + (1050 * (n - 0.7)) / 0.3;
  api.focus.target('active-policy', () => {
    text(ctx, 'Current policy', 125, 261, 30, C.muted);
    text(
      ctx,
      active.revision + '    /    threshold ' + active.injectionThreshold.toFixed(2),
      430,
      265,
      42,
      C.yellow,
    );
    text(ctx, 'Model   assistant-v4', 1780, 264, 29, C.muted, 'right');
  });
  line(ctx, 120, 311, 1790, 311, C.muted, 2);
  text(ctx, 'Injection score', 125, 409, 31, C.muted);
  for (const n of [0.7, 0.8, 0.9, 1]) {
    line(ctx, x(n), 424, x(n), 439, C.muted, 3);
    text(ctx, n.toFixed(2), x(n), 408, 31, C.muted, 'center');
  }
  function rail(id, name, y, policy, captured, scoreShown, settled) {
    api.focus.target(id, () => {
      text(ctx, name, 125, y - 13, 43, C.ink);
      text(
        ctx,
        policy && captured ? policy.revision : 'Awaiting capture',
        125,
        y + 48,
        28,
        C.muted,
      );
      line(ctx, x(0.7), y, x(1), y, C.muted, 4);
      if (captured) {
        const threshold = policy.injectionThreshold;
        const cut = x(threshold);
        line(ctx, cut, y - 22, cut, y + 22, C.yellow, 6);
        text(ctx, 'Trigger ' + threshold.toFixed(2), cut, y + 71, 32, C.yellow, 'center');
      }
      if (scoreShown) {
        circle(ctx, x(score), y, 13, C.cyan);
        text(ctx, score.toFixed(2), x(score), y - 44, 37, C.cyan, 'center');
      }
      const decision = settled ? snapshotDecision(score, policy) : null;
      text(
        ctx,
        decision ? (decision.admitted ? 'Continue' : 'Block') : '?',
        1710,
        y + 18,
        41,
        decision ? (decision.admitted ? C.green : C.yellow) : C.muted,
        'center',
      );
    });
  }
  rail('first-policy', 'R1', 556, POLICY_V7, r1Captured, r1Scored, r1Decided);
  if (beat >= 2) rail('second-policy', 'R2', 801, v8, r2Scored, r2Scored, r2Decided);
  api.focus.target('policy-question', () => {
    let label = 'Each request keeps the revision it captures on arrival.';
    if (r2Decided) label = 'The host still checks live permission before a tool can act.';
    else if (r2Scored) label = 'Which request can continue past this filter?';
    else if (r1Decided)
      label = 'For an injection label, a score at or above the captured threshold triggers a block.';
    text(ctx, label, 960, 985, 34, C.ink, 'center');
  });
}
export { paintPolicySnapshot as drawPolicySnapshot };
export default {
  id: 'policy-snapshot',
  draw: paintPolicySnapshot,
  cues: [
    'policy-snapshot-b1-1',
    'policy-snapshot-b2-1',
    'sg-policy-score',
    'policy-snapshot-b2-2',
    'sg-policy-reload',
    'sg-policy-newrequest',
    'policy-predict',
    'policy-new-result',
  ],
};
