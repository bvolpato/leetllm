import { researchEvent } from '../construction.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionDot,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawPaperTriage(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const E = (beat, sentence) => researchEvent('paper-triage', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-paper-triage-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'From the reward formula to a question about learning',
    );
    const rows = [
      ['SOURCE · policy-invariance conditions', 'F(s,s′) = γΦ(s′) − Φ(s)'],
      ['ADAPTATION · this local study', '7 states · tabular Q · finite seeds'],
      ['UNRESOLVED · learning mechanism', 'Which event caused a seed regression?'],
    ];
    rows.forEach((r, i) => {
      const y = 370 + i * 165,
        active = i === 0 || (i === 1 && E(0, 2) > 0) || (i === 2 && E(2, 3) > 0);
      if (!active) return;
      drawResearchConstructionLine(ctx, api, 225, y + 42, 420, y + 42, themeColors.cyan, 5);
      drawResearchConstructionDot(ctx, api, 225, y + 42, themeColors.cyan, 14);
      drawResearchConstructionText(ctx, api, r[0], 470, y + 20, 31, themeColors.cyan);
      drawResearchConstructionText(ctx, api, r[1], 470, y + 77, 33, themeColors.ink);
      if (i < 2)
        drawResearchConstructionArrow(ctx, api, 225, y + 65, 225, y + 137, themeColors.muted);
    });
    if (resultComplete(2, 1))
      drawResearchConstructionBox(
        ctx,
        api,
        'source section → retained claim record',
        480,
        880,
        960,
        75,
        themeColors.yellow,
        29,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'Three reading passes: classify → inspect → reconstruct',
    );
  });
}
export default {
  id: 'paper-triage',
  draw: drawPaperTriage,
  cues: [
    'rs-paper-triage-0',
    'rsx-paper-triage-b0-s0',
    'rsx-paper-triage-b0-s1',
    'rsx-paper-triage-b0-s2',
    'rsx-paper-triage-b0-s3',
    'rs-paper-triage-1',
    'rsx-paper-triage-b1-s0',
    'rsx-paper-triage-b1-s1',
    'rsx-paper-triage-b1-s2',
    'rsx-paper-triage-b1-s3',
    'rs-paper-triage-2',
    'rsx-paper-triage-b2-s0',
    'rsx-paper-triage-b2-s1',
    'rsx-paper-triage-b2-s2',
    'rsx-paper-triage-b2-s3',
  ],
};
