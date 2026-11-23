import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { boundaryScenes } from './boundary.mjs';
import { resilienceScenes } from './resilience.mjs';
import { receiptScenes } from './receipts.mjs';
import { checkExamples } from './examples.mjs';

const scenes = [...boundaryScenes, ...resilienceScenes, ...receiptScenes];
export default {
  title: 'Follow One LLM Request Through Its Production Boundary',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    scenes[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check() {
    assert.equal(scenes.length, 26);
    return checkExamples();
  },
};
