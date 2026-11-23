import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawRoundCpu(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  const vec = (s, v, x, y, color) => {
    drawConstructionsText(ctx, api, s, x, y, 29, color);
    drawConstructionsText(
      ctx,
      api,
      '[' + v.map((n) => (typeof n === 'number' ? n.toFixed(3) : n)).join(', ') + ']',
      x,
      y + 46,
      31,
      color,
    );
  };
  api.focus.target('sd-round-cpu-mechanism', () => {
    drawConstructionsCenter(ctx, api, 'Actual CPU table fixture · noon / dawn / dusk', 245);
    const rows = [
      ['empty prefix', [0.4, 0.5, 0.1], [0.6, 0.3, 0.1]],
      ['after noon', [0.1, 0.6, 0.3], [0.6, 0.3, 0.1]],
      ['after dusk', [0.3, 0.2, 0.5], [0.2, 0.3, 0.5]],
    ];
    if (currentBeat === 0) {
      rows.forEach(([name, pv, qv], i) => {
        const y = 370 + i * 200;
        drawConstructionsBox(ctx, api, name, 170, y, 420, themeColors.blue);
        vec('target p', pv, 690, y + 5, themeColors.blue);
        vec('proposal q', qv, 1230, y + 5, themeColors.cyan);
      });
      drawConstructionsCenter(
        ctx,
        api,
        'Serial Python lookups represent the aligned verification rows',
        1015,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const cases = [
        ['reject at 1', 'sd-round-first', ['dawn']],
        ['reject at 2', 'sd-round-second', ['noon', 'dusk']],
        ['full accept', 'sd-round-bonus', ['noon', 'noon', 'dawn']],
      ];
      cases.forEach(([name, key, tokens], i) => {
        const y = 370 + i * 210;
        drawConstructionsBox(ctx, api, name, 150, y, 410, themeColors.blue);
        drawConstructionsText(ctx, api, 'draft: noon → noon', 600, y + 48, 29, themeColors.muted);
        if (done(1, key)) {
          api.arrow(ctx, 980, y + 40, 1130, y + 40, themeColors.green, 4);
          drawConstructionsBox(ctx, api, tokens.join(' → '), 1170, y, 610, themeColors.green);
        }
      });
    } else {
      const cases = [
        ['depth 0', 'ordinary target sample'],
        ['p = q', 'bonus; no residual divide'],
        ['disjoint p/q', 'first-position correction'],
        ['invalid type/law', 'reject before sampling'],
        ['EOS / cap', 'emit in order; drop later tokens'],
      ];
      cases.forEach(([name, out], i) => {
        drawConstructionsBox(ctx, api, name, 180, 335 + i * 135, 500, themeColors.blue, 75);
        api.arrow(ctx, 720, 375 + i * 135, 980, 375 + i * 135, themeColors.cyan, 3);
        drawConstructionsBox(ctx, api, out, 1050, 335 + i * 135, 700, themeColors.cyan, 75);
      });
    }
  });
  return;
}
export default {
  id: 'round-cpu',
  draw: drawRoundCpu,
  cues: [
    'sd-round-cpu-b0',
    'sd-round-cpu-b1',
    'sd-round-first',
    'sd-round-second',
    'sd-round-bonus',
    'sd-round-cpu-b2',
  ],
};
