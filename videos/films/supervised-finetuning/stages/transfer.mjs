import { motion } from '../construction.mjs';
import { paddingExample } from '../token-strip.mjs';

function draw(ctx, scene, state, api) {
  const byId = motion(state, 'id-mask', 0, 0.54, 0.75) > 0;
  const fixed = motion(state, 'position-mask', 1, 0.22, 0.45) > 0;
  paddingExample(ctx, api, byId && !fixed ? 'by-id' : 'position');
}

export default {
  id: 'transfer',
  draw: draw,
  cues: ['id-mask', 'position-mask'],
};
