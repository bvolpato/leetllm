import { base } from './bench.mjs';
import { exampleCheck } from './examples.mjs';
import {
  outage,
  batches,
  contracts,
  scores,
  weights,
  momentum,
  buffer,
  prepareBufferTiming,
  shares,
  epoch,
  fit,
} from './router.mjs';
import {
  modes,
  validation,
  resume,
  atomic,
  triage,
  clipping,
  inference,
  precision,
  amp,
} from './state.mjs';
import { compile, bigram, floor, selection, receipt, audit, heldOut } from './reader.mjs';

const chapters = [
  outage,
  batches,
  contracts,
  scores,
  weights,
  momentum,
  buffer,
  shares,
  epoch,
  fit,
  modes,
  validation,
  resume,
  atomic,
  triage,
  clipping,
  inference,
  precision,
  amp,
  compile,
  bigram,
  floor,
  selection,
  receipt,
  audit,
  heldOut,
];
function draw(ctx, clock) {
  const chapter = clock.beat.chapterIndex;
  const paper =
    chapter === 8 ||
    (chapter === 12 && clock.beat.beatIndex < 4) ||
    (chapter === 21 && clock.beat.beatIndex < 3) ||
    (chapter === 23 && clock.beat.beatIndex === 0);
  base(ctx, paper);
  chapters[chapter](ctx, clock);
}
export default {
  title: 'How a PyTorch Training Loop Changes a Model',
  draw,
  check: exampleCheck,
  preparePicture: prepareBufferTiming,
};
