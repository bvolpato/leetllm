import { pipelineProbe, traces, events, streams } from './traces.mjs';
import { capture, cost, lab, update } from './graphs.mjs';
import { memory, padding, queue, practice } from './storage.mjs';
import { check } from './fixtures.mjs';

const painters = {
  c01: pipelineProbe,
  c02: traces,
  c03: events,
  'c03-streams': streams,
  c04: capture,
  'c04-reuse': cost,
  'c04-lab': lab,
  c05: memory,
  'c05-update': update,
  c06: padding,
  c07: queue,
  practice,
};
function draw(ctx, clock) {
  painters[clock.beat.chapterId](ctx, clock);
}
export default { title: 'Keep the GPU Supplied with Correct Work', draw, check };
