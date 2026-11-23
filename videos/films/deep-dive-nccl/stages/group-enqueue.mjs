import { done, sentence } from '../construction.mjs';
import { chapterHeading, chapterLine, chapterNote, chapterText } from '../defaults.mjs';
export function drawGroupEnqueue(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'group-enqueue', bi, si),
      resultComplete = (bi, si) => done(state, 'group-enqueue', bi, si);
    {
      if (currentBeat === 2) {
        chapterHeading(ctx, api, 'A group joins both prior stream dependencies');
        const clock = 4 * progress(2, 2) + 4 * progress(2, 3);
        const trace = teaching.timeline({
          x: 180,
          y: 390,
          width: 1560,
          height: 370,
          domain: [0, 10],
          time: clock,
          lanes: [
            {
              id: 'a',
              label: 'CUDA stream A',
            },
            {
              id: 'z',
              label: 'CUDA stream B',
            },
          ],
          intervals: [
            {
              id: 'a-prior',
              lane: 'a',
              start: 0,
              end: 2,
              label: 'prior A',
              color: themeColors.blue,
            },
            {
              id: 'a-wait',
              lane: 'a',
              start: 2,
              end: 4,
              label: 'wait',
              color: themeColors.yellow,
            },
            {
              id: 'a-group',
              lane: 'a',
              start: 4,
              end: 8,
              label: 'group kernel / blocked',
              color: themeColors.cyan,
            },
            {
              id: 'z-prior',
              lane: 'z',
              start: 0,
              end: 4,
              label: 'prior B',
              color: themeColors.pink,
            },
            {
              id: 'z-group',
              lane: 'z',
              start: 4,
              end: 8,
              label: 'same group / blocked',
              color: themeColors.cyan,
            },
          ],
          ticks: [0, 2, 4, 6, 8, 10],
          labelWidth: 310,
          fontSize: 27,
          color: themeColors.muted,
          trackColor: themeColors.panel,
          cursorColor: themeColors.yellow,
        });
        chapterLine(ctx, api, trace.point(4), 780, trace.point(4), 840, themeColors.yellow, 4);
        chapterText(
          ctx,
          api,
          'Join after both prior dependencies',
          trace.point(4),
          890,
          30,
          themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          resultComplete(2, 3)
            ? 'Both streams can now run their next kernel'
            : 'The grouped kernel waits for prior work on both streams',
          960,
          980,
          30,
          resultComplete(2, 3) ? themeColors.green : themeColors.yellow,
          'center',
        );
        chapterNote(ctx, api, 'Time in relative units');
        return;
      }
      const enqueue = currentBeat > 0 || resultComplete(0, 2);
      chapterHeading(
        ctx,
        api,
        currentBeat === 0 ? 'Blocking communicator' : 'Nonblocking communicator',
      );
      const intervals = [
        {
          id: 'call',
          lane: 'host',
          start: 0,
          end: 2,
          label: currentBeat === 0 ? 'calls return' : 'in progress',
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
      const clock =
        currentBeat === 0
          ? 2 + 2 * progress(0, 2)
          : currentBeat === 1
            ? 2 + 2 * progress(1, 1) + 5 * progress(1, 2)
            : 9;
      teaching.timeline({
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
            label: 'Group / enqueue',
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
      {
        chapterText(
          ctx,
          api,
          currentBeat === 0
            ? enqueue
              ? 'GroupEnd success establishes enqueue'
              : 'GroupEnd can still have work to enqueue'
            : currentBeat === 1
              ? resultComplete(1, 1)
                ? 'Async success permits CUDA completion operations'
                : 'In-progress → poll errors until success'
              : 'Same global call order across communicators and streams',
          960,
          935,
          31,
          themeColors.yellow,
          'center',
        );
        chapterNote(ctx, api, 'Example timeline in milliseconds');
      }
    }
  });
}
export default {
  id: 'group-enqueue',
  draw: drawGroupEnqueue,
  cues: [
    'nc-group-enqueue-b0-s0',
    'nc-group-enqueue-b0-s1',
    'nc-group-enqueue-b0-s2',
    'nc-group-enqueue-b0-s3',
    'nc-group-enqueue-b1-s0',
    'nc-group-enqueue-b1-s1',
    'nc-group-enqueue-b1-s2',
    'nc-group-enqueue-b1-s3',
    'nc-group-enqueue-b2-s0',
    'nc-group-enqueue-b2-s1',
    'nc-group-enqueue-b2-s2',
    'nc-group-enqueue-b2-s3',
  ],
};
