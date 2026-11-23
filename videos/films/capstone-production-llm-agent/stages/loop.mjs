import { POLICY_ID } from '../fixtures.mjs';
import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeProgress,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawLoop(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const policyLines = [
    'Production API key access may be restored',
    'after identity verification.',
    'Privileged scopes require manager approval',
    'before access is queued.',
  ];
  api.focus.target('loop-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      const n = ['policy-evidence', 'account-context', 'cited-draft', 'review-stop'].filter(
        (id) => drawAgentUpgradeProgress(ctx, api, id) > 0,
      ).length;
      drawAgentUpgradePaper(
        ctx,
        api,
        140,
        320,
        740,
        430,
        'Observed source ' + POLICY_ID,
        n >= 1 ? themeColors.blue : themeColors.muted,
      );
      if (n >= 1) drawAgentUpgradeLines(ctx, api, policyLines, 175, 440, 29, themeColors.blue, 65);
      else
        drawAgentUpgradeText(
          ctx,
          api,
          'Verified source pending',
          510,
          530,
          32,
          themeColors.muted,
          'center',
        );
      drawAgentUpgradePaper(
        ctx,
        api,
        140,
        790,
        740,
        155,
        'Account observation',
        n >= 2 ? themeColors.cyan : themeColors.muted,
      );
      drawAgentUpgradeText(
        ctx,
        api,
        n >= 2 ? 'A300 ·prod-api ·identity_verified=True' : 'Admitted account read pending',
        175,
        900,
        28,
        n >= 2 ? themeColors.cyan : themeColors.muted,
      );
      drawAgentUpgradePaper(
        ctx,
        api,
        1080,
        320,
        700,
        625,
        'Draft preserves both policy conditions',
        n >= 3 ? themeColors.green : themeColors.muted,
      );
      if (n >= 3) {
        drawAgentUpgradeLines(ctx, api, policyLines, 1115, 440, 27, themeColors.green, 65);
        drawAgentUpgradeText(ctx, api, 'Source: ' + POLICY_ID, 1115, 750, 28, themeColors.blue);
        drawAgentUpgradeText(
          ctx,
          api,
          'No access change requested or executed',
          1115,
          840,
          26,
          themeColors.yellow,
        );
      } else
        drawAgentUpgradeLines(
          ctx,
          api,
          ['Wait for verified evidence', 'AND admitted account context'],
          1120,
          535,
          30,
          themeColors.muted,
          100,
        );
      if (n >= 3) {
        drawAgentUpgradeArrow(ctx, api, 905, 535, 1050, 535, themeColors.blue);
        drawAgentUpgradeArrow(ctx, api, 905, 865, 1050, 865, themeColors.cyan);
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        n >= 4
          ? 'needs_human /draft_ready_for_review ·no retained restore packet'
          : 'Each observed prerequisite enables the next permitted action',
      );
    }
  });
}
export default {
  id: 'loop',
  draw: drawLoop,
  cues: [
    'policy-evidence',
    'account-context',
    'cited-draft',
    'review-stop',
    'state-transitions',
    'validated-action',
  ],
};
