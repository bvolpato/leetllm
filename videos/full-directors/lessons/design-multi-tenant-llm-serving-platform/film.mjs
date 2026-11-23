import assert from 'node:assert/strict';
import { opening, identity } from './readers.mjs';
import { admission, memory } from './memory.mjs';
import { scheduling, reuse, accounting, serviceState } from './worker.mjs';
import { finish } from './recovery.mjs';
import { checkExamples } from './examples.mjs';

const painters = [opening, identity, admission, memory, scheduling, reuse, accounting, finish];
export default {
  title: 'Share the GPU While Preserving Every Request Contract',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkExamples();
    const thirdVisit = serviceState({ beat: { beatIndex: 2 }, reveal: () => 1 });
    assert.deepEqual(thirdVisit.credit, { A: 6, B: 2 });
    assert.deepEqual(thirdVisit.jobs, { A: 2, B: 4 });
    const served = serviceState({ beat: { beatIndex: 3 }, reveal: () => 1 });
    assert.deepEqual(served.credit, { A: 0, B: 0 });
    assert.deepEqual(served.jobs, { A: 4, B: 6 });
  },
};
