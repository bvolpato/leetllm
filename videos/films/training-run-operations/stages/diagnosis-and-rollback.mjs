import { trainingCompleted, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawDiagnosisAndRollback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  api.focus.target('diagnosis-and-rollback-mechanism', () => {
    if (beat === 0) {
      drawText(
        ctx,
        api,
        'Supplied per-rank clocks · separate compute, arrival and completion',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const scale = 130;
      for (let rank = 0; rank < 3; rank++) {
        const y = 380 + rank * 180,
          compute = 4 + rank * 2;
        drawText(ctx, api, 'Rank ' + rank, 180, y + 70, 31, colors[rank]);
        drawBox(ctx, api, 370, y, compute * scale, 110, colors[rank]);
        drawText(
          ctx,
          api,
          'compute',
          370 + (compute * scale) / 2,
          y + 70,
          30,
          colors[rank],
          'center',
        );
        if (compute < 8) {
          drawBox(
            ctx,
            api,
            370 + compute * scale,
            y,
            (8 - compute) * scale,
            110,
            themeColors.yellow,
          );
          drawText(
            ctx,
            api,
            'arrival skew',
            370 + (compute + (8 - compute) / 2) * scale,
            y + 70,
            26,
            themeColors.yellow,
            'center',
          );
        }
        drawBox(ctx, api, 370 + 8 * scale, y, 2 * scale, 110, themeColors.cyan);
        drawText(ctx, api, 'complete', 370 + 9 * scale, y + 70, 26, themeColors.cyan, 'center');
      }
      drawFooter(
        ctx,
        api,
        'An early rank waits for the last arrival. Compare the timing under the same load.',
      );
    } else if (beat <= 2) {
      const corrected =
        beat === 2 && trainingCompleted(state, 'diagnosis-keep-answer', state.beatP > 0.25);
      const divide =
        beat === 2 && trainingStarted(state, 'diagnosis-and-rollback-step-2', state.beatP > 0.12);
      const counted = beat === 2 && trainingStarted(state, 'diagnosis-count', state.beatP > 0.04);
      const mask = [0, 0, Number(corrected)];
      const targets = mask.reduce((sum, bit) => sum + bit, 0);
      drawText(ctx, api, 'GPU canary', 268, 287, 36, themeColors.ink);
      for (let i = 0; i < 8; i++) api.circle(ctx, 590 + 56 * i, 275, 13, themeColors.green);
      drawText(ctx, api, '8 passed', 1090, 287, 36, themeColors.green);
      drawText(ctx, api, 'Prompt', 730, 444, 35, themeColors.blue, 'center');
      drawText(ctx, api, 'Answer', 1280, 444, 35, themeColors.cyan, 'center');
      const words = ['Snow', 'is', 'cold'];
      api.focus.target('target-mask', () => {
        drawText(ctx, api, 'Mask', 268, 689, 38, themeColors.ink);
        words.forEach((word, i) => {
          const x = 550 + i * 365;
          drawCell(
            ctx,
            api,
            word,
            x - 153,
            474,
            306,
            103,
            i === 2 ? themeColors.cyan : themeColors.blue,
            56,
          );
          drawText(
            ctx,
            api,
            mask[i],
            x,
            695,
            59,
            mask[i] ? themeColors.green : themeColors.muted,
            'center',
            'mono',
          );
        });
      });
      api.focus.target('mask-mean', () => {
        const label = corrected
          ? 'Mean loss = loss on “cold” / ' + targets
          : divide
            ? 'Mean loss = 0 / ' + targets + ' → undefined'
            : counted
              ? targets + ' answer words kept'
              : 'How many answer words count?';
        drawText(
          ctx,
          api,
          label,
          960,
          891,
          58,
          corrected ? themeColors.green : divide ? themeColors.pink : themeColors.ink,
          'center',
        );
      });
    } else {
      drawText(
        ctx,
        api,
        'Locate the first affected state before choosing a rollback',
        960,
        285,
        36,
        themeColors.blue,
        'center',
      );
      drawLine(ctx, api, 260, 560, 1690, 560, themeColors.muted, 5);
      [
        [1600, 420, 'best evaluation', themeColors.cyan],
        [1840, 1000, 'latest resumable', themeColors.green],
        [1841, 1580, 'nonfinite · no publish', themeColors.pink],
      ].forEach(([n, x, label, color]) => {
        api.circle(ctx, x, 560, 24, color);
        drawText(ctx, api, n, x, 470, 43, color, 'center', 'mono');
        drawText(ctx, api, label, x, 680, 29, color, 'center');
      });
      drawBox(ctx, api, 520, 795, 880, 130, themeColors.yellow);
      drawText(
        ctx,
        api,
        'Keep evidence · replay with bounded retries',
        960,
        875,
        35,
        themeColors.yellow,
        'center',
      );
      drawFooter(
        ctx,
        api,
        'Keep the suspect batch and its position so the next run can replay it.',
      );
    }
  });
}
export default {
  id: 'diagnosis-and-rollback',
  draw: drawDiagnosisAndRollback,
  cues: [
    'diagnosis-and-rollback-step-1',
    'diagnosis-clock',
    'diagnosis-and-rollback-step-2',
    'diagnosis-mask',
    'diagnosis-count',
    'diagnosis-keep-answer',
    'diagnosis-and-rollback-step-3',
    'diagnosis-nonfinite',
  ],
};
