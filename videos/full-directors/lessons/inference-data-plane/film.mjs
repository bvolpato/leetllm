import { validate } from './examples.mjs';
import { opening, reservation, lifecycle, timeout, ending } from './receiver.mjs';
import { ranks, smallPayload, bigPayload } from './compute.mjs';
import { placement, interpretation, recovery, measurement } from './routing.mjs';

const chapters = [
  opening,
  ranks,
  smallPayload,
  bigPayload,
  placement,
  interpretation,
  reservation,
  lifecycle,
  timeout,
  recovery,
  measurement,
  ending,
];

export default {
  title: 'Moving Model State Between Machines',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
  check: validate,
};
