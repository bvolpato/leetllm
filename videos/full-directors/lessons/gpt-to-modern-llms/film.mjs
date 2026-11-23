import { prepareCaptions } from './captions.mjs';

import { check } from './examples.mjs';
import { pen } from './ink.mjs';
import { tracker, mask, mixture, projection, training, decode } from './prediction.mjs';
import { assistant, allocation, cache, norm, gate, rotary } from './mechanisms.mjs';
import { experts, evidence, deployment } from './evaluation.mjs';

const scenes = [
  tracker,
  mask,
  mixture,
  projection,
  training,
  decode,
  assistant,
  allocation,
  cache,
  norm,
  gate,
  rotary,
  experts,
  evidence,
  deployment,
];
const dark = new Set([2, 3, 5, 8, 10, 11, 12]);

export default {
  title: 'From GPT to Modern LLMs',
  preparePicture: prepareCaptions,

  check,
  draw(ctx, clock) {
    const index = clock.beat.chapterIndex;
    ctx.save();
    ctx.scale(1.6, 1.6);
    scenes[index](pen(ctx, dark.has(index)), clock);
    ctx.restore();
  },
};
