import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterL,
  drawSkyChapterRow,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawScheduleComparison(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    { b: currentBeat, p: progress } = skyChapterModel('schedule-comparison', state),
    cueProgress = () =>
      api.focus.progress(`sky-${'schedule-comparison'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-schedule-comparison-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'The same slow group holds a batch boundary'
        : currentBeat === 1
          ? 'Independent groups overlap inside the current epoch'
          : 'Groups contain alternatives for one prompt',
    );
    if (currentBeat < 2) {
      const mode = currentBeat ? 2 : done('pipeline-batch') ? 1 : 0,
        lanes = [
          {
            id: 'A',
            label: 'group A',
          },
          {
            id: 'L',
            label: 'group L',
          },
          {
            id: 'train',
            label: 'trainer',
          },
          {
            id: 'next',
            label: mode === 2 ? 'epoch 2' : 'next batch',
          },
        ],
        intervals =
          mode === 0
            ? [
                {
                  id: 'A complete',
                  lane: 'A',
                  start: 0,
                  end: 2,
                  color: themeColors.blue,
                },
                {
                  id: 'L complete',
                  lane: 'L',
                  start: 0,
                  end: 6,
                  color: themeColors.pink,
                },
                {
                  id: 'update',
                  lane: 'train',
                  start: 6,
                  end: 8,
                  color: themeColors.cyan,
                },
                {
                  id: 'next',
                  lane: 'next',
                  start: 8,
                  end: 10,
                  color: themeColors.blue,
                },
              ]
            : mode === 1
              ? [
                  {
                    id: 'A complete',
                    lane: 'A',
                    start: 0,
                    end: 2,
                    color: themeColors.blue,
                  },
                  {
                    id: 'L complete',
                    lane: 'L',
                    start: 0,
                    end: 6,
                    color: themeColors.pink,
                  },
                  {
                    id: 'current update',
                    lane: 'train',
                    start: 0,
                    end: 3,
                    color: themeColors.cyan,
                  },
                  {
                    id: 'next batch held for L',
                    lane: 'train',
                    start: 6,
                    end: 8,
                    color: themeColors.cyan,
                  },
                ]
              : [
                  {
                    id: 'A complete',
                    lane: 'A',
                    start: 0,
                    end: 2,
                    color: themeColors.blue,
                  },
                  {
                    id: 'L in flight',
                    lane: 'L',
                    start: 0,
                    end: 6,
                    color: themeColors.pink,
                  },
                  {
                    id: 'update A',
                    lane: 'train',
                    start: 2,
                    end: 3,
                    color: themeColors.cyan,
                  },
                  {
                    id: 'update L',
                    lane: 'train',
                    start: 6,
                    end: 7,
                    color: themeColors.cyan,
                  },
                  {
                    id: 'next epoch',
                    lane: 'next',
                    start: 8,
                    end: 10,
                    color: themeColors.blue,
                  },
                ];
      teaching.timeline({
        x: 150,
        y: 370,
        width: 1600,
        height: 460,
        domain: [0, 10],
        time: cueProgress() * 10,
        lanes,
        intervals,
        ticks: [0, 2, 4, 6, 8, 10],
        labelWidth: 330,
        fontSize: 27,
        color: themeColors.muted,
        trackColor: themeColors.panel,
      });
      drawSkyChapterText(
        ctx,
        api,
        [
          'Synchronous: one complete batch before update',
          'One-step pipeline: overlap still retains the batch barrier',
          'Fully async: mini-batches complete while another group runs',
        ][mode],
        960,
        920,
        30,
        themeColors.yellow,
        'center',
      );
      if (mode === 2 && done('epoch-barrier')) {
        drawSkyChapterL(ctx, api, 1500, 370, 1500, 750, themeColors.pink, 4);
        drawSkyChapterText(ctx, api, 'epoch boundary', 1500, 345, 27, themeColors.pink, 'center');
      }
    } else {
      ['query-42', 'query-73'].forEach((id, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          id,
          250 + i * 850,
          380,
          620,
          110,
          i ? themeColors.pink : themeColors.blue,
          38,
        );
        drawSkyChapterRow(ctx, api, [id + '_0', id + '_1'], 630, {
          x: 210 + i * 850,
          width: 700,
          color: i ? themeColors.pink : themeColors.blue,
          size: 31,
        });
      });
      drawSkyChapterText(
        ctx,
        api,
        'Same prompt inside each group · keep group ID across completion order',
        960,
        910,
        31,
        themeColors.cyan,
        'center',
      );
    }
    if (currentBeat < 2) drawSkyChapterFoot(ctx, api, 'Time in example units');
  });
}
export default {
  id: 'schedule-comparison',
  draw: drawScheduleComparison,
  cues: [
    'sky-schedule-comparison-b0',
    'sky-pipeline-batch',
    'sky-schedule-comparison-b1',
    'sky-epoch-barrier',
    'sky-schedule-comparison-b2',
  ],
};
