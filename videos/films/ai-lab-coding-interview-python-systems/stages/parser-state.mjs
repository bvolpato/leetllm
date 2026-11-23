import { codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
} from '../defaults.mjs';
export function drawParserState(ctx, scene, state, api) {
  api.focus.target('ci-parser-state-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('parser-state', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat < 2) {
        drawHeading(
          ctx,
          api,
          currentBeat === 0
            ? 'Actual LOGS prefix · retain a current-record pointer'
            : 'Separate supplied malformed-header and extra-bar case',
        );
        modelState.lines.forEach((line, i) => {
          const y = 370 + i * 115;
          drawChapterCard(
            ctx,
            api,
            line,
            150,
            y,
            1550,
            80,
            i === modelState.index ? themeColors.yellow : themeColors.muted,
            line.length > 40 ? 23 : 27,
          );
          if (i === modelState.index) api.circle(ctx, 1770, y + 40, 12, themeColors.yellow);
        });
        const current = modelState.current;
        drawChapterCard(
          ctx,
          api,
          'current: ' + (current.current === null ? 'None' : 'record ' + current.current),
          190,
          860,
          570,
          100,
          current.current === null ? themeColors.pink : themeColors.cyan,
          30,
        );
        drawChapterCard(ctx, api, current.action, 900, 860, 820, 100, themeColors.green, 30);
        drawFooter(
          ctx,
          api,
          current.current === null
            ? 'A continuation has no attachment owner'
            : 'Message: ' + current.records[current.current].message,
        );
      } else {
        drawHeading(ctx, api, 'A streaming extension must retain partial lines between chunks');
        const line = 't1|INFO|a|b',
          split = Math.min('t1|INFO|a|b'.length, Math.floor(q * ('t1|INFO|a|b'.length + 1)));
        drawChapterCard(
          ctx,
          api,
          't1|INFO|a|b'.slice(0, split) || 'empty first chunk',
          200,
          440,
          650,
          115,
          themeColors.blue,
          34,
        );
        drawChapterCard(
          ctx,
          api,
          't1|INFO|a|b'.slice(split) || 'empty final chunk',
          1070,
          440,
          650,
          115,
          themeColors.cyan,
          34,
        );
        drawLine(ctx, api, 960, 385, 960, 650, themeColors.yellow, 4);
        drawChapterText(
          ctx,
          api,
          'split position ' + split,
          960,
          740,
          34,
          themeColors.yellow,
          'center',
        );
        drawChapterCard(
          ctx,
          api,
          'buffer partial line → join fragments once',
          280,
          850,
          1360,
          110,
          themeColors.green,
          32,
        );
        drawFooter(
          ctx,
          api,
          'The actual parser consumes whole text; this buffer contract remains an extension',
        );
      }
    }
  });
}
export default {
  id: 'parser-state',
  draw: drawParserState,
  cues: [
    'ci-parser-state-0-build',
    'ci-parser-state-1-build',
    'ci-parser-state-clear',
    'ci-parser-state-2-build',
  ],
};
