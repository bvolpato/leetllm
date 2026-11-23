import { cohortTimeline } from '../cohort-timeline.mjs';
import { text } from '../defaults.mjs';
import { predictionRows } from '../fixtures.mjs';
import { cohortAsOf } from '../model.mjs';
import { monitoringScene } from '../storyboard.mjs';

export default monitoringScene(
  'as-of-cohorts',
  ['late', 'ask', 'coverage', 'missing', 'check'],
  (ctx, api, cue) => {
    const { C } = api;
    cohortTimeline(ctx, api, {
      mature: true,
      arrivals: 1,
      delay: cue.progress('late'),
      ask: cue.started('late') && !cue.done('coverage'),
    });
    if (cue.done('coverage')) {
      const result = cohortAsOf(predictionRows, 0);
      text(
        ctx,
        api,
        `${result.joined} joined / ${result.mature} mature = ${result.coverage.toFixed(2)}`,
        960,
        863,
        42,
        C.yellow,
      );
      if (cue.started('missing')) {
        text(
          ctx,
          api,
          cue.started('check')
            ? 'p-005   /   window closed 11:00   /   report cutoff 12:00   /   label ingested 13:00'
            : 'p-005 belongs in the denominator. Its outcome was unknown at noon.',
          960,
          939,
          29,
          C.ink,
        );
      }
    } else {
      text(
        ctx,
        api,
        cue.started('ask')
          ? 'At noon, how many labels can you join to the five closed windows?'
          : '5 mature predictions in the noon cohort',
        960,
        890,
        37,
        cue.started('ask') ? C.yellow : C.blue,
      );
    }
  },
);
