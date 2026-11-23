import { lifecycle } from './lifecycle.mjs';
import { kernel, readiness } from './host.mjs';
import { memory } from './memory.mjs';
import { filesystem, network } from './io.mjs';
import { capacity } from './capacity.mjs';
import { check } from './model.mjs';

const chapters = { c01:lifecycle, c02:kernel, c03:memory, c04:readiness, c05:filesystem, c06:network, c07:capacity, c08:lifecycle };
export default {
  title: 'A Fast, Clean Room for Every Agent Job',
  draw(ctx, clock) { chapters[clock.beat.chapterId](ctx, clock); },
  check,
};
