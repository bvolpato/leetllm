import { researchConstructionModel } from '../model.mjs';
import { researchEvent } from '../construction.mjs';
import { earlyEpisodes, ledger } from '../evidence.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
} from '../defaults.mjs';
export function drawNegativeReport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('negative-report', state),
    currentBeat = modelState.b;
  api.focus.target('rs-negative-report-mechanism', () => {
    if (currentBeat === 2) {
      const row = ledger[6];
      api.text(ctx, 'Seed 6   /   Goals in the first 30 trips', 150, 300, 44, themeColors.ink);
      for (const [i, name] of ['shaped', 'sparse'].entries()) {
        const color = i ? themeColors.blue : themeColors.cyan;
        const y = 433 + i * 137;
        api.text(ctx, i ? 'Sparse' : 'Shaped', 150, y + 32, 39, color);
        for (let j = 0; j < earlyEpisodes; j++) {
          api.rect(
            ctx,
            460 + 36 * j,
            y - 20,
            28,
            67,
            j < row[name] ? color : themeColors.panel,
            themeColors.muted,
            3,
          );
        }
        api.text(ctx, `${row[name]} / ${earlyEpisodes}`, 1760, y + 32, 42, color, 'right');
      }
      if (researchEvent(scene.id, state, 2, 2) > 0) {
        api.text(ctx, 'Record each move on the rerun', 150, 781, 39, themeColors.ink);
        api.text(
          ctx,
          'Intended action     →     Slip draw     →     Next square',
          960,
          905,
          43,
          themeColors.yellow,
          'center',
        );
      }
      return;
    }
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat === 0 ? 'Repair the run' : 'Read the result against the study rules',
    );
    const sets = [
      ['zero-potential mismatch', 'compare the first differing update'],
      ['clean-clone failure', 'repair the inputs, dependencies or instructions'],
      ['interval crosses zero', 'report inconclusive under rule'],
      ['mean below 0.10 or final interval outside band', 'withhold support and retain all rows'],
    ];
    const visible = currentBeat === 0 ? 2 : 4;
    sets.slice(0, visible).forEach((r, i) => {
      const y = 350 + i * 135;
      drawResearchConstructionBox(ctx, api, r[0], 230, y, 600, 85, themeColors.pink, 28);
      drawResearchConstructionArrow(ctx, api, 865, y + 42, 1015, y + 42, themeColors.yellow);
      drawResearchConstructionBox(ctx, api, r[1], 1050, y, 650, 85, themeColors.cyan, 28);
    });
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Keep the original failure and the corrected attempt.'
        : 'Keep every planned seed in the report.',
    );
  });
}
export default {
  id: 'negative-report',
  draw: drawNegativeReport,
  cues: [
    'rs-negative-report-0',
    'rsx-negative-report-b0-s0',
    'rsx-negative-report-b0-s1',
    'rsx-negative-report-b0-s2',
    'rs-negative-report-1',
    'rsx-negative-report-b1-s0',
    'rsx-negative-report-b1-s1',
    'rsx-negative-report-b1-s2',
    'rs-negative-report-2',
    'rsx-negative-report-b2-s0',
    'rsx-negative-report-b2-s1',
    'rsx-negative-report-b2-s2',
    'rsx-negative-report-b2-s3',
  ],
};
