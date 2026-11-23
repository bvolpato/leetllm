import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawSourceEvidence(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const policyLines = [
    'Production API key access may be restored',
    'after identity verification.',
    'Privileged scopes require manager approval',
    'before access is queued.',
  ];
  api.focus.target('source-evidence-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat === 0) {
        drawAgentUpgradePaper(
          ctx,
          api,
          170,
          320,
          1550,
          470,
          'Fictional reviewed policy',
          themeColors.blue,
        );
        drawAgentUpgradeLines(ctx, api, policyLines, 230, 465, 38, themeColors.blue, 88);
        drawAgentUpgradeText(
          ctx,
          api,
          'Exact reviewed question only',
          960,
          890,
          35,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawAgentUpgradePaper(
          ctx,
          api,
          170,
          320,
          730,
          480,
          'Expected complete response',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'grounded /exact question',
            'Verbatim policy answer',
            'access-policy-us-v3',
            'Host source hash',
          ],
          215,
          455,
          29,
          themeColors.blue,
          85,
        );
        drawAgentUpgradePaper(
          ctx,
          api,
          1040,
          320,
          710,
          480,
          'Forged answer /same citation',
          themeColors.pink,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            '“Manager approval is optional”',
            'Citation ID unchanged',
            'Full response mismatch',
            'REJECT',
          ],
          1080,
          455,
          29,
          themeColors.pink,
          85,
        );
      } else {
        const rows = [
          ['Verified evidence', 'E'],
          ['Admitted account', 'A'],
          ['Cited draft', 'D'],
          ['Review stop', 'H'],
        ];
        rows.forEach(([name, letter], i) => {
          const x = 180 + i * 420;
          api.circle(
            ctx,
            x + 140,
            450,
            55,
            themeColors.panel,
            i < 2 ? themeColors.blue : themeColors.green,
            3,
          );
          drawAgentUpgradeText(
            ctx,
            api,
            letter,
            x + 140,
            469,
            44,
            i < 2 ? themeColors.blue : themeColors.green,
            'center',
          );
          drawAgentUpgradeText(ctx, api, name, x + 140, 605, 29, themeColors.ink, 'center');
          if (i < 3) drawAgentUpgradeArrow(ctx, api, x + 215, 450, x + 345, 450);
        });
        drawAgentUpgradeText(
          ctx,
          api,
          'E +A required before D; H creates no approval',
          960,
          800,
          38,
          themeColors.yellow,
          'center',
        );
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Exact fixture /not semantic retrieval, tenant authorization, learned extraction or hallucination benchmark',
      );
    }
  });
}
export default {
  id: 'source-evidence',
  draw: drawSourceEvidence,
  cues: ['source-evidence-b1', 'source-evidence-b2', 'source-evidence-b3'],
};
