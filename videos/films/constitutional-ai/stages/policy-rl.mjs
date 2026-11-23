import { policyObjective } from '../arithmetic.mjs';
import { chapterFrame, logicalState } from '../construction.mjs';
import {
  drawAuditCard,
  drawAuditEquation,
  drawAuditText,
  drawBlock,
  drawFooter,
  withFocus,
} from '../defaults.mjs';
export function drawPolicyRl(ctx, scene, state, api) {
  state = logicalState('policy-rl', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = chapterFrame('policy-rl', state),
      tighten = currentBeat > 0 && f.changed,
      model = policyObjective(tighten ? 1 : 0.2);
    if (currentBeat === 0) {
      drawAuditText(
        ctx,
        api,
        'Invented two-answer distributions · scores A = 0.15, B = 0',
        960,
        290,
        32,
        themeColors.muted,
        'center',
      );
      [model.reference, model.policy].forEach((row, i) => {
        const y = 410 + i * 195;
        drawAuditText(
          ctx,
          api,
          i ? 'Candidate policy' : 'Reference policy',
          170,
          y + 43,
          33,
          themeColors.ink,
        );
        withFocus(ctx, api, 'policy-expectation', () => {
          if (i && !f.candidate) {
            drawAuditCard(
              ctx,
              api,
              'Candidate distribution pending',
              650,
              y,
              1000,
              themeColors.muted,
              85,
            );
            return;
          }
          drawBlock(ctx, api, 650, y, 1000 * row[0], 70, themeColors.green);
          drawBlock(ctx, api, 650 + 1000 * row[0], y, 1000 * row[1], 70, themeColors.pink);
          drawAuditText(
            ctx,
            api,
            row[0].toFixed(2),
            650 + 500 * row[0],
            y + 49,
            32,
            themeColors.bg,
            'center',
          );
          drawAuditText(
            ctx,
            api,
            row[1].toFixed(2),
            650 + 1000 * row[0] + 500 * row[1],
            y + 49,
            32,
            themeColors.bg,
            'center',
          );
          if (f.reward) {
            api.arrow(ctx, 800, y + 80, 800, y + 105, themeColors.green, 3);
            drawAuditText(
              ctx,
              api,
              `${row[0].toFixed(2)} × 0.15 + ${row[1].toFixed(2)} × 0 = ${(row[0] * 0.15).toFixed(3)}`,
              1120,
              y + 140,
              32,
              themeColors.green,
              'center',
            );
          }
        });
      });
      if (f.kl)
        drawAuditEquation(
          ctx,
          api,
          String.raw`D_{\rm KL}=0.8\log(0.8/0.5)+0.2\log(0.2/0.5)=0.1927`,
          960,
          900,
          39,
          themeColors.yellow,
        );
    } else {
      drawAuditText(
        ctx,
        api,
        `Fixed candidate · drift weight β = ${model.beta}`,
        960,
        305,
        40,
        themeColors.ink,
        'center',
      );
      const answer = tighten ? f.changedAnswer : f.baseObjective,
        penalty = tighten ? f.changedAnswer : f.penalty;
      withFocus(ctx, api, 'drift-comparison', () => {
        const origin = 900,
          scale = 2300;
        api.line(ctx, origin, 385, origin, 840, themeColors.muted, 3);
        for (const [label, value, color, y, ready] of [
          ['Reward', model.reward, themeColors.green, 425, true],
          ['Drift cost', -model.penalty, themeColors.pink, 585, penalty],
          ['Objective', model.objective, themeColors.yellow, 745, answer],
        ]) {
          drawAuditText(ctx, api, label, 180, y + 40, 33, color);
          if (ready) {
            drawBlock(
              ctx,
              api,
              Math.min(origin, origin + value * scale),
              y,
              Math.abs(value) * scale,
              65,
              color,
            );
            drawAuditText(ctx, api, value.toFixed(4), 1630, y + 45, 35, color, 'center');
          } else drawAuditText(ctx, api, 'Pending', 1630, y + 45, 29, themeColors.muted, 'center');
        }
        api.line(
          ctx,
          origin + model.referenceObjective * scale,
          735,
          origin + model.referenceObjective * scale,
          830,
          themeColors.cyan,
          4,
        );
        drawAuditText(ctx, api, '0', origin, 885, 25, themeColors.muted, 'center');
        drawAuditText(
          ctx,
          api,
          'Reference 0.0750',
          origin + model.referenceObjective * scale + 18,
          878,
          29,
          themeColors.cyan,
        );
      });
      if (answer)
        drawAuditText(
          ctx,
          api,
          tighten ? 'Candidate loses · −0.0727 < 0.0750' : 'Candidate wins · 0.0815 > 0.0750',
          960,
          940,
          38,
          tighten ? themeColors.pink : themeColors.green,
          'center',
        );
      else
        drawAuditText(
          ctx,
          api,
          tighten
            ? '0.1200 − 1 × 0.1927 = ?     Does the candidate still beat 0.0750?'
            : 'Subtract the weighted divergence',
          960,
          940,
          35,
          themeColors.yellow,
          'center',
        );
    }
    drawFooter(
      ctx,
      api,
      'Finite distribution comparison · real policy RL estimates objectives with rollouts and gradients',
    );
  }
}
export default {
  id: 'policy-rl',
  draw: drawPolicyRl,
  cues: [
    'policy-rl-1',
    'policy-candidate',
    'policy-kl',
    'policy-rl-2',
    'policy-penalty',
    'policy-base-objective',
    'policy-changed-answer',
  ],
};
