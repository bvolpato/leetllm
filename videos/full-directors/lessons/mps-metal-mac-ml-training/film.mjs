import assert from 'node:assert/strict';
import { refund, backend, install, pool, assignment, identity } from './placement.mjs';
import {
  pooling,
  score,
  routing,
  update,
  stepProof,
  practice,
  checkClassifier,
} from './classifier.mjs';
import {
  fallback,
  schedule,
  dtype,
  precision,
  autocast,
  checkCompatibility,
} from './compatibility.mjs';
import { timer, bracket, profile, crossover, checkInstruments } from './instruments.mjs';
import { budget, allocator, limits, checkMemory } from './memory.mjs';
import {
  backendChoice,
  tensorShapeContract,
} from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';

const chapters = [
  refund,
  backend,
  install,
  pool,
  assignment,
  identity,
  pooling,
  score,
  routing,
  update,
  stepProof,
  fallback,
  schedule,
  dtype,
  precision,
  autocast,
  timer,
  bracket,
  profile,
  crossover,
  budget,
  allocator,
  limits,
  (ctx, clock) => refund(ctx, clock, true),
  practice,
];
const captionStarts = {
  'c01-b02': ['PyTorch’s Apple GPU device', 'and keep the returned tensor', 'then measure its time'],
  'c02-b01': [
    'for the Apple GPU backend',
    'the backend can use Metal Performance Shaders',
    'Apple’s optimized GPU operations',
  ],
  'c03-b01': ['but moving a tensor', 'and Xcode command-line tools'],
  'c03-b02': ['from a different PyTorch release'],
  'c03-b03': ['check that its macOS wheel', 'the Python version and architecture'],
  'c03-b05': ['and the first operation that failed'],
  'c05-b03': ['and the classifier would fail'],
  'c06-b01': ['even when both select'],
  'c06-b03': ['and communication backend that support that arrangement'],
  'c06-b04': ['and selects where operations'],
  'c08-b01': ['with the weight that Billing gives it'],
  'c09-b02': ['even before Billing takes the lead'],
  'c11-b01': ['to stand in for encoded text'],
  'c11-b02': ['and allow four bytes per value'],
  'c11-b04': ['and the loss before the update was finite'],
  'c12-b02': ['even in shared memory'],
  'c14-b02': ['PyTorch’s sixty-four-bit integer dtype'],
  'c15-b01': ['as two different values'],
  'c16-b02': ['and leave backward and the optimizer outside that scope'],
  'c17-b02': ['follow the three spent dispatching'],
  'c19-b02': ['to see which work and idle time fall inside an operation'],
  'c20-b01': ['while the GPU path'],
  'c21-b01': ['holds seven hundred sixty-eight float32 features'],
  'c22-b01': ['cached blocks and backend allocations'],
  'c22-b02': ['beyond the example budget'],
  'c22-b03': ['and check other memory-heavy apps'],
  'c23-b02': ['and commit command buffers more aggressively'],
  'c25-b09': ['trace the name passed to the classifier', 'that keep work arriving at the GPU'],
};

function draw(ctx, clock) {
  for (const phrase of captionStarts[clock.beat.id] ?? []) {
    clock.reveal(phrase, 0, { captionStart: phrase });
  }
  ctx.save();
  chapters[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
function check() {
  assert.equal(backendChoice({ built: true, available: false }), 'cpu');
  assert.equal(backendChoice({ built: false, available: false }), 'cpu');
  assert.equal(backendChoice({ built: true, available: true }), 'mps');
  assert.equal(tensorShapeContract(4, 8, 16, 3).bytes, 2048);
  assert.deepEqual(tensorShapeContract(3, 6, 8, 3).logits, [3, 3]);
  checkClassifier();
  checkCompatibility();
  checkInstruments();
  checkMemory();
  return true;
}
export default { title: 'One Ticket Through the Apple GPU', draw, check };
