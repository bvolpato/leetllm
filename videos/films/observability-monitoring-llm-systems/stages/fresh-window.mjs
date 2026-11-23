import { freshAdmissionConstruction } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawRectangle,
  withTarget,
} from '../defaults.mjs';
export function drawFreshWindow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat;
  {
    const s = freshAdmissionConstruction(state);
    drawHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Which limits block the next poll?'
        : currentBeat === 3
          ? 'One admitted dispatch · later checks remain fresh'
          : 'Same operation and markers',
    );
    if (currentBeat === 0)
      withTarget(ctx, api, 'fresh-premises', () => {
        drawCells(ctx, api, ['L', 'L', 'M', 'M'], 140, 350, 1620, 90);
        drawChapterCard(ctx, api, 'Repeat cap', '3', 140, 540, 510, themeColors.blue, 130);
        drawChapterCard(
          ctx,
          api,
          'Elapsed / deadline',
          '12s / 12s',
          705,
          540,
          510,
          themeColors.blue,
          130,
        );
        drawChapterCard(ctx, api, 'Spend limit', '10c', 1270, 540, 510, themeColors.blue, 130);
        drawChapterCard(ctx, api, 'Already spent', '6c', 140, 795, 760, themeColors.yellow, 130);
        drawChapterCard(
          ctx,
          api,
          'Proposed reservation',
          '5c',
          1000,
          795,
          760,
          themeColors.yellow,
          130,
        );
      });
    else {
      withTarget(
        ctx,
        api,
        currentBeat === 1 ? 'fresh-repeat' : currentBeat === 3 ? 'fresh-handoff' : 'fresh-dispatch',
        () => {
          drawCells(ctx, api, ['L', 'L', 'M', 'M'], 140, 350, 1620, 90, [
            themeColors.muted,
            themeColors.muted,
            themeColors.cyan,
            themeColors.cyan,
          ]);
          if (s.showRepeat)
            drawChapterText(
              ctx,
              api,
              'Consecutive M suffix: 2 < cap 3',
              140,
              510,
              31,
              themeColors.green,
            );
        },
      );
      withTarget(
        ctx,
        api,
        currentBeat === 1
          ? 'fresh-time'
          : currentBeat === 3
            ? 'fresh-handoff'
            : 'fresh-time-repair',
        () => {
          drawChapterCard(
            ctx,
            api,
            'Time operands',
            `elapsed 12s · deadline ${s.deadline}s`,
            140,
            595,
            760,
            themeColors.blue,
            130,
          );
          if (currentBeat === 1 && s.showTime)
            drawChapterText(ctx, api, 'Deadline reached · HOLD', 140, 800, 32, themeColors.pink);
          if (currentBeat >= 2 && s.showRepairedTime)
            drawChapterText(ctx, api, '16 − 12 = 4s left', 140, 800, 32, themeColors.green);
        },
      );
      withTarget(
        ctx,
        api,
        currentBeat === 1
          ? 'fresh-spend'
          : currentBeat === 3
            ? 'fresh-handoff'
            : 'fresh-spend-repair',
        () => {
          drawChapterCard(
            ctx,
            api,
            'Spend operands',
            `spent 6c · next ${Math.round(s.next * 100)}c · cap 10c`,
            1000,
            595,
            760,
            themeColors.yellow,
            130,
          );
          if (currentBeat === 1 && s.showSpend)
            drawChapterText(ctx, api, '6 + 5 = 11c > 10c · HOLD', 1000, 800, 32, themeColors.pink);
          if (currentBeat >= 2 && s.next === 0.05 && s.showRepairedTime)
            drawChapterText(
              ctx,
              api,
              '6 + 5 = 11c total · over limit',
              1000,
              800,
              31,
              themeColors.pink,
            );
        },
      );
      withTarget(ctx, api, currentBeat === 3 ? 'fresh-handoff' : 'fresh-dispatch', () => {
        if (currentBeat >= 2 && s.showRepairedSpend)
          drawChapterText(ctx, api, '6 + 3 = 9c ≤ 10c', 1000, 800, 32, themeColors.green);
        if (s.showDispatch) {
          drawChapterText(
            ctx,
            api,
            s.effects
              ? 'One dispatch admitted · calls sent: 1'
              : 'One dispatch admitted · request in flight',
            140,
            955,
            33,
            themeColors.green,
          );
          const x = 1380 + 250 * s.dispatchProgress;
          if (x > 1420) drawLine(ctx, api, 1410, 942, x - 10, 942, themeColors.green, 4);
          if (x + 160 < 1730) drawLine(ctx, api, x + 160, 942, 1730, 942, themeColors.green, 4);
          drawRectangle(ctx, api, x, 910, 150, 65, themeColors.panel, themeColors.cyan);
          drawChapterText(ctx, api, 'poll', x + 75, 953, 27, themeColors.cyan, 'center');
          if (currentBeat === 3)
            drawChapterText(
              ctx,
              api,
              'Next observation / reservation / deadline check: pending',
              140,
              1010,
              28,
              themeColors.yellow,
            );
        } else if (currentBeat >= 2)
          drawChapterText(
            ctx,
            api,
            'Dispatch held until all checks complete',
            140,
            955,
            30,
            themeColors.muted,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'fresh-window',
  draw: drawFreshWindow,
  cues: [
    'ob-fresh-window-1-1',
    'ob-fresh-window-1-2',
    'ob-fresh-window-1-3',
    'ob-fresh-window-1-4',
    'ob-fresh-window-1-5',
    'ob-fresh-window-1-6',
    'ob-fresh-window-2-1',
    'ob-fresh-window-2-2',
    'ob-fresh-window-2-3',
    'ob-fresh-window-2-4',
    'ob-fresh-window-3-1',
    'ob-fresh-window-3-2',
    'ob-fresh-window-3-3',
    'ob-fresh-window-3-4',
    'ob-fresh-window-3-5',
    'ob-fresh-window-4-1',
    'ob-fresh-window-4-2',
    'ob-fresh-window-4-3',
  ],
};
