import { complete, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawParameterCoordination(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'parameter-coordination', beat, index),
    resultComplete = (beat, index) => complete(state, 'parameter-coordination', beat, index);
  api.focus.target('parameter-coordination-construction', () => {
    if (currentBeat === 0) {
      const access = sentenceProgress(0, 1);
      drawChapterText(
        ctx,
        api,
        'One existing tied parameter W = 3 · supplied input h = 2',
        960,
        285,
        33,
        themeColors.yellow,
        'center',
      );
      const owner = drawChapterCard(
          ctx,
          api,
          'Embedding owner · W = 3',
          180,
          390,
          600,
          themeColors.blue,
          110,
          34,
        ),
        consumer = drawChapterCard(
          ctx,
          api,
          access === 1 ? 'Output consumer · W = 3' : 'Output consumer · W unavailable',
          1130,
          390,
          600,
          access === 1 ? themeColors.cyan : themeColors.pink,
          110,
          31,
        );
      teaching.transfer({
        source: {
          shape: owner,
          opacity: 1,
        },
        target: {
          shape: consumer,
          opacity: 1,
        },
        progress: access,
        color: themeColors.cyan,
        particle: {
          radius: 10,
          fill: themeColors.cyan,
        },
      });
      if (access === 1) {
        drawChapterText(
          ctx,
          api,
          'Same W identity · hW = 2×3 = 6',
          960,
          750,
          43,
          themeColors.green,
          'center',
        );
      }
      if (resultComplete(0, 2))
        drawChapterText(
          ctx,
          api,
          'Availability registration does not add a new optimizer parameter',
          960,
          900,
          31,
          themeColors.yellow,
          'center',
        );
    } else {
      const leaf = currentBeat > 1 ? 1 : sentenceProgress(1, 1);
      drawChapterText(
        ctx,
        api,
        'Two data ranks · different conditional experts',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      drawChapterValues(
        ctx,
        api,
        'Rank 0 gather order',
        leaf > 0 ? ['Expert A', 'Expert B'] : ['Expert A', 'wait B'],
        370,
        themeColors.blue,
      );
      drawChapterValues(
        ctx,
        api,
        'Rank 1 gather order',
        leaf > 0 ? ['Expert A', 'Expert B'] : ['Expert B', 'wait A'],
        555,
        themeColors.pink,
      );
      if (leaf > 0) {
        drawChapterText(
          ctx,
          api,
          'Leaf availability: gather both descendants before entering',
          960,
          780,
          34,
          themeColors.cyan,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Forward still conditional: R0 executes A; R1 executes B',
          960,
          865,
          32,
          themeColors.green,
          'center',
        );
      } else
        drawChapterText(
          ctx,
          api,
          'Different first gather → incompatible collective order',
          960,
          800,
          37,
          themeColors.pink,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        currentBeat === 2
          ? 'External consumer registration and dynamic subtree coordination solve different causes'
          : 'Supplied 4-element experts · both live means 8 elements before conditional forward',
      );
    }
  });
}
export default {
  id: 'parameter-coordination',
  draw: drawParameterCoordination,
  cues: [
    'ds-parameter-coordination-b0-s0',
    'ds-parameter-coordination-b0-s1',
    'ds-parameter-coordination-b0-s2',
    'ds-parameter-coordination-b0-s3',
    'ds-parameter-coordination-b1-s0',
    'ds-parameter-coordination-b1-s1',
    'ds-parameter-coordination-b1-s2',
    'ds-parameter-coordination-b1-s3',
    'ds-parameter-coordination-b2-s0',
    'ds-parameter-coordination-b2-s1',
    'ds-parameter-coordination-b2-s2',
    'ds-parameter-coordination-b2-s3',
  ],
};
