import { cohortTimeline } from '../cohort-timeline.mjs';
import { text } from '../defaults.mjs';
import { monitoringScene } from '../storyboard.mjs';

export default monitoringScene(
  'delayed-labels',
  ['ask', 'mature', 'join', 'full'],
  (ctx, api, cue) => {
    cohortTimeline(ctx, api, { mature: cue.done('mature'), arrivals: cue.progress('join') });
    const { C } = api;
    if (cue.started('ask') && !cue.started('mature')) {
      text(ctx, api, 'Which job can still meet its deadline after noon?', 960, 902, 40, C.yellow);
    } else if (cue.done('full')) {
      text(ctx, api, '5 joined labels / 5 closed windows', 960, 902, 41, C.cyan);
    } else if (cue.done('mature')) {
      text(ctx, api, '5 closed windows   ·   1 still open', 960, 902, 38, C.blue);
    }
  },
);
