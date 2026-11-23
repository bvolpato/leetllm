import { spoken } from '../arithmetic.mjs';
import {
  drawProfileChapterCard,
  drawProfileChapterTable,
  drawProfileChapterText,
} from '../defaults.mjs';
export function drawRooflineDiagnosis(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    P = (cue, beat = currentBeat) => spoken(state, cue, beat);
  api.focus.target('roofline-diagnosis-mechanism', () => {
    if (currentBeat === 0) {
      const nearFloor = P('near-floor', 0);
      const extra = 4 * (1 - nearFloor);
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Hypothetical device-memory counter   ·   ' + Number((12 + extra).toFixed(1)) + ' bytes / element',
        960,
        285,
        34,
        themeColors.ink,
        'center',
      );
      api.rect(ctx, 240, 430, 1080, 130, themeColors.blue, undefined, 0);
      if (extra > 0) api.rect(ctx, 1320, 430, 90 * extra, 130, themeColors.pink, undefined, 0);
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        '12 useful bytes',
        780,
        510,
        41,
        themeColors.bg,
        'center',
      );
      if (extra === 4) drawProfileChapterText(
        ctx,
        api,
        themeColors,
        '4 extra',
        1500,
        510,
        36,
        themeColors.bg,
        'center',
      );
      if (P('excess-traffic', 0) > 0)
        drawProfileChapterCard(
          ctx,
          api,
          themeColors,
          components,
          nearFloor === 1 ? 'Read X once, read Z once, write Y once.' : 'Change access order. Measure traffic and clean latency again.',
          230,
          750,
          1460,
          themeColors.yellow,
          130,
          35,
        );
    } else if (currentBeat === 1) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Keep the operation and dtype fixed for attribution',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Observation', 'Possible mechanism', 'Required follow-up'],
          [
            'low compute utilization',
            'memory / dependency / starvation',
            'matching counters + trace',
          ],
          ['high memory utilization', 'useful traffic or wasted transfers', 'bytes per element'],
        ],
        150,
        380,
        1620,
        320,
        29,
      );
      if (P('controlled-followup', 1) > 0)
        drawProfileChapterCard(
          ctx,
          api,
          themeColors,
          components,
          'Change one access-order factor · remeasure bytes and clean latency',
          240,
          820,
          1440,
          themeColors.green,
          100,
          32,
        );
    } else {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Separate system trace · a kernel can be efficient while requests wait',
        960,
        285,
        33,
        themeColors.ink,
        'center',
      );
      drawProfileChapterText(ctx, api, themeColors, 'CPU prep', 170, 450, 31, themeColors.blue);
      api.rect(ctx, 410, 405, 900, 90, themeColors.blue, undefined, 0);
      drawProfileChapterText(ctx, api, themeColors, 'GPU idle', 170, 650, 31, themeColors.muted);
      api.rect(ctx, 410, 605, 900, 90, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 1310, 605, 400, 90, themeColors.cyan, undefined, 0);
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Kernel',
        1510,
        660,
        30,
        themeColors.bg,
        'center',
      );
      if (P('system-critical-path', 2) > 0)
        drawProfileChapterText(
          ctx,
          api,
          themeColors,
          'Measure the critical path before tuning an isolated roof',
          960,
          865,
          36,
          themeColors.yellow,
          'center',
        );
    }
  });
}
export default {
  id: 'roofline-diagnosis',
  draw: drawRooflineDiagnosis,
  cues: ['excess-traffic', 'near-floor', 'controlled-followup', 'system-critical-path'],
};
