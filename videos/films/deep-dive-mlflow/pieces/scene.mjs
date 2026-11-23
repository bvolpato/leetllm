import { mlflowSentenceProgress } from '../construction.mjs';
import { sentenceWeights } from '../fixtures.mjs';

// Measured narration drives production. The same draw function can sample an isolated storyboard.
export function spokenScene(id, draw) {
  return {
    id,
    cues: sentenceWeights[id].flatMap((beat, b) =>
      beat.map((_, i) => `mf-sentence-${id}-${b}-${i}`),
    ),
    draw(ctx, scene, state, api) {
      return draw(ctx, scene, state, api, (b, i) => mlflowSentenceProgress(id, state, b, i));
    },
  };
}
