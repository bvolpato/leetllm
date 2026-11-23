import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsMass,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawLookupMethods(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-lookup-methods-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      ['Find the earlier “The train”', 'What happens when the copied token is rejected?',
        'Where the guesses come from'][currentBeat],
      245,
    );
    if (currentBeat === 0) {
      const words = ['The', 'train', 'arrives', 'at', 'noon', 'The', 'train'];
      words.forEach((w, i) =>
        drawConstructionsBox(
          ctx,
          api,
          w,
          120 + i * 240,
          390,
          210,
          i >= 5 ? themeColors.yellow : themeColors.blue,
        ),
      );
      drawConstructionsLine(ctx, api, 140, 540, 560, 540, themeColors.cyan, 5);
      drawConstructionsLine(ctx, api, 1320, 540, 1740, 540, themeColors.cyan, 5);
      if (done(0, 'sd-lookup-copy')) {
        api.arrow(ctx, 720, 560, 960, 740, themeColors.yellow, 4);
        drawConstructionsBox(ctx, api, 'Draft: arrives → at', 600, 800, 720, themeColors.yellow);
      }
      drawConstructionsCenter(
        ctx,
        api,
        'Match the trailing n-gram, then copy its following span',
        1010,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const ready = done(1, 'sd-lookup-residual');
      drawConstructionsMass(ctx, api, [0.2, 0.3, 0.5], 180, 425, 650, 300, themeColors.blue);
      if (ready)
        drawConstructionsMass(ctx, api, [0.4, 0.6, 0], 1090, 425, 650, 300, themeColors.green);
      else {
        components.panel({
          x: 1090,
          y: 425,
          width: 650,
          height: 300,
          fill: 'transparent',
          stroke: themeColors.muted,
        });
        drawConstructionsText(
          ctx,
          api,
          'Residual calculation pending',
          1415,
          580,
          31,
          themeColors.muted,
          'center',
        );
      }
      drawConstructionsText(
        ctx,
        api,
        'Target p · candidate ID 2 has q=1',
        505,
        345,
        29,
        themeColors.blue,
        'center',
      );
      drawConstructionsText(
        ctx,
        api,
        'Correction after rejection',
        1415,
        345,
        29,
        ready ? themeColors.green : themeColors.muted,
        'center',
      );
      drawConstructionsCenter(
        ctx,
        api,
        ready
          ? 'Remove ID 2 target mass; divide [0.2,0.3,0] by 0.5'
          : 'Point-mass proposal survives with probability p(ID 2) = 0.5',
        960,
        themeColors.yellow,
        31,
      );
    } else {
      const nodes = [
        ['Lookup', 'existing token span'],
        ['Native MTP', 'model-specific modules'],
        ['Parallel draft', 'trained simultaneous positions'],
      ];
      nodes.forEach(([name, meaning], i) => {
        drawConstructionsBox(ctx, api, name, 170, 350 + i * 205, 520, themeColors.blue);
        api.arrow(ctx, 730, 390 + i * 205, 1030, 390 + i * 205, themeColors.cyan, 3);
        drawConstructionsBox(ctx, api, meaning, 1090, 350 + i * 205, 650, themeColors.cyan);
      });
      drawConstructionsCenter(
        ctx,
        api,
        'Each method has its own weights, state and compatibility contract',
        1010,
        themeColors.muted,
      );
    }
  });
  return;
}
export default {
  id: 'lookup-methods',
  draw: drawLookupMethods,
  cues: [
    'sd-lookup-methods-b0',
    'sd-lookup-copy',
    'sd-lookup-methods-b1',
    'sd-lookup-residual',
    'sd-lookup-methods-b2',
  ],
};
