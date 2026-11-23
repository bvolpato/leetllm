import { memoryPainters, checkMemory } from './memory.mjs';
import { transportPainters, checkTransport } from './transport.mjs';
import { benchPainters, checkBench } from './review-bench.mjs';

const painters = [...memoryPainters, ...transportPainters, ...benchPainters];
function draw(ctx, clock) {
  painters[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  const clock = (beatIndex, value) => ({ beat: { beatIndex }, reveal: () => value });
  checkMemory(clock);
  checkTransport(clock);
  checkBench(clock);
  return true;
}
export default { title: 'Follow the Bytes Through a Local Model', draw, check };
