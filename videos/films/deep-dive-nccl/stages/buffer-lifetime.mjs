import { done, sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterHeading,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawBufferLifetime(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'buffer-lifetime', bi, si),
      resultComplete = (bi, si) => done(state, 'buffer-lifetime', bi, si);
    {
      if (currentBeat === 1) {
        chapterHeading(ctx, api, 'A ready gradient does not retire the weight readers');
        const ready = resultComplete(1, 1),
          readers = resultComplete(1, 2),
          clock = ready ? 6 + 3 * progress(1, 2) : 6 * progress(1, 1);
        teaching.timeline({
          x: 180,
          y: 390,
          width: 1560,
          height: 390,
          domain: [0, 10],
          time: clock,
          lanes: [
            {
              id: 'g',
              label: 'Gradient g writes',
            },
            {
              id: 'w',
              label: 'Parameter W readers',
            },
          ],
          intervals: [
            {
              id: 'g-write',
              lane: 'g',
              start: 0,
              end: 6,
              label: 'gradient write completes at 6',
              color: themeColors.cyan,
            },
            {
              id: 'w-read',
              lane: 'w',
              start: 0,
              end: 9,
              label: 'backward reads W through 9',
              color: themeColors.blue,
            },
          ],
          ticks: [0, 3, 6, 9, 10],
          labelWidth: 340,
          fontSize: 27,
          color: themeColors.muted,
          trackColor: themeColors.panel,
          cursorColor: themeColors.yellow,
        });
        chapterCard(
          ctx,
          api,
          ready ? 'g · writes complete' : 'g · writes pending',
          190,
          855,
          690,
          90,
          ready ? themeColors.green : themeColors.cyan,
        );
        chapterCard(
          ctx,
          api,
          readers
            ? 'W · readers complete · update may proceed'
            : 'W · readers outstanding · update held',
          1040,
          855,
          690,
          90,
          readers ? themeColors.green : themeColors.pink,
        );
        chapterNote(
          ctx,
          api,
          'Supplied event times. Gradient g and parameter W have distinct readiness evidence',
        );
        return;
      }
      chapterHeading(ctx, api, 'One allocation stays live through every outstanding use');
      const q = currentBeat === 0 ? progress(0, 3) : progress(1, 3),
        clock = currentBeat === 0 ? 10 * q : 10;
      teaching.timeline({
        x: 160,
        y: 360,
        width: 1600,
        height: 440,
        domain: [0, 10],
        time: clock,
        lanes: [
          {
            id: 'producer',
            label: 'Input producer',
          },
          {
            id: 'comm',
            label: 'Communication B',
          },
          {
            id: 'reader',
            label: 'Result consumer',
          },
        ],
        intervals: [
          {
            id: 'produce',
            lane: 'producer',
            start: 0,
            end: 2,
            label: 'write B',
            color: themeColors.blue,
          },
          {
            id: 'comm',
            lane: 'comm',
            start: 2,
            end: 7,
            label: 'read + write B',
            color: themeColors.cyan,
          },
          {
            id: 'read',
            lane: 'reader',
            start: 7,
            end: 10,
            label: 'read B',
            color: themeColors.green,
          },
        ],
        ticks: [0, 2, 4, 6, 8, 10],
        labelWidth: 300,
        fontSize: 27,
        color: themeColors.muted,
        trackColor: themeColors.panel,
        cursorColor: themeColors.yellow,
      });
      chapterRectangle(ctx, api, 460, 845, 1280, 75, themeColors.panel, themeColors.yellow);
      chapterText(
        ctx,
        api,
        clock < 10
          ? 'B allocation retained · cannot free or overwrite'
          : 'All B users complete · lifetime boundary reached',
        1100,
        895,
        30,
        clock < 10 ? themeColors.yellow : themeColors.green,
        'center',
      );
      if (currentBeat === 1) {
        const grad = resultComplete(1, 1),
          readers = resultComplete(1, 2);
        chapterText(
          ctx,
          api,
          'Gradient writes: ' + (grad ? 'complete' : 'pending'),
          490,
          990,
          29,
          grad ? themeColors.green : themeColors.cyan,
          'center',
        );
        chapterText(
          ctx,
          api,
          'Weight W readers: ' + (readers ? 'complete' : 'outstanding'),
          1370,
          990,
          29,
          readers ? themeColors.green : themeColors.pink,
          'center',
        );
      }
      chapterNote(
        ctx,
        api,
        'Gradient readiness and parameter-reader completion protect different objects',
      );
    }
  });
}
export default {
  id: 'buffer-lifetime',
  draw: drawBufferLifetime,
  cues: [
    'nc-buffer-lifetime-b0-s0',
    'nc-buffer-lifetime-b0-s1',
    'nc-buffer-lifetime-b0-s2',
    'nc-buffer-lifetime-b0-s3',
    'nc-buffer-lifetime-b0-s4',
    'nc-buffer-lifetime-b1-s0',
    'nc-buffer-lifetime-b1-s1',
    'nc-buffer-lifetime-b1-s2',
    'nc-buffer-lifetime-b1-s3',
  ],
};
