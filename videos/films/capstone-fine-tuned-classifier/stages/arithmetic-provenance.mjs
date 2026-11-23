import { clamp01 } from '../arithmetic.mjs';
import { GATE_CASES } from '../fixtures.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawArithmeticProvenance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id),
    done = (id) => cueProgress(id) >= 1;
  api.focus.target('score-provenance', () => {
    const invented = GATE_CASES.map((r) => ({
      fixture_id: r.id,
      score: r.gold,
    }));
    drawExpandedClassifierText(
      ctx,
      api,
      'Exact IDs and submitted policy fields remain fixed',
      960,
      295,
      31,
      themeColors.muted,
      'center',
    );
    invented.forEach((r, i) => {
      drawExpandedClassifierCard(
        ctx,
        api,
        'G' + (i + 1),
        210 + i * 260,
        390,
        190,
        themeColors.cyan,
        80,
        30,
      );
      if (cueProgress('provenance-invent') > i / 6)
        drawExpandedClassifierText(
          ctx,
          api,
          r.score,
          305 + i * 260,
          585,
          55,
          r.score ? themeColors.pink : themeColors.blue,
          'center',
        );
    });
    if (done('provenance-pass'))
      drawExpandedClassifierCard(
        ctx,
        api,
        'Arithmetic passes · model execution absent',
        360,
        700,
        1200,
        themeColors.yellow,
        100,
        35,
      );
    if (currentBeat === 1) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Read-only mapping',
        470,
        880,
        31,
        themeColors.cyan,
        'center',
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Authenticated process',
        1430,
        880,
        31,
        themeColors.pink,
        'center',
      );
      drawExpandedClassifierLine(ctx, api, 800, 835, 1100, 835, themeColors.pink, 4);
      drawExpandedClassifierText(ctx, api, '≠', 960, 890, 45, themeColors.pink, 'center');
    }
    if (currentBeat === 2) {
      drawExpandedClassifierCard(
        ctx,
        api,
        'Owned harness + fixed export + ticket',
        390,
        865,
        1140,
        themeColors.green,
        83,
        31,
      );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      'Provenance and behavioral correctness answer separate questions',
    );
  });
}
export default {
  id: 'arithmetic-provenance',
  draw: drawArithmeticProvenance,
  cues: ['provenance-invent', 'provenance-pass', 'provenance-proxy', 'provenance-boundary'],
};
