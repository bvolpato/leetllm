import { sourceFreshness } from '../arithmetic.mjs';
import { drawCenteredLine, drawFooter, drawPill, drawText } from '../defaults.mjs';
export function drawFreshnessBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-freshness-boundary-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    cueVisible = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('freshness-boundary-mechanism', () => {
    if (currentBeat === 0) {
      drawPill(ctx, api, 'heartbeat age 8 h', 500, 430, 620, themeColors.blue);
      drawPill(ctx, api, 'last write 08:59', 1430, 430, 680, themeColors.muted);
      drawPill(ctx, api, 'feature-as-of 08:30', 960, 640, 850, themeColors.cyan);
      if (cueVisible('lag'))
        drawText(ctx, api, '09:00 − 08:30 = 30 min source lag', 960, 840, 41, themeColors.yellow);
      drawFooter(ctx, api, 'A recent write can retain old source coverage');
    } else if (currentBeat === 1) {
      const seconds = [900, 901, 2700, 2701],
        keys = ['normal', 'degraded', 'edge', 'abstain'];
      drawText(
        ctx,
        api,
        'Exact duration first · display formatting second',
        960,
        290,
        35,
        themeColors.yellow,
      );
      seconds.forEach((v, i) => {
        const y = 420 + i * 130;
        drawPill(
          ctx,
          api,
          Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0') + ' source lag',
          450,
          y,
          620,
          themeColors.blue,
        );
        if (resultComplete(keys[i]))
          drawPill(
            ctx,
            api,
            sourceFreshness(0, v).mode,
            1430,
            y,
            670,
            i === 0 ? themeColors.green : i < 3 ? themeColors.yellow : themeColors.pink,
          );
      });
      if (cueVisible('future'))
        drawText(
          ctx,
          api,
          'Future progress → clock error · missing → unknown/abstain',
          960,
          975,
          31,
          themeColors.pink,
        );
    } else {
      drawPill(ctx, api, 'returned mode = degraded', 960, 390, 1120, themeColors.yellow);
      drawPill(ctx, api, 'fallback validation', 490, 625, 700, themeColors.blue);
      drawPill(ctx, api, 'actual model outcome', 1430, 625, 700, themeColors.cyan);
      drawCenteredLine(
        ctx,
        api,
        'Mode selection executes neither a fallback model nor its calibration',
        865,
        themeColors.pink,
      );
      drawFooter(
        ctx,
        api,
        'Read latency, source freshness and predictive quality require separate measurements',
      );
    }
  });
}
export default {
  id: 'freshness-boundary',
  draw: drawFreshnessBoundary,
  cues: [
    'sf-freshness-boundary-threeclocks',
    'sf-freshness-boundary-lag',
    'sf-freshness-boundary-normal',
    'sf-freshness-boundary-degraded',
    'sf-freshness-boundary-edge',
    'sf-freshness-boundary-abstain',
    'sf-freshness-boundary-future',
    'sf-freshness-boundary-scope',
  ],
};
