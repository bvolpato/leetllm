import { head, on } from './paint.mjs';
import { requestScenes } from './requests.mjs';
import { executionScenes } from './execution.mjs';
import { deliveryScenes } from './delivery.mjs';
import { check } from './examples.mjs';

const scenes = [...requestScenes, ...executionScenes, ...deliveryScenes];
const sections = [
  [3, 'The support program'],
  [7, 'Inside a serving step'],
  [13, 'Prefix memory'],
  [15, 'The batch schedule'],
  [18, 'The grammar cursor'],
  [21, 'Draft and verify'],
  [26, 'Across workers'],
  [31, 'The service replay'],
  [33, 'Back at the ticket desk'],
];
export default {
  title: 'SGLang and the Life of a Structured Generation',
  check,
  draw(ctx, clock) {
    const index = clock.beat.chapterIndex;
    let title = index === 0 ? '' : clock.beat.chapterTitle;
    if (index === 5 && on(clock, 4, 'Now look at a separate run')) title = 'Who waits during the long prefill?';
    if (index === 29 && clock.beat.beatIndex === 3) title = 'Why is decode late when prefix hits stay high?';
    if (index === 30) {
      const b = clock.beat.beatIndex;
      if (b === 0) title = 'Who built SGLang?';
      if (b === 1) title = on(clock, 1, 'Suppose you change the scheduler')
        ? 'Who reviews a scheduler change?'
        : 'Which license covers each component?';
      if (b >= 3) title = 'Which module owns this step?';
    }
    head(ctx, sections.find(([end]) => index < end)[1], title);
    scenes[index](ctx, clock);
  },
};
