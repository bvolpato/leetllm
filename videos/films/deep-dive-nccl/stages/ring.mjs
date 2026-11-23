import { drawShardRing } from '../shard-ring.mjs';
export const drawRing = drawShardRing;
export default {
  id: 'ring',
  draw: drawRing,
  cues: [
    'ring-hop-0',
    'ring-add-0',
    'ring-hop-1',
    'ring-add-1',
    'ring-whose',
    'ring-hop-2',
    'ring-add-2',
    'ring-owner',
  ],
};
