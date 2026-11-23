import {
  drawAxis,
  drawCenteredLine,
  drawFooter,
  drawPill,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawSourceProgress(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-source-progress-' + k],
    cueVisible = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('source-progress-mechanism', () => {
    if (currentBeat === 0) {
      drawPill(ctx, api, 'Q3 − 5 · stored REJECTED outcome', 960, 350, 1280, themeColors.pink);
      drawPill(ctx, api, 'separate Q4 +10 · backlog 12', 960, 560, 1240, themeColors.blue);
      if (cueVisible('persist'))
        drawText(
          ctx,
          api,
          'Q3 retry still rejected · backlog remains 12',
          960,
          770,
          39,
          themeColors.pink,
        );
      if (cueVisible('order'))
        drawFooter(
          ctx,
          api,
          'Source-order deltas assumed; buffer or reconcile genuinely reordered changes',
        );
      else
        drawFooter(
          ctx,
          api,
          'A retry reuses the first decision rather than trying arithmetic again',
        );
    } else if (currentBeat === 1) {
      const x = drawAxis(ctx, api, 0, 14, 590);
      drawRectangle(
        ctx,
        api,
        x(0),
        430,
        x(7) - x(0),
        75,
        themeColors.blue + '25',
        themeColors.blue,
      );
      drawRectangle(
        ctx,
        api,
        x(0),
        680,
        x(14) - x(0),
        75,
        themeColors.yellow + '25',
        themeColors.yellow,
      );
      drawText(ctx, api, 'Store keeps IDs for 7 days', x(3.5), 480, 32, themeColors.blue);
      drawText(ctx, api, 'Source can replay 14 days', x(7), 730, 32, themeColors.yellow);
      if (cueVisible('expire')) {
        api.circle(ctx, x(10), 590, 15, themeColors.pink);
        drawText(ctx, api, 'Q1 retry on day 10', x(10), 555, 34, themeColors.pink);
        drawText(
          ctx,
          api,
          'retry after ID expired can apply twice',
          960,
          890,
          36,
          themeColors.pink,
        );
      }
    } else {
      const committed = cue('kafka')?.phase === 'after';
      if (committed) {
        drawRectangle(ctx, api, 160, 380, 1000, 430, themeColors.panel, themeColors.blue);
        drawText(ctx, api, 'Kafka transaction', 660, 450, 36, themeColors.blue);
      } else {
        drawText(ctx, api, 'Which writes commit together?', 960, 350, 42, themeColors.yellow);
      }
      drawPill(ctx, api, 'output topic records', 660, 560, 750, themeColors.cyan);
      drawPill(ctx, api, 'consumed offsets', 660, 710, 750, themeColors.cyan);
      drawPill(ctx, api, 'Redis write', 1525, 625, 490, themeColors.cyan);
      if (cue('sink')?.phase === 'after')
        drawText(ctx, api, 'commits at the destination', 1525, 750, 30, themeColors.pink);
      if (cueVisible('commit'))
        drawCenteredLine(
          ctx,
          api,
          'Recover the sink write and its source offset together.',
          935,
          themeColors.yellow,
        );
    }
  });
}
export default {
  id: 'source-progress',
  draw: drawSourceProgress,
  cues: [
    'sf-source-progress-persist',
    'sf-source-progress-order',
    'sf-source-progress-expire',
    'sf-source-progress-concurrent',
    'sf-source-progress-bytes',
    'sf-source-progress-kafka',
    'sf-source-progress-sink',
    'sf-source-progress-commit',
  ],
};
