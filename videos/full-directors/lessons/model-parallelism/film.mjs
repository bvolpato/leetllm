import { tensorScenes, checkTensor } from './tensor.mjs';
import { scheduleScenes, checkSchedule } from './schedule.mjs';
import { attentionScenes, checkAttention } from './attention.mjs';
import { servingScenes, checkServing } from './serving.mjs';

const scenes = { ...tensorScenes, ...scheduleScenes, ...attentionScenes, ...servingScenes };

function draw(ctx, clock) {
  scenes[clock.beat.chapterId](ctx, clock);
}
function check() {
  checkTensor();
  checkSchedule();
  checkAttention();
  checkServing();
}
export default { title: 'One Model Across Several GPUs', draw, check };
