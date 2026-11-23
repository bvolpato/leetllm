import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
} from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  api.focus.target('intro-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat < 2) {
        drawAgentUpgradePaper(
          ctx,
          api,
          160,
          315,
          760,
          340,
          'Policy inquiry r-104',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            '“What is the access policy for a',
            'disabled production API key?”',
            'Scope: read +draft',
          ],
          200,
          450,
          32,
          themeColors.blue,
          70,
        );
        drawAgentUpgradePaper(ctx, api, 1110, 315, 650, 340, 'Useful output', themeColors.cyan);
        drawAgentUpgradeLines(
          ctx,
          api,
          ['Retrieve reviewed policy', 'Prepare a cited reply', 'Stop for review'],
          1150,
          450,
          30,
          themeColors.cyan,
          70,
        );
        drawAgentUpgradeArrow(ctx, api, 950, 485, 1075, 485);
        drawAgentUpgradeBox(
          ctx,
          api,
          'Separate operator request',
          160,
          770,
          760,
          100,
          themeColors.yellow,
        );
        drawAgentUpgradeBox(
          ctx,
          api,
          'Retained write packet +review',
          1110,
          770,
          650,
          100,
          themeColors.green,
        );
        drawAgentUpgradeArrow(ctx, api, 950, 820, 1075, 820, themeColors.yellow);
        drawAgentUpgradeFooter(
          ctx,
          api,
          'A review stop creates no restore request and grants no write authority',
        );
      } else {
        drawAgentUpgradePaper(
          ctx,
          api,
          200,
          330,
          820,
          530,
          'Runnable local repository',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'assets/production_agent.py',
            'draft /stage /approve /execute',
            'count /evaluate',
            'Standard-library Python +SQLite',
          ],
          240,
          485,
          32,
          themeColors.blue,
          90,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'access-agent-fixture-v4',
            'access-agent-episodes-v2',
            'trajectory-gate-v2',
            'Schema4 /fresh file /no v3 migration',
          ],
          1160,
          440,
          29,
          themeColors.yellow,
          110,
        );
        drawAgentUpgradeFooter(
          ctx,
          api,
          'Fixture identities identify an experiment; they do not authenticate a caller or evidence producer',
        );
      }
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['policy-inquiry', 'operator-request', 'path-boundary', 'observed-effect', 'intro-core-3'],
};
