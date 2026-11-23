import { POLICY_HASH, operation, reviewed } from '../model.mjs';
import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawApproval(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  api.focus.target('approval-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat < 2) {
        drawAgentUpgradePaper(
          ctx,
          api,
          150,
          320,
          800,
          590,
          'SQLite packets /retained across processes',
          themeColors.yellow,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'r-104 /A300 /prod-api',
            'Policy SHA ' + POLICY_HASH.slice(0, 16),
            'Exact cited policy draft',
            'Expiry:1300',
            'Operation ' + operation.slice(0, 18),
          ],
          195,
          465,
          30,
          themeColors.yellow,
          80,
        );
        drawAgentUpgradePaper(
          ctx,
          api,
          1120,
          365,
          640,
          370,
          'SQLite approvals /manager-1 fixture',
          currentBeat ? themeColors.green : themeColors.muted,
        );
        if (currentBeat) {
          drawAgentUpgradeLines(
            ctx,
            api,
            ['APPROVED =1', 'Full-packet SHA', reviewed.slice(0, 20)],
            1160,
            510,
            29,
            themeColors.green,
            75,
          );
          drawAgentUpgradeArrow(ctx, api, 985, 590, 1085, 590, themeColors.yellow);
        } else
          drawAgentUpgradeText(
            ctx,
            api,
            'No review recorded',
            1440,
            570,
            32,
            themeColors.muted,
            'center',
          );
        drawAgentUpgradeText(
          ctx,
          api,
          'Separate OS processes read persisted rows',
          1440,
          865,
          28,
          themeColors.blue,
          'center',
        );
      } else {
        drawAgentUpgradeText(
          ctx,
          api,
          'Stable operation payload',
          380,
          340,
          35,
          themeColors.blue,
          'center',
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          ['Ticket', 'Account', 'Scope', 'Policy hash', 'Exact draft'],
          220,
          465,
          34,
          themeColors.blue,
          76,
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Expiration on first insert',
          1200,
          465,
          34,
          themeColors.yellow,
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Restaging does not extend it',
          1200,
          560,
          30,
          themeColors.yellow,
        );
        api.path(
          ctx,
          [
            {
              x: 650,
              y: 390,
            },
            {
              x: 850,
              y: 390,
            },
            {
              x: 850,
              y: 787,
            },
            {
              x: 1010,
              y: 787,
            },
          ],
          {
            color: themeColors.cyan,
            width: 3,
          },
        );
        drawAgentUpgradeBox(
          ctx,
          api,
          'Full packet review includes expiry',
          1040,
          740,
          710,
          95,
          themeColors.green,
        );
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Protected store +authenticated reviewer needed ·BEGIN IMMEDIATE /one SQLite writer /unique effect key',
      );
    }
  });
}
export default {
  id: 'approval',
  draw: drawApproval,
  cues: [
    'retained-operation',
    'review-expiration',
    'persisted-review',
    'authenticated-review',
    'approval-core-3',
  ],
};
