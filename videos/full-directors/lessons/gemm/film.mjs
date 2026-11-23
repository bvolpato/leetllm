import { base } from './plates.mjs';
import { checkExamples } from './examples.mjs';
import { opening, dot, scalar, tile, accumulate } from './multiply.mjs';
import { addresses, bankPage, registers, slots } from './memory.mjs';
import { fragments, precision, shape, roofline } from './numerics.mjs';
import { signedEdge, practice, torn } from './edges.mjs';

const scenes = {
  c01: ['Matrix multiplication', opening],
  c02: ['The reference product', dot],
  c03: ['Independent accumulators', scalar],
  addresses: ['Global memory', addresses],
  c04: ['Shared memory', tile],
  c05: ['Reduction along K', accumulate],
  banks: ['Shared-memory layout', bankPage],
  c06: ['Block, warp and register tiles', registers],
  slots: ['Double buffering', slots],
  c07: ['Warp matrix multiply-accumulate', fragments],
  precision: ['Input and accumulator precision', precision],
  c08: ['Prefill and decode', shape],
  roof: ['Performance measurement', roofline],
  'signed-edge': ['Right-edge practice', signedEdge],
  practice: ['Reduction-tail practice', practice],
  c09: ['Bottom-edge replay', torn],
};
function draw(c, clock) {
  const [section, painter] = scenes[clock.beat.chapterId];
  base(c, clock.beat.chapterTitle, section);
  painter(c, clock);
}
export default { title: 'The Geometry of a Matrix Multiply', draw, check: checkExamples };
