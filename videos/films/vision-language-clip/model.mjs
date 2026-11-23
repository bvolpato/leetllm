import { IMAGE_FEATURES, PATCH_KV, TEMPERATURE, TEXT_FEATURES } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { dotProduct, normalizeVector, stableSoftmax } from 'vizmatic';
export function computeClipFixture(imageFeatures = IMAGE_FEATURES, textFeatures = TEXT_FEATURES) {
  assert(imageFeatures.length > 0 && imageFeatures.length === textFeatures.length);
  const width = imageFeatures[0].length;
  for (const row of [...imageFeatures, ...textFeatures])
    assert(
      row.length === width &&
        width > 0 &&
        row.every(Number.isFinite) &&
        Math.hypot(...row) > 0 &&
        Number.isFinite(Math.hypot(...row)),
      'cosine needs finite nonzero vectors of one width',
    );
  const images = imageFeatures.map(normalizeVector);
  const texts = textFeatures.map(normalizeVector);
  const cosine = images.map((image) => texts.map((text) => dotProduct(image, text)));
  const logits = cosine.map((row) => row.map((value) => value / TEMPERATURE));
  const rowProbabilities = logits.map((row) => stableSoftmax(row));
  const columns = logits[0].map((_, column) => logits.map((row) => row[column]));
  const columnProbabilities = columns.map((column) => stableSoftmax(column));
  const rowLosses = rowProbabilities.map((row, index) => -Math.log(row[index]));
  const columnLosses = columnProbabilities.map((column, index) => -Math.log(column[index]));
  const imageToTextLoss = rowLosses.reduce((sum, value) => sum + value, 0) / rowLosses.length;
  const textToImageLoss = columnLosses.reduce((sum, value) => sum + value, 0) / columnLosses.length;
  const symmetricLoss = (imageToTextLoss + textToImageLoss) / 2;
  const queryScores = texts.map((text) => dotProduct(images[0], text));
  const queryProbabilities = stableSoftmax(queryScores, TEMPERATURE);
  const retrievalScores = images.map((image) => dotProduct(texts[0], image));
  return {
    images,
    texts,
    cosine,
    logits,
    rowProbabilities,
    columnProbabilities,
    rowLosses,
    columnLosses,
    imageToTextLoss,
    textToImageLoss,
    symmetricLoss,
    queryScores,
    queryProbabilities,
    retrievalScores,
  };
}
export function contrastiveGradient(imageFeatures = IMAGE_FEATURES, textFeatures = TEXT_FEATURES) {
  const fixture = computeClipFixture(imageFeatures, textFeatures),
    count = imageFeatures.length;
  const logitGradient = fixture.logits.map((row, image) =>
    row.map(
      (_, text) =>
        (fixture.rowProbabilities[image][text] +
          fixture.columnProbabilities[text][image] -
          (image === text ? 2 : 0)) /
        (2 * count),
    ),
  );
  const imageUnitGradient = fixture.images.map((vector, image) =>
    vector.map((_, feature) =>
      fixture.texts.reduce(
        (sum, text, column) => sum + (logitGradient[image][column] * text[feature]) / TEMPERATURE,
        0,
      ),
    ),
  );
  const textUnitGradient = fixture.texts.map((vector, text) =>
    vector.map((_, feature) =>
      fixture.images.reduce(
        (sum, image, row) => sum + (logitGradient[row][text] * image[feature]) / TEMPERATURE,
        0,
      ),
    ),
  );
  const throughNormalization = (raw, unit, gradient) => {
    const radial = dotProduct(unit, gradient),
      length = Math.hypot(...raw);
    return gradient.map((value, feature) => (value - radial * unit[feature]) / length);
  };
  return {
    images: imageFeatures.map((vector, index) =>
      throughNormalization(vector, fixture.images[index], imageUnitGradient[index]),
    ),
    texts: textFeatures.map((vector, index) =>
      throughNormalization(vector, fixture.texts[index], textUnitGradient[index]),
    ),
  };
}
export function reductionDecision(cap) {
  const required = ['vent', 'tag', 'layout'];
  return {
    required,
    selected: cap >= 3 ? required : required.slice(0, cap),
    route: cap >= 3 ? 'bounded analysis' : 'review',
  };
}
export function patchAttention(query) {
  assert(Array.isArray(query) && query.length === 2 && query.every(Number.isFinite));
  const scores = PATCH_KV.map((p) => dotProduct(query, p.key) / Math.sqrt(2)),
    weights = stableSoftmax(scores),
    output = [0, 1].map((d) => PATCH_KV.reduce((sum, p, i) => sum + weights[i] * p.value[d], 0));
  return {
    query: [...query],
    scores,
    weights,
    output,
  };
}
export function workerSchedule(analysisCap) {
  assert([1, 2].includes(analysisCap));
  return analysisCap === 2
    ? [
        {
          id: 'A1',
          worker: 0,
          start: 0,
          end: 1000,
          type: 'analysis',
        },
        {
          id: 'A2',
          worker: 1,
          start: 0,
          end: 1000,
          type: 'analysis',
        },
        {
          id: 'S1',
          worker: 0,
          start: 1000,
          end: 1100,
          type: 'search',
        },
        {
          id: 'S2',
          worker: 1,
          start: 1000,
          end: 1100,
          type: 'search',
        },
      ]
    : [
        {
          id: 'A1',
          worker: 0,
          start: 0,
          end: 1000,
          type: 'analysis',
        },
        {
          id: 'A2',
          worker: 0,
          start: 1000,
          end: 2000,
          type: 'analysis',
        },
        {
          id: 'S1',
          worker: 1,
          start: 0,
          end: 100,
          type: 'search',
        },
        {
          id: 'S2',
          worker: 1,
          start: 100,
          end: 200,
          type: 'search',
        },
      ];
}
