import {
  cueProgress,
  drawEvidenceBox,
  drawLine,
  drawRectangle,
  drawRoles,
  drawRow,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawValuesEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) >= 1;
  {
    if (currentBeat === 0) {
      drawRow(
        ctx,
        api,
        'values-actions',
        [
          'Reliability\nretry failure state',
          'Safety\npermission check',
          'Humility\nupdate after failed test',
        ],
        315,
      );
      const p = cueProgress(ctx, api, 'values-evidence-artifact');
      withFocus(ctx, api, 'value-artifact', () => {
        const x = 400 + 560 * p,
          y = 600;
        drawRectangle(ctx, api, x - 280, y - 55, 560, 110, themeColors.panel, themeColors.blue);
        drawText(ctx, api, 'Your artifact: release check', x, y + 8, 31, themeColors.blue);
        drawLine(ctx, api, 960, 440, x, y - 75, themeColors.yellow);
      });
      withFocus(ctx, api, 'value-consequence', () => {
        const keep = resultComplete('values-evidence-consequence');
        drawEvidenceBox(
          ctx,
          api,
          'values-evidence-gate',
          'Known access failure',
          240,
          790,
          620,
          95,
          themeColors.pink,
        );
        drawEvidenceBox(
          ctx,
          api,
          'values-evidence-traffic',
          keep ? 'Candidate 0%' : 'Candidate share pending',
          1080,
          790,
          600,
          95,
          keep ? themeColors.green : themeColors.muted,
        );
      });
    } else {
      drawRoles(ctx, api, 'value-owners', 380);
      withFocus(ctx, api, 'value-truth', () => {
        const p = cueProgress(ctx, api, 'values-evidence-truth');
        ['School project', 'Replication', 'Open source', 'Non-ML incident'].forEach((s, i) => {
          const x = 170 + i * 440;
          drawRectangle(ctx, api, x, 690, 380, 90, themeColors.panel, themeColors.muted);
          drawText(ctx, api, s, x + 190, 745, 27, themeColors.ink);
        });
        drawText(
          ctx,
          api,
          'Choose an artifact whose work you can defend',
          960,
          920,
          34,
          themeColors.yellow,
        );
        if (p > 0) drawLine(ctx, api, 960, 520, 960, 655, themeColors.yellow, 4);
      });
    }
  }
}
export default {
  id: 'values-evidence',
  draw: drawValuesEvidence,
  cues: [
    'values-evidence-artifact',
    'values-evidence-consequence',
    'values-evidence-owners',
    'values-evidence-truth',
  ],
};
