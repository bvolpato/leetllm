import { cosine, topicVector } from '../arithmetic.mjs';
import { extendedFrame } from '../construction.mjs';
import { extendedArrow, extendedEquation, extendedNote, extendedText } from '../defaults.mjs';
export function drawSemanticCosine(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('semantic-cosine', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('semantic-cosine-operation', () => {
    const sentences = [
        'Rollback failures require deploy IDs.',
        'Page on-call within 15 minutes.',
        'Commander handoff uses the active incident channel.',
      ],
      vectors = sentences.map(topicVector);
    if (currentBeat === 0) {
      extendedText(
        ctx,
        api,
        'Two transparent topic coordinates · whole words',
        960,
        275,
        33,
        themeColors.ink,
        'center',
      );
      sentences.forEach((sentence, i) => {
        const y = 410 + i * 190;
        extendedText(ctx, api, sentence, 180, y, 28, colors[i]);
        extendedText(ctx, api, '[' + vectors[i].join(', ') + ']', 1540, y, 40, colors[i], 'center');
        for (let axis = 0; axis < 2; axis++)
          if (vectors[i][axis])
            api.rect(
              ctx,
              1120 + axis * 185,
              y - 36,
              vectors[i][axis] * 45,
              28,
              colors[i],
              undefined,
              3,
            );
      });
      extendedNote(
        ctx,
        api,
        'Whole-word matching counts “id” as a word. The letters inside “incident” earn no point.',
      );
    } else if (currentBeat === 1) {
      const origin = {
          x: 430,
          y: 800,
        },
        scale = 105;
      extendedArrow(
        ctx,
        api,
        origin.x - 70,
        origin.y,
        origin.x + 400,
        origin.y,
        themeColors.muted,
        2,
      );
      extendedArrow(
        ctx,
        api,
        origin.x,
        origin.y + 35,
        origin.x,
        origin.y - 410,
        themeColors.muted,
        2,
      );
      extendedText(ctx, api, 'rollback/deploy', 630, 872, 25, themeColors.muted, 'center');
      extendedText(ctx, api, 'commander', 315, 380, 25, themeColors.muted, 'center');
      vectors.forEach((v, i) => {
        const x = origin.x + scale * v[0],
          y = origin.y - scale * v[1];
        extendedArrow(ctx, api, origin.x, origin.y, x, y, colors[i], 4);
        extendedText(ctx, api, '[' + v.join(',') + ']', x + 35, y - 18, 29, colors[i]);
      });
      const first = cosine(vectors[0], vectors[1]),
        second = cosine(vectors[1], vectors[2]);
      extendedEquation(
        ctx,
        api,
        String.raw`\cos(a,b)=\frac{a\cdot b}{\|a\|\|b\|}`,
        1340,
        405,
        43,
        themeColors.cyan,
      );
      if (begun('cosine-first'))
        extendedText(
          ctx,
          api,
          '2 / (2 × 1) = ' + first.toFixed(2) + ' · keep',
          1340,
          610,
          34,
          themeColors.green,
          'center',
        );
      if (begun('cosine-second'))
        extendedText(
          ctx,
          api,
          '0 / (1 × 3) = ' + second.toFixed(2) + ' · cut',
          1340,
          750,
          34,
          themeColors.pink,
          'center',
        );
      extendedText(
        ctx,
        api,
        'Supplied threshold: 0.50',
        1340,
        880,
        31,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Similarity proposes boundaries. Hard size and evidence checks still apply.',
      );
    } else {
      extendedText(
        ctx,
        api,
        'New sentence: No action is required.',
        960,
        325,
        36,
        themeColors.ink,
        'center',
      );
      const zeros = topicVector('No action is required.');
      extendedText(
        ctx,
        api,
        '[' + zeros.join(', ') + ']',
        960,
        485,
        60,
        themeColors.muted,
        'center',
      );
      extendedEquation(
        ctx,
        api,
        String.raw`\frac{a\cdot0}{\|a\|\,\|0\|}=\frac00`,
        960,
        650,
        58,
        themeColors.pink,
      );
      if (begun('cosine-undefined')) {
        extendedText(ctx, api, 'Undefined → review', 960, 825, 47, themeColors.yellow, 'center');
        extendedText(
          ctx,
          api,
          'No directional evidence for a topic change',
          960,
          925,
          32,
          themeColors.muted,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'semantic-cosine',
  draw: drawSemanticCosine,
  cues: [
    'semantic-cosine-0',
    'semantic-cosine-1',
    'cosine-first',
    'cosine-second',
    'semantic-cosine-2',
    'cosine-undefined',
  ],
};
