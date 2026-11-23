import { adam, saved } from '../arithmetic.mjs';
import { complete, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawCheckpointContract(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'checkpoint-contract', beat, index),
    resultComplete = (beat, index) => complete(state, 'checkpoint-contract', beat, index);
  api.focus.target('checkpoint-contract-construction', () => {
    drawCheckpointContract();
  });
  function drawCheckpointContract() {
    if (currentBeat === 0) {
      const visible = Math.floor(sentenceProgress(0, 0) * 4);
      drawChapterText(
        ctx,
        api,
        'Distributed save · one tag across participating ranks',
        960,
        285,
        36,
        themeColors.yellow,
        'center',
      );
      for (let rank = 0; rank < 4; rank++)
        drawChapterCard(
          ctx,
          api,
          'R' + rank + ' · ' + (rank < visible ? 'tag step-5' : 'waiting'),
          165 + rank * 420,
          410,
          365,
          rank < visible ? themeColors.cyan : themeColors.muted,
          110,
          31,
        );
      drawChapterText(
        ctx,
        api,
        visible === 4
          ? 'All four participants enter the same checkpoint operation'
          : 'Rank-owned state still belongs to its peers',
        960,
        720,
        35,
        visible === 4 ? themeColors.green : themeColors.yellow,
        'center',
      );
      if (resultComplete(0, 2))
        drawChapterFooter(
          ctx,
          api,
          'ZeRO-3 reload test: fresh model + fresh engine before load',
          910,
          themeColors.cyan,
        );
    } else {
      const good = adam(saved, 0.4, 6),
        wrong = adam(saved, -1, 6),
        ready = resultComplete(1, 2);
      drawChapterText(
        ctx,
        api,
        'Same saved w, m, v, step · different next data if cursor resets',
        960,
        285,
        32,
        themeColors.yellow,
        'center',
      );
      drawChapterValues(
        ctx,
        api,
        'Uninterrupted / restored',
        ['sample 6', 'g = +0.4', ready ? good[0].toFixed(7) : 'next w ?'],
        360,
        themeColors.blue,
      );
      drawChapterValues(
        ctx,
        api,
        'Reset sampler',
        ['sample 1', 'g = −1', ready ? wrong[0].toFixed(7) : 'next w ?'],
        560,
        themeColors.pink,
      );
      if (ready)
        drawChapterText(
          ctx,
          api,
          'Restoring a step counter did not restore the sampler’s progress',
          960,
          800,
          34,
          themeColors.pink,
          'center',
        );
      if (currentBeat === 2) {
        drawChapterText(
          ctx,
          api,
          'Compare next input → next loss → next update → scheduler',
          960,
          900,
          33,
          themeColors.cyan,
          'center',
        );
        drawChapterFooter(
          ctx,
          api,
          'Actual CPU scalar round trip ≠ distributed DeepSpeed checkpoint proof',
        );
      } else
        drawChapterFooter(
          ctx,
          api,
          'Supplied cursor failure applied to the same scalar Adam state · no distributed reload run',
        );
    }
  }
}
export default {
  id: 'checkpoint-contract',
  draw: drawCheckpointContract,
  cues: [
    'ds-checkpoint-contract-b0-s0',
    'ds-checkpoint-contract-b0-s1',
    'ds-checkpoint-contract-b0-s2',
    'ds-checkpoint-contract-b1-s0',
    'ds-checkpoint-contract-b1-s1',
    'ds-checkpoint-contract-b1-s2',
    'ds-checkpoint-contract-b1-s3',
    'ds-checkpoint-contract-b2-s0',
    'ds-checkpoint-contract-b2-s1',
    'ds-checkpoint-contract-b2-s2',
    'ds-checkpoint-contract-b2-s3',
  ],
};
