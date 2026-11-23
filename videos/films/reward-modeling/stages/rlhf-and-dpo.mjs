import { cueProgress, motion } from '../construction.mjs';
import { finalRuleConstruction, REWARD_FITS } from '../model.mjs';
import { FINAL_RULE_FIXTURE } from '../fixtures.mjs';
import { answerTrack, eventX, ticketTimeline } from '../access-timeline.mjs';
import { arrow, badge, connect, label, lines, panel } from '../defaults.mjs';
function receipt(step, { grantNow, approved, passes }, showResult = true) {
  return `Step ${step}     !${grantNow} || ${approved}   =   ${showResult ? passes : '?'}`;
}

function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 0) {
    const p = cueProgress(state, 'rank-candidates', motion(state, 0.15, 0.55));
    const rows = [
      ['A', 'Request a ticket and wait', 1.8, api.C.green],
      ['B', 'Grant access now', 0.7, api.C.red],
      ['C', 'Longer review-first answer', 1.1, api.C.blue],
    ];
    api.focus.target('candidate-ranking', () =>
      rows.forEach(([name, text, score, color], i) => {
        panel(api, ctx, 190, 330 + i * 175, 1540, 130, color);
        badge(api, ctx, name, 270, 410 + i * 175, color, 40);
        label(api, ctx, text, 350, 410 + i * 175, 36);
        if (p > 0) api.rect(ctx, 1090, 378 + i * 175, ((400 * score) / 1.8) * p, 30, color);
        badge(api, ctx, p >= 1 ? score.toFixed(2) : 'pending', 1630, 410 + i * 175, color, 39);
      }),
    );
    api.focus.target('ppo-loop', () =>
      badge(
        api,
        ctx,
        'PPO: completed-answer reward updates the writer',
        960,
        960,
        api.C.yellow,
        35,
      ),
    );
  } else if (beat === 1) {
    const pair = panel(api, ctx, 160, 400, 450, 200, api.C.cyan),
      training = panel(api, ctx, 760, 400, 500, 200, api.C.yellow),
      policy = panel(api, ctx, 1410, 400, 350, 200, api.C.green);
    api.focus.target('offline-pairs', () =>
      lines(api, ctx, ['Same request', 'chosen A / rejected B'], pair.cx, 470, 32),
    );
    api.focus.target('direct-training', () =>
      lines(api, ctx, ['DPO', 'direct policy objective'], training.cx, 470, 33),
    );
    lines(api, ctx, ['Writer', 'parameters'], policy.cx, 470, 34);
    connect(api, ctx, pair, training);
    connect(api, ctx, training, policy, api.C.yellow);
    api.focus.target('reference-policy', () => {
      panel(api, ctx, 760, 760, 500, 110, api.C.blue);
      badge(api, ctx, 'Reference policy', 1010, 835, api.C.blue, 34);
    });
    arrow(api, ctx, 1010, 750, 1010, 615, api.C.blue);
    badge(
      api,
      ctx,
      'Basic offline DPO does not fit a separate scalar judge',
      960,
      1000,
      api.C.muted,
      30,
    );
  } else {
    const { C } = api;
    const v = finalRuleConstruction(state);
    const { verbose, reviewFirst, ticket } = FINAL_RULE_FIXTURE;
    const failed = v.checked && !v.original[0].passes;
    const approvalPosition = (eventX[1] - eventX[0]) / (eventX[2] - eventX[0]);
    api.focus.target('candidate-text', () => {
      label(
        api,
        ctx,
        (v.revised ? 'REVISED CANDIDATE ' : 'FRESH CANDIDATE ') + v.answer.id,
        125,
        236,
        29,
        C.blue,
      );
      v.answer.text.forEach((line, i) => label(api, ctx, line, 125, 300 + 55 * i, 37));
    });
    api.focus.target('candidate-ranking', () => {
      if (v.revised) return;
      label(
        api,
        ctx,
        ticket.id +
          '   ·   ' +
          (v.scaled || v.scored ? 'Evidence of compliance and scaled length' : 'Migration dry run'),
        946,
        236,
        29,
        C.yellow,
      );
      if (!v.scaled && !v.scored) {
        if (v.fittedVisible) {
          const [compliance, length] = REWARD_FITS.confounded.weights;
          label(
            api,
            ctx,
            `Fitted weights: compliance ${compliance.toFixed(2)} · length ${length.toFixed(2)}`,
            946,
            300,
            33,
            C.ink,
          );
        }
        return;
      }
      const [evidence, length] = verbose.features;
      const [evidenceWeight, lengthWeight] = v.weights;
      label(
        api,
        ctx,
        `Toy head: evidence ${evidence} × ${evidenceWeight} + length ${length} × ${lengthWeight} = ${v.scored ? v.reward : '?'}`,
        946,
        300,
        33,
        C.ink,
      );
      if (v.scored)
        label(
          api,
          ctx,
          `Same toy head: review-first ${reviewFirst.id} = ${v.reviewReward} < verbose ${verbose.id} = ${v.reward}`,
          946,
          355,
          33,
          C.yellow,
        );
      else if (v.reviewScored)
        label(
          api,
          ctx,
          `Review-first ${reviewFirst.id}: evidence ${reviewFirst.features[0]} × ${evidenceWeight} + length ${reviewFirst.features[1]} × ${lengthWeight} = ${v.reviewReward}`,
          946,
          355,
          33,
          C.ink,
        );
    });
    ticketTimeline(ctx, api, true);
    api.focus.target('original-action', () => {
      answerTrack(ctx, api, {
        name: 'Reply D',
        y: 535,
        progress: (v.scored ? 1 : v.originalApproval) * approvalPosition,
        events:
          v.originalAction > 0 || v.scored
            ? [
                {
                  text: v.original[0].grantNow ? 'Grant now' : 'Hold access',
                  color: failed ? C.red : C.blue,
                },
                v.originalApproval >= 1 || v.scored ? { text: 'Approval recorded' } : null,
              ]
            : [],
        verdict: failed ? { text: 'FAIL at step 1', color: C.red } : null,
      });
    });
    if (v.revised) {
      const first = v.revision[0];
      const last = v.revision[2];
      const nextTest =
        v.passed && cueProgress(state, 'final-next-test', motion(state, 0.8, 0.95)) > 0;
      api.focus.target(nextTest ? 'next-test' : 'reset-ticket', () => {
        if (nextTest) {
          label(api, ctx, 'Next test for the scorer', 946, 236, 34, C.yellow);
          label(api, ctx, 'Short reply   ·   waits for approval', 946, 300, 36, C.ink);
          label(api, ctx, 'Long reply    ·   grants access early', 946, 355, 36, C.ink);
          return;
        }
        label(api, ctx, 'Starting ticket at step 1', 946, 236, 29, C.blue);
        const status = first.approved ? 'approved' : 'pending';
        if (v.hold >= 1 || v.passed) {
          const access = first.grantNow ? 'GRANTED' : 'BLOCKED';
          const verdict = first.passes ? 'rule preserved' : 'rule failed';
          label(
            api,
            ctx,
            `${ticket.id} ${status} · access ${access} · ${verdict}`,
            946,
            300,
            33,
            C.ink,
          );
        } else label(api, ctx, `${ticket.id} ${status}`, 946, 300, 33, C.ink);
      });
      api.focus.target('revised-answer', () => {
        answerTrack(ctx, api, {
          name: 'Reply A2',
          y: 730,
          progress: v.passed ? 1 : approvalPosition * v.approval + (1 - approvalPosition) * v.grant,
          events: [
            v.hold >= 1 || v.passed ? { text: first.grantNow ? 'Grant now' : 'Hold access' } : null,
            v.approval >= 1 || v.passed ? { text: 'Approval recorded' } : null,
            v.grant >= 1 || v.passed ? { text: last.grantNow ? 'Grant now' : 'Hold access' } : null,
          ],
        });
      });
    }
    label(api, ctx, 'P-7   !grantNow || approved', 125, 874, 35, C.yellow);
    api.focus.target(v.revised ? 'final-pass' : 'quality-stop', () => {
      let status = 'Independent check: pending';
      if (v.passed) status = 'Independent check: PASS';
      else if (!v.revised && failed) status = 'FAIL: access granted while ticket is pending';
      else if (!v.revised && v.checking) status = 'Checking approval before access…';
      label(
        api,
        ctx,
        status,
        1780,
        874,
        37,
        v.passed ? C.green : !v.revised && failed ? C.red : C.ink,
        'right',
      );
    });
    api.focus.target('trial-stop', () => {
      if (v.stopped) label(api, ctx, 'OPTIMIZATION TRIAL STOPPED', 125, 975, 31, C.red);
    });
    let text;
    if (v.passed || v.grant >= 1) text = receipt(3, v.revision[2]);
    else if (v.approval >= 1) text = receipt(2, v.revision[1]);
    else if (v.hold >= 1) text = receipt(1, v.revision[0]);
    else if (v.revised) text = 'At which step can A2 grant access?';
    else if (v.checked) text = receipt(1, v.original[0]);
    else if (v.checking) text = receipt(1, v.original[0], false);
    else if (v.scored) text = 'Can the approval at step 2 cover D’s grant at step 1?';
    else text = 'P-7 requires approval before a grant.';
    api.focus.target('action-check', () =>
      label(api, ctx, text, 1780, 975, 36, v.passed ? C.green : C.ink, 'right'),
    );
  }
}

export function drawRlhfAndDpo(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'rlhf-and-dpo',
  draw: drawRlhfAndDpo,
  cues: [
    'rank-candidates',
    'ppo-explained',
    'dpo-pairs',
    'dpo-reference',
    'dpo-update',
    'final-action',
    'final-approval',
    'final-fitted-weights',
    'final-weights',
    'final-review-score',
    'final-shortcut-score',
    'final-check-start',
    'final-rule-check',
    'final-stop',
    'final-revise',
    'final-replay',
    'final-replay-approval',
    'final-replay-grant',
    'final-pass',
    'final-next-test',
  ],
};
