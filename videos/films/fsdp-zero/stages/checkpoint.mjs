import { bounded } from '../arithmetic.mjs';
import { adamContinuation } from '../model.mjs';
import {
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawCheckpoint(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id, a = 0.1, z = 0.8) => {
      const c = state.cues?.[id];
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : bounded(c.progress)
        : cueProgress(a, z);
    };
  {
    const ad = adamContinuation();
    if (currentBeat < 2)
      drawExpandedTitle(
        ctx,
        api,
        'Scalar Adam fixture · β₁ = β₂ = 0.5 · ε = 0 · lr = 0.1 · decay = 0',
      );
    if (currentBeat === 0) {
      const fields = ['Weights', 'Adam m/v/step', 'Schedule / scaler', 'Progress / cursor', 'RNG'];
      const q = cueProgress();
      fields.forEach((name, i) => {
        drawExpandedTile(
          ctx,
          api,
          name,
          210 + i * 320,
          470,
          290,
          100,
          i === 1 ? themeColors.yellow : themeColors.blue,
        );
        if (q > i / 5) api.arrow(ctx, 355 + i * 320, 590, 960, 800, themeColors.muted, 2);
      });
      drawExpandedText(
        ctx,
        api,
        'Completed optimizer step',
        960,
        900,
        36,
        themeColors.green,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Mid-accumulation additionally needs gradients and microstep',
        960,
        1015,
        28,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      const k = Math.min(2, Math.floor(api.phase(progress, 0.05, 0.5) * 3)),
        st = ad.states[k];
      [1, 1, -1].forEach((g, i) => {
        drawExpandedTile(
          ctx,
          api,
          'g' + (i + 1) + ' = ' + g,
          250 + i * 480,
          360,
          360,
          85,
          i <= k ? themeColors.pink : themeColors.muted,
        );
        if (i < 2) api.arrow(ctx, 630 + i * 480, 402, 710 + i * 480, 402, themeColors.muted, 3);
      });
      drawExpandedText(
        ctx,
        api,
        'm = ' + st.m.toFixed(3) + ' · v = ' + st.v.toFixed(3) + ' · step ' + st.step,
        960,
        565,
        39,
        themeColors.yellow,
        'center',
      );
      if (k === 2) {
        const reveal = cue('resume-update');
        drawExpandedText(
          ctx,
          api,
          'Same saved weight · same next gradient −1',
          960,
          670,
          30,
          themeColors.muted,
          'center',
        );
        const rows = [
          ['Restored moments / counter', ad.resumed, themeColors.green],
          ['Reset optimizer', ad.reset, themeColors.pink],
        ];
        rows.forEach(([name, value, col], i) => {
          const y = 760 + i * 130,
            shown = i === 0 ? reveal : cue('reset-update');
          drawExpandedText(ctx, api, name, 230, y, 30, col);
          drawExpandedLine(ctx, api, 820, y - 10, 1540, y - 10, themeColors.muted);
          api.focus.target(i === 0 ? 'resume-delta' : 'reset-delta', () =>
            api.circle(ctx, 820 + value * 7000 * shown, y - 10, 15, col),
          );
          if (shown > 0.95)
            drawExpandedText(ctx, api, 'Δw = +' + value.toFixed(5), 1680, y, 30, col, 'center');
        });
      }
    }
    if (currentBeat === 2) {
      drawExpandedTitle(ctx, api, 'Continuation checks · all ranks, actual intended world size');
      const q = cueProgress(),
        names = ['next batch', 'next loss', 'next gradient', 'updated parameters', 'Adam counters'];
      names.forEach((n, i) => {
        const x = 240 + i * 330;
        drawExpandedTile(
          ctx,
          api,
          n,
          x,
          480,
          300,
          90,
          i < 3 ? themeColors.blue : themeColors.yellow,
        );
        if (q > (i + 1) / 6)
          drawExpandedText(ctx, api, 'compare', x + 150, 720, 34, themeColors.green, 'center');
      });
      drawExpandedText(
        ctx,
        api,
        'Equal resumed loss alone misses the reset-Adam failure',
        960,
        905,
        38,
        themeColors.pink,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Sharded save/load and topology conversion need a real distributed resume test',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'checkpoint',
  draw: drawCheckpoint,
  cues: ['resume-update', 'reset-update'],
};
