import { check } from './examples.mjs';
import { opening,mesh,mlp,pipeline } from './layers.mjs';
import { attention,routing,optimizer,precision } from './exchange.mjs';
import { recovery } from './recovery.mjs';

const chapters={c01:opening,c02:mesh,c03:mlp,c04:pipeline,c05:attention,c06:routing,c07:optimizer,precision,c08:recovery};
function draw(ctx,clock) {
  chapters[clock.beat.chapterId](ctx,clock);
}
export default {title:'Megatron and the Geometry of a Training Mesh', draw, check};
