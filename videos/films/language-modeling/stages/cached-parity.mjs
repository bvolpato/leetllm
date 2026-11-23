import { CACHE_PARITY_FIXTURE } from '../fixtures.mjs';
import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedGrid,
  drawExtendedHead,
  drawExtendedText,
  formatLanguage,
} from '../defaults.mjs';
export function drawCachedParity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('cached-parity', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('cached-parity-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Actual single-layer CPU test: reused rows match the full pass'
        : 'Decode query is at the end of the key history',
    );
    const f = CACHE_PARITY_FIXTURE;
    if (currentBeat === 0) {
      const stage = Math.min(2, Math.floor(S(0, 3) * 3)),
        length = [3, 4, 5][stage];
      drawExtendedText(
        ctx,
        api,
        'cached positions 0…' + (length - 1),
        485,
        340,
        29,
        themeColors.cyan,
        'center',
      );
      drawExtendedText(ctx, api, 'full causal output', 1390, 340, 29, themeColors.blue, 'center');
      drawExtendedGrid(
        ctx,
        api,
        f.cached.slice(0, length).map((r) => r.map((v) => formatLanguage(ctx, api, v, 3))),
        130,
        390,
        720,
        length * 80,
        themeColors.cyan,
        27,
      );
      drawExtendedGrid(
        ctx,
        api,
        f.full.map((r) => r.map((v) => formatLanguage(ctx, api, v, 3))),
        1040,
        390,
        720,
        400,
        themeColors.blue,
        27,
      );
      for (let i = 0; i < length; i++) {
        drawExtendedText(
          ctx,
          api,
          'p' + i,
          940,
          440 + i * 80,
          22,
          i < 3 ? themeColors.muted : themeColors.green,
          'center',
        );
        if (E(0, 4)) {
          api.arrow(ctx, 865, 430 + i * 80, 895, 430 + i * 80, themeColors.green, 3);
          api.arrow(ctx, 980, 430 + i * 80, 1020, 430 + i * 80, themeColors.green, 3);
        }
      }
      if (E(0, 4))
        drawExtendedText(
          ctx,
          api,
          'allclose(atol=10⁻⁶): true',
          960,
          925,
          35,
          themeColors.green,
          'center',
        );
    } else {
      const bad = S(1, 2) > 0 && !E(1, 3),
        allowed = bad ? [1, 0, 0, 0, 0] : [1, 1, 1, 1, 1];
      drawExtendedText(
        ctx,
        api,
        'query at absolute position 4',
        960,
        340,
        31,
        themeColors.yellow,
        'center',
      );
      ['key 0', 'key 1', 'key 2', 'key 3', 'key 4'].forEach((v, i) =>
        drawExtendedCell(
          ctx,
          api,
          v,
          190 + i * 315,
          415,
          270,
          70,
          allowed[i] ? themeColors.cyan : themeColors.muted,
          28,
        ),
      );
      drawExtendedGrid(
        ctx,
        api,
        [allowed.map((v) => (v ? 'allowed' : 'hidden'))],
        190,
        565,
        1530,
        75,
        bad ? themeColors.pink : themeColors.green,
        27,
      );
      if (S(1, 2) > 0) {
        const values = bad ? f.wrongUpperLeftOutput : f.allowedOutput;
        drawExtendedText(
          ctx,
          api,
          bad ? 'Upper-left nonsquare causal mask' : 'Explicit all-allowed decode row',
          960,
          735,
          31,
          bad ? themeColors.pink : themeColors.green,
          'center',
        );
        drawExtendedGrid(
          ctx,
          api,
          [values.map((v) => formatLanguage(ctx, api, v, 3))],
          440,
          810,
          1040,
          85,
          bad ? themeColors.pink : themeColors.green,
          30,
        );
      }
      drawExtendedFoot(
        ctx,
        api,
        'Fixed model, positions and attention policy · every decoder layer keeps its own K/V',
      );
    }
  });
}
export default {
  id: 'cached-parity',
  draw: drawCachedParity,
  cues: [
    'cached-parity-b1',
    'cached-parity-voice-1',
    'cached-parity-step-0-1',
    'cached-parity-step-0-2',
    'cached-parity-step-0-3',
    'cached-parity-step-0-4',
    'cached-parity-b2',
    'cached-parity-voice-2',
    'cached-parity-step-1-1',
    'cached-parity-step-1-2',
    'cached-parity-step-1-3',
    'cached-parity-step-1-4',
    'cached-parity-step-1-5',
    'cached-parity-step-1-6',
  ],
};
