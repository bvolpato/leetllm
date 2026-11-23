import { IMAGE_FEATURES, TEXT_FEATURES } from './fixtures.mjs';
import { computeClipFixture } from './model.mjs';
import { TEACHING_GRADIENT } from './observations.mjs';
import { smoothstep } from 'vizmatic';
export function contrastiveStep(amount, learningRate = 4) {
  const images = IMAGE_FEATURES.map((row, i) =>
    row.map((value, j) => value - learningRate * amount * TEACHING_GRADIENT.images[i][j]),
  );
  const texts = TEXT_FEATURES.map((row, i) =>
    row.map((value, j) => value - learningRate * amount * TEACHING_GRADIENT.texts[i][j]),
  );
  return {
    amount,
    imageFeatures: images,
    textFeatures: texts,
    ...computeClipFixture(images, texts),
  };
}
export function trainingStepFrame(state) {
  const beat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const amount = beat < 1 ? 0 : beat > 1 ? 1 : smoothstep((progress - 0.06) / 0.77);
  return contrastiveStep(amount);
}
