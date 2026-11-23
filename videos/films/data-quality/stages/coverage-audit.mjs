import {
  drawConstructionArrow,
  drawConstructionLine,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawCoverageAudit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'coverage-audit'}-voice-${currentBeat + 1}`);
  api.focus.target('coverage-audit-construction', () => {
    if (currentBeat === 0) {
      drawConstructionText(
        ctx,
        api,
        'Actual six-row candidate · every structural check passed',
        160,
        300,
        33,
        themeColors.cyan,
      );
      drawConstructionText(ctx, api, 'standard', 990, 400, 31, themeColors.cyan, 'center');
      drawConstructionText(ctx, api, 'escalate', 1430, 400, 31, themeColors.yellow, 'center');
      const cfg = [
        ['train', 0, 3, 'coverage-train'],
        ['validation', 2, 0, 'coverage-validation'],
        ['test', 1, 0, 'coverage-test'],
      ];
      cfg.forEach(([split, std, esc, cue], i) => {
        const yy = 520 + i * 155;
        drawConstructionText(ctx, api, split, 270, yy, 35, themeColors.blue);
        const visible = done(cue);
        [std, esc].forEach((n, j) => {
          const x = 770 + j * 440;
          api.rect(
            ctx,
            x,
            yy - 65,
            420,
            105,
            themeColors.panel,
            visible && n === 0 ? themeColors.pink : themeColors.muted,
            2,
          );
          drawConstructionText(
            ctx,
            api,
            visible ? n : '?',
            x + 210,
            yy + 5,
            48,
            visible ? (n === 0 ? themeColors.pink : themeColors.green) : themeColors.muted,
            'center',
          );
        });
      });
      drawConstructionNote(
        ctx,
        api,
        'A missing class is a coverage failure, not a file-format failure.',
      );
    } else if (currentBeat === 1) {
      drawConstructionText(
        ctx,
        api,
        'A supplied distance example · not a significance test',
        160,
        300,
        33,
        themeColors.cyan,
      );
      const x = (n) => 350 + (n - 1) * 360;
      drawConstructionLine(ctx, api, x(1), 520, x(4), 520, themeColors.muted, 3);
      drawConstructionLine(ctx, api, x(1), 790, x(4), 790, themeColors.muted, 3);
      for (let n = 1; n <= 4; n++) {
        drawConstructionText(ctx, api, n, x(n), 470, 29, themeColors.muted, 'center');
        drawConstructionText(ctx, api, n, x(n), 875, 29, themeColors.muted, 'center');
      }
      for (let i = 0; i < 3; i++) {
        api.circle(ctx, x(i + 1), 520, 18, themeColors.blue);
        const px = api.lerp(x(i + 1), x(i + 2), v);
        api.circle(ctx, px, 790, 18, themeColors.cyan);
        drawConstructionArrow(ctx, api, x(i + 1), 560, px, 750, themeColors.cyan);
      }
      drawConstructionText(
        ctx,
        api,
        'Equal masses move one length unit each',
        960,
        950,
        35,
        themeColors.cyan,
        'center',
      );
      drawConstructionNote(
        ctx,
        api,
        'Ties, dependent groups and sparse expected counts constrain inferential tests.',
      );
    } else {
      drawConstructionText(
        ctx,
        api,
        'Keep group boundaries and the evaluation decision together',
        160,
        300,
        32,
        themeColors.cyan,
      );
      const p = drawConstructionP(ctx, api, 'coverage-hold');
      drawConstructionSheet(
        ctx,
        api,
        'v1 · six reviewed rows',
        'missing classes → HOLD',
        160,
        430,
        710,
        145,
        themeColors.pink,
      );
      drawConstructionSheet(
        ctx,
        api,
        'v2 · proposed collection',
        'more reviewed groups, new artifact',
        1010,
        430,
        740,
        145,
        themeColors.yellow,
      );
      if (p > 0) drawConstructionArrow(ctx, api, 890, 500, 990, 500, themeColors.yellow);
      drawConstructionText(
        ctx,
        api,
        'test score already observed',
        960,
        745,
        34,
        themeColors.muted,
        'center',
      );
      drawConstructionArrow(ctx, api, 1280, 805, 570, 805, themeColors.pink);
      drawConstructionLine(ctx, api, 900, 765, 1000, 855, themeColors.pink, 5);
      drawConstructionText(
        ctx,
        api,
        'Moving test rows now spends that test on development',
        960,
        940,
        31,
        themeColors.pink,
        'center',
      );
    }
  });
}
export default {
  id: 'coverage-audit',
  draw: drawCoverageAudit,
  cues: [
    'coverage-audit-b1',
    'coverage-audit-voice-1',
    'coverage-train',
    'coverage-validation',
    'coverage-test',
    'coverage-audit-b2',
    'coverage-audit-voice-2',
    'coverage-audit-b3',
    'coverage-audit-voice-3',
    'coverage-hold',
  ],
};
