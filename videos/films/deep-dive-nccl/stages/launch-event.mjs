import { done, sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterText,
} from '../defaults.mjs';
export function drawLaunchEvent(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'launch-event', bi, si),
      resultComplete = (bi, si) => done(state, 'launch-event', bi, si);
    const ranks = [0, 1, 2, 3],
      rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      if (currentBeat === 1) {
        chapterHeading(ctx, api, 'One rank-local event per rank, with a consistent group contract');
        const repaired = resultComplete(1, 1);
        ranks.forEach((r) => {
          const x = 180 + r * 430;
          chapterCard(ctx, api, 'Rank ' + r, x, 390, 360, 80, rankColors[r]);
          chapterCard(
            ctx,
            api,
            r === 2 && !repaired ? 'null' : 'event R' + r,
            x,
            580,
            360,
            95,
            r === 2 && !repaired ? themeColors.pink : rankColors[r],
          );
          chapterLine(ctx, api, x + 180, 480, x + 180, 565, rankColors[r]);
        });
        chapterText(
          ctx,
          api,
          repaired
            ? 'All ranks supply events · timing disabled'
            : 'Rank 2 supplied null while its peers supplied events',
          960,
          800,
          31,
          repaired ? themeColors.green : themeColors.pink,
          'center',
        );
        chapterCard(
          ctx,
          api,
          resultComplete(1, 2)
            ? 'Event retained through waits and captured graph execution'
            : 'Caller retains the event until its queued users complete',
          220,
          885,
          1480,
          90,
          themeColors.yellow,
        );
        chapterNote(
          ctx,
          api,
          resultComplete(1, 4)
            ? 'The reader waits for the writes to finish on the communication stream'
            : resultComplete(1, 3)
              ? 'CUDA <12.3 records the event before launch'
              : 'The launch event belongs to the caller',
        );
        return;
      }
      chapterHeading(ctx, api, 'Example on CUDA 12.3 or newer');
      const intervals = [
        {
          id: 'call',
          lane: 'host',
          start: 0,
          end: 2,
          label: 'calls return',
          color: themeColors.blue,
        },
        {
          id: 'enqueue',
          lane: 'queue',
          start: 2,
          end: 4,
          label: 'enqueue pending',
          color: themeColors.yellow,
        },
        {
          id: 'writes',
          lane: 'gpu',
          start: 4,
          end: 9,
          label: 'collective writes',
          color: themeColors.cyan,
        },
      ];
      const clock = 4 + 5 * progress(0, 3);
      const trace = teaching.timeline({
        x: 165,
        y: 370,
        width: 1580,
        height: 430,
        domain: [0, 10],
        time: clock,
        lanes: [
          {
            id: 'host',
            label: 'Host API',
          },
          {
            id: 'queue',
            label: 'Host enqueue',
          },
          {
            id: 'gpu',
            label: 'Device work',
          },
        ],
        intervals,
        ticks: [0, 2, 4, 6, 8, 10],
        labelWidth: 300,
        fontSize: 27,
        color: themeColors.muted,
        trackColor: themeColors.panel,
        cursorColor: themeColors.yellow,
      });
      const launchX = trace.point(4);
      const gpu = trace.lanes.gpu.bounds;
      chapterLine(
        ctx,
        api,
        launchX,
        gpu.y - 5,
        launchX,
        gpu.y + gpu.height + 4,
        themeColors.yellow,
        4,
      );
      {
        chapterCard(ctx, api, 'Launch event at 4 ms', 200, 865, 670, 90, themeColors.yellow);
        chapterCard(
          ctx,
          api,
          clock >= 9 ? 'Writes complete · output readable' : 'Output B · reader waits',
          1050,
          865,
          670,
          90,
          clock >= 9 ? themeColors.green : themeColors.pink,
        );
      }
    }
  });
}
export default {
  id: 'launch-event',
  draw: drawLaunchEvent,
  cues: [
    'nc-launch-event-b0-s0',
    'nc-launch-event-b0-s1',
    'nc-launch-event-b0-s2',
    'nc-launch-event-b0-s3',
    'nc-launch-event-b1-s0',
    'nc-launch-event-b1-s1',
    'nc-launch-event-b1-s2',
    'nc-launch-event-b1-s3',
    'nc-launch-event-b1-s4',
  ],
};
