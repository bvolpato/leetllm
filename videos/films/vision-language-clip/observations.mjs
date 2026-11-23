import { IMAGE_FEATURES, TEXT_FEATURES } from './fixtures.mjs';
import { computeClipFixture, contrastiveGradient } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const FIXTURE = computeClipFixture();
export const TEACHING_GRADIENT = contrastiveGradient();
export const sceneSnapshots = {
  opening: [
    {
      stage: 0,
      selected: -1,
    },
    {
      stage: 1,
      selected: -1,
    },
    {
      stage: 2,
      selected: 0,
    },
  ],
  towers: [
    {
      stage: 0,
      pair: 0,
    },
    {
      stage: 1,
      pair: 0,
    },
    {
      stage: 2,
      pair: 0,
    },
  ],
  cosine: [
    {
      stage: 0,
      imageNorm: Math.hypot(...IMAGE_FEATURES[0]),
      textNorm: Math.hypot(...TEXT_FEATURES[0]),
    },
    {
      stage: 1,
      imageNorm: Math.hypot(...IMAGE_FEATURES[0]),
      textNorm: Math.hypot(...TEXT_FEATURES[0]),
    },
    {
      stage: 2,
      imageNorm: Math.hypot(...IMAGE_FEATURES[0]),
      textNorm: Math.hypot(...TEXT_FEATURES[0]),
      cosine: FIXTURE.cosine[0][0],
    },
  ],
  matrix: [
    {
      stage: 0,
      values: FIXTURE.cosine,
      diagonal: false,
    },
    {
      stage: 1,
      values: FIXTURE.logits,
      diagonal: false,
    },
    {
      stage: 2,
      values: FIXTURE.logits,
      diagonal: true,
    },
  ],
  objective: [
    {
      stage: 0,
      direction: 'image-to-text',
      probabilities: FIXTURE.rowProbabilities[0],
      loss: FIXTURE.rowLosses[0],
    },
    {
      stage: 1,
      direction: 'text-to-image',
      probabilities: FIXTURE.columnProbabilities[0],
      loss: FIXTURE.columnLosses[0],
    },
    {
      stage: 2,
      imageToTextLoss: FIXTURE.imageToTextLoss,
      textToImageLoss: FIXTURE.textToImageLoss,
      loss: FIXTURE.symmetricLoss,
    },
  ],
  'training-step': [
    {
      stage: 0,
    },
    {
      stage: 1,
    },
    {
      stage: 2,
    },
  ],
  'zero-shot': [
    {
      stage: 0,
      scores: FIXTURE.queryScores,
    },
    {
      stage: 1,
      scores: FIXTURE.queryScores,
      probabilities: FIXTURE.queryProbabilities,
    },
    {
      stage: 2,
      scores: FIXTURE.queryScores,
      probabilities: FIXTURE.queryProbabilities,
    },
  ],
  retrieval: [
    {
      stage: 0,
      scores: FIXTURE.retrievalScores,
      ranked: [0, 1, 2],
    },
    {
      stage: 1,
      scores: FIXTURE.retrievalScores,
      ranked: [0, 1, 2],
    },
    {
      stage: 2,
      scores: FIXTURE.retrievalScores,
      ranked: FIXTURE.retrievalScores
        .map((_, index) => index)
        .sort((a, b) => FIXTURE.retrievalScores[b] - FIXTURE.retrievalScores[a]),
    },
  ],
  boundaries: [
    {
      stage: 0,
      route: 'similarity search',
    },
    {
      stage: 1,
      route: 'grounding and OCR',
    },
    {
      stage: 2,
      route: 'choose measured evidence',
    },
  ],
};
export const makeTrack = (sceneId, snapshots) =>
  createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
export const TRACKS = Object.fromEntries(
  Object.entries(sceneSnapshots).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
