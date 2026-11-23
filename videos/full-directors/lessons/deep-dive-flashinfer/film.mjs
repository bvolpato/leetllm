import {packed,rulers,routes,mask,tails} from './memory.mjs';
import {balance,mergeFaults,stride} from './states.mjs';
import {lanes,reads,trace} from './execution.mjs';
import {check} from './model.mjs';

const scenes = {
  c01: packed,
  c02: rulers,
  c03: routes,
  c04: mask,
  c05: balance,
  'c05-check': mergeFaults,
  c06: tails,
  'c06-stride': stride,
  c07: lanes,
  'c07-lease': reads,
  'c07-trace': trace,
  'c07-lab': (ctx, clock) => tails(ctx, clock, true),
};

export default {
  title: 'FlashInfer and the Shape of a Living Batch',
  draw(ctx, clock) { scenes[clock.beat.chapterId](ctx, clock); },
  check,
};
