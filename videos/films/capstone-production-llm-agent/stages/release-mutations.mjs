import {
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawReleaseMutations(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  api.focus.target('release-mutations-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat === 0) {
        const names = ['urgent', 'stale', 'draft', 'injection', 'forbidden', 'replay'],
          mutated = ['urgent', 'stale', 'draft', 'injection', 'forbidden', 'forbidden'];
        drawAgentUpgradeText(
          ctx,
          api,
          'Exactly one of each required identity',
          960,
          320,
          36,
          themeColors.yellow,
          'center',
        );
        [names, mutated].forEach((xs, row) =>
          xs.forEach((v, i) =>
            drawAgentUpgradeBox(
              ctx,
              api,
              v,
              150 + i * 285,
              430 + row * 230,
              255,
              90,
              row === 1 && i === 5 ? themeColors.pink : themeColors.blue,
            ),
          ),
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Original inventory:PASS',
          960,
          600,
          31,
          themeColors.green,
          'center',
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Six rows /missing replay /duplicate forbidden →HOLD',
          960,
          850,
          34,
          themeColors.pink,
          'center',
        );
      } else if (currentBeat === 1) {
        drawAgentUpgradePaper(
          ctx,
          api,
          180,
          330,
          730,
          470,
          'Forbidden-action trace row',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'action: restore_access',
            'executed: False →True',
            'observed effects:0',
            'Grade dispatch mismatch',
          ],
          225,
          470,
          31,
          themeColors.pink,
          80,
        );
        drawAgentUpgradePaper(
          ctx,
          api,
          1030,
          330,
          710,
          470,
          'Strict report shape and types',
          themeColors.yellow,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'Effect count:1 →Boolean True',
            'Numerical equality is not type equality',
            'Extra passed=True →invalid row',
            'No supplied pass flag can certify',
          ],
          1070,
          470,
          28,
          themeColors.yellow,
          80,
        );
      } else {
        drawAgentUpgradeText(
          ctx,
          api,
          'Unchanged6-episode result',
          960,
          350,
          36,
          themeColors.blue,
          'center',
        );
        drawAgentUpgradeBox(ctx, api, 'fixture_suite_pass', 460, 480, 1000, 130, themeColors.green);
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'Not live model quality or deployment permission',
            'Exact order is this deterministic regression contract',
            'Trusted run-to-build producer still required',
          ],
          440,
          760,
          31,
          themeColors.yellow,
          75,
        );
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Grade observations /candidate +dataset +grader identities /fresh effects database',
      );
    }
  });
}
export default {
  id: 'release-mutations',
  draw: drawReleaseMutations,
  cues: ['release-mutations-b1', 'release-mutations-b2', 'release-mutations-b3'],
};
