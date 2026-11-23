import { cueProgress, motion } from '../construction.mjs';
import { badge, connect, flow, panel, tokenRow } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    id = beat ? 'score-answer-b' : 'score-answer-a';
  const progress = cueProgress(state, id, motion(state, 0.25, 0.7));
  const a = panel(api, ctx, 160, 400, 610, 220, api.C.blue),
    judge = panel(api, ctx, 980, 400, 680, 220, api.C.green);
  badge(api, ctx, 'POLICY WRITES ' + (beat ? 'B' : 'A'), a.cx, 450, api.C.blue, 31);
  api.focus.target('policy-tokens', () =>
    tokenRow(
      api,
      ctx,
      beat ? ['Grant', 'access', 'now'] : ['Request', 'ticket', 'wait'],
      190,
      490,
      api.C.blue,
      170,
      20,
      28,
      beat ? 1 : cueProgress(state, 'policy-write', motion(state, 0.02, 0.3)),
    ),
  );
  badge(api, ctx, 'SHARED REWARD MODEL', judge.cx, 450, api.C.green, 31);
  badge(api, ctx, 'prompt + completed answer', judge.cx, 515, api.C.ink, 33);
  connect(api, ctx, a, judge, api.C.yellow);
  flow(api, ctx, [782, 510], [968, 510], progress, api.C.yellow);
  api.focus.target('reward-score', () =>
    badge(
      api,
      ctx,
      progress >= 1 ? (beat ? '+0.70' : '+1.80') : 'Score pending',
      judge.cx,
      585,
      progress >= 1 ? api.C.green : api.C.muted,
      43,
    ),
  );
  api.focus.target('candidate-scores', () => {
    badge(
      api,
      ctx,
      'A: ' + (beat || progress >= 1 ? '1.80' : 'pending'),
      600,
      825,
      api.C.green,
      43,
    );
    badge(api, ctx, 'B: ' + (beat && progress >= 1 ? '0.70' : 'pending'), 1320, 825, api.C.red, 43);
  });
  badge(api, ctx, 'Illustrative shared-scorer outputs', 960, 960, api.C.muted, 29);
}

export function drawPolicyAndJudge(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'policy-and-judge',
  draw: drawPolicyAndJudge,
  cues: ['policy-write', 'score-answer-a', 'score-answer-b'],
};
