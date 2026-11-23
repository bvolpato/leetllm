import { attend, loss, placed } from './arithmetic.mjs';
import { E, imageVecs, patches, ps, textVecs, tokens } from './fixtures.mjs';
import { multiplyMatrices, stableSoftmax, dotProduct } from 'vizmatic';
export const embedded = multiplyMatrices(patches, E);
export const weights = stableSoftmax(tokens.map((v) => dotProduct(tokens[0], v) / Math.sqrt(2)));
export const out = [0, 1].map((i) =>
  dotProduct(
    weights,
    tokens.map((v) => v[i]),
  ),
);
export const a = attend(placed(ps));
export const sw = attend(placed([...ps].reverse()));
export const logits = imageVecs.map((image) => textVecs.map((text) => 3 * dotProduct(image, text)));
export const clip = (loss(logits) + loss(logits[0].map((_, i) => logits.map((r) => r[i])))) / 2;
