import { drawShardRing } from '../shard-ring.mjs';
export const drawGather = drawShardRing;
export default {
  id: 'gather',
  draw: drawGather,
  cues: [
    'gather-copy-0',
    'gather-count',
    'gather-copy-1',
    'gather-count-three',
    'gather-copy-2',
    'gather-vector',
  ],
};
