import {
  cueProgress,
  moderationBar,
  moderationBox,
  moderationLine,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawBatchWork(ctx, scene, state, api) {
  return api.focus.target('batch-work-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    const done = (id) => cueProgress(ctx, api, id) === 1;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        const data =
          b === 0
            ? {
                name: 'Classifier',
                single: 3,
                batch: 8,
                cue: 'work-classifier',
                max: 4500,
              }
            : b === 1
              ? {
                  name: 'Embedding',
                  single: 5,
                  batch: 10,
                  cue: 'work-embed',
                  max: 4500,
                }
              : {
                  name: 'Autoregressive judge',
                  single: 150,
                  batch: 400,
                  cue: 'work-judge',
                  max: 100,
                };
        moderationText(ctx, api, data.name + ' · authored service times', 150, 275, 35);
        const ready = done(data.cue),
          singleRate = 1000 / data.single,
          batchRate = 32000 / data.batch;
        moderationBox(ctx, api, '1 item / ' + data.single + ' ms', 180, 365, 650, 85, C.blue, 33);
        moderationBox(ctx, api, '32 items / ' + data.batch + ' ms', 1070, 365, 650, 85, C.cyan, 33);
        const clock = data.batch * cueProgress(ctx, api, data.cue),
          x = (ms) => 360 + (ms / data.batch) * 1320;
        moderationText(
          ctx,
          api,
          'Service clock · ' + clock.toFixed(b === 2 ? 0 : 1) + ' ms',
          170,
          535,
          29,
          C.yellow,
        );
        [
          [1, data.single, 600, C.blue],
          [32, data.batch, 710, C.cyan],
        ].forEach(([items, end, y, color]) => {
          moderationText(
            ctx,
            api,
            items + ' item' + (items === 1 ? '' : 's'),
            170,
            y + 20,
            28,
            color,
          );
          api.rect(ctx, x(0), y - 20, x(end) - x(0), 55, C.panel, color, 0);
          const elapsed = Math.min(clock, end);
          if (elapsed > 0) api.rect(ctx, x(0), y - 20, x(elapsed) - x(0), 55, color, undefined, 0);
          moderationText(ctx, api, end + ' ms', x(end), y - 45, 26, color, 'center');
          if (clock > 0) moderationLine(ctx, api, x(clock), y - 25, x(clock), y + 40, C.yellow, 3);
          if (clock >= end)
            moderationText(ctx, api, items + ' complete', 1850, y + 18, 26, C.green, 'right');
        });
        if (ready) {
          moderationText(
            ctx,
            api,
            singleRate.toFixed(b === 2 ? 1 : 0) + ' items/s',
            180,
            790,
            36,
            C.blue,
          );
          moderationText(ctx, api, batchRate.toFixed(0) + ' items/s', 1070, 790, 36, C.cyan);
          moderationBar(ctx, api, 180, 835, 650, 55, [singleRate], data.max, [C.blue]);
          moderationBar(ctx, api, 1070, 835, 650, 55, [batchRate], data.max, [C.cyan]);
          moderationText(
            ctx,
            api,
            b === 0
              ? done('work-classifier-summary')
                ? '12× throughput; 3→8 ms service'
                : 'Throughput ratio pending'
              : b === 1
                ? '16× throughput; 5→10 ms service'
                : done('work-budget')
                  ? 'Complete decision: 400 ms > 200 ms budget'
                  : 'Decision-budget comparison pending',
            960,
            960,
            31,
            b === 2 && done('work-budget') ? C.pink : C.yellow,
            'center',
          );
        }
        if (b === 2 && done('work-budget')) {
          moderationLine(ctx, api, 1090, 920, 1690, 920, C.pink, 5);
          moderationText(
            ctx,
            api,
            'First token is not the validated verdict',
            960,
            1030,
            26,
            C.muted,
            'center',
          );
        } else
          moderationNote(
            ctx,
            api,
            'Formation wait and full queue residence are outside these invented service intervals.',
          );
      }
    }
  });
}
export default {
  id: 'batch-work',
  draw: drawBatchWork,
  cues: [
    'work-single',
    'work-classifier',
    'work-classifier-summary',
    'work-embed',
    'work-embed-limit',
    'work-judge',
    'work-budget',
  ],
};
