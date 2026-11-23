import { adam, clamp } from '../arithmetic.mjs';
import { complete, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterGrid,
  drawChapterSend,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawRingVolume(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'ring-volume', beat, index),
    resultComplete = (beat, index) => complete(state, 'ring-volume', beat, index);
  api.focus.target('ring-volume-construction', () => {
    drawRing();
  });
  function drawRing() {
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    if (currentBeat < 2) {
      drawChapterText(
        ctx,
        api,
        'Supplied ring · N = 4 · full vector P = 12 elements',
        960,
        285,
        33,
        themeColors.yellow,
        'center',
      );
      const rounds = Math.min(3, Math.floor(sentenceProgress(0, 0) * 3));
      for (let rank = 0; rank < 4; rank++) {
        const x = 150 + rank * 430;
        drawChapterCard(ctx, api, 'R' + rank, x, 360, 340, colors[rank], 80, 33);
        drawChapterGrid(
          ctx,
          api,
          [
            Array.from(
              {
                length: 3,
              },
              (_, i) => (i < rounds ? 'send 3' : ''),
            ),
          ],
          x,
          510,
          340,
          90,
          colors[rank],
          26,
        );
        if (rounds < 3 && sentenceProgress(0, 0) > 0) {
          const next = (rank + 1) % 4,
            start = {
              x: x + 170,
              y: 650,
            },
            end = {
              x: 150 + next * 430 + 170,
              y: 650,
            };
          if (rank < 3)
            drawChapterSend(
              ctx,
              api,
              start.x,
              start.y,
              end.x,
              end.y,
              (sentenceProgress(0, 0) * 3) % 1,
              colors[rank],
            );
        }
      }
      if (resultComplete(0, 0))
        drawChapterText(
          ctx,
          api,
          'Each rank sends 3 rounds × 3 elements = 9 = ¾P',
          960,
          760,
          37,
          themeColors.cyan,
          'center',
        );
      if (currentBeat === 1 && resultComplete(1, 0))
        drawChapterText(
          ctx,
          api,
          'Replicated DP: reduce-scatter + all-gather → 18 sends/rank',
          960,
          850,
          33,
          themeColors.blue,
          'center',
        );
      if (currentBeat === 1 && resultComplete(1, 1))
        drawChapterText(
          ctx,
          api,
          'Simple ZeRO-3: gather + gather + reduce-scatter → 27 sends/rank',
          960,
          930,
          33,
          themeColors.pink,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        'Send counts on both sides · equal element widths · not elapsed time',
        1025,
      );
    } else if (currentBeat === 2) {
      const progress = sentenceProgress(2, 0),
        own = clamp(progress / 0.35),
        gather = clamp((progress - 0.35) / 0.65),
        updated = [1, 2, 3, 4].map((v) => adam([v, 0, 0], v, 1)[0]);
      drawChapterText(
        ctx,
        api,
        'ZeRO-2 owner update → complete compute replicas',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          ['Owner', 'R0', 'R1', 'R2', 'R3'],
          ['New slice', ...updated.map((v, i) => (own === 1 ? v.toFixed(2) : String(i + 1)))],
        ],
        260,
        360,
        1400,
        160,
        themeColors.blue,
        32,
      );
      for (let rank = 0; rank < 4; rank++) {
        const copied = Math.floor(gather * 4);
        drawChapterValues(
          ctx,
          api,
          'Replica R' + rank,
          updated.map((v, i) =>
            own === 1 && (i === rank || i < copied) ? v.toFixed(2) : String(i + 1) + ' old',
          ),
          580 + rank * 100,
          colors[rank],
        );
        if (gather > 0 && gather < 1) {
          const column = Math.min(3, copied),
            x = 400 + column * 280,
            y = 625 + rank * 100;
          api.path(
            ctx,
            [
              {
                x,
                y: 545,
              },
              {
                x: 1800,
                y: 545,
              },
              {
                x: 1800,
                y,
              },
              {
                x: 1740,
                y,
              },
            ],
            {
              color: themeColors.muted,
              width: 2,
            },
          );
          components.particle({
            points: [
              {
                x,
                y: 545,
              },
              {
                x: 1800,
                y: 545,
              },
              {
                x: 1800,
                y,
              },
              {
                x: 1740,
                y,
              },
            ],
            progress: (gather * 4) % 1,
            radius: 7,
            fill: colors[column],
          });
        }
      }
      drawChapterFooter(
        ctx,
        api,
        'Supplied first Adam update: initial m = v = 0 · g = original w · learning rate 0.01',
        1040,
      );
    } else {
      const elapsed = 14 * sentenceProgress(3, 1);
      drawChapterText(
        ctx,
        api,
        'Separate toy serial schedule · 4 ms forward + 4 ms backward',
        960,
        285,
        32,
        themeColors.yellow,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'Supplied collective service time: 2 ms per event · not measured',
        960,
        345,
        28,
        themeColors.muted,
        'center',
      );
      teaching.timeline({
        x: 150,
        y: 450,
        width: 1600,
        height: 310,
        domain: [0, 14],
        time: elapsed,
        lanes: [
          {
            id: 'dp',
            label: 'Replicated DP',
          },
          {
            id: 'z3',
            label: 'Simple ZeRO-3',
          },
        ],
        intervals: [
          {
            id: 'dpf',
            label: 'F',
            lane: 'dp',
            start: 0,
            end: 4,
            color: themeColors.blue,
          },
          {
            id: 'dpb',
            label: 'B',
            lane: 'dp',
            start: 4,
            end: 8,
            color: themeColors.pink,
          },
          {
            id: 'dprs',
            label: 'RS',
            lane: 'dp',
            start: 8,
            end: 10,
            color: themeColors.cyan,
          },
          {
            id: 'dpag',
            label: 'AG',
            lane: 'dp',
            start: 10,
            end: 12,
            color: themeColors.cyan,
          },
          {
            id: 'zgf',
            label: 'AG',
            lane: 'z3',
            start: 0,
            end: 2,
            color: themeColors.cyan,
          },
          {
            id: 'zf',
            label: 'F',
            lane: 'z3',
            start: 2,
            end: 6,
            color: themeColors.blue,
          },
          {
            id: 'zgb',
            label: 'AG',
            lane: 'z3',
            start: 6,
            end: 8,
            color: themeColors.cyan,
          },
          {
            id: 'zb',
            label: 'B',
            lane: 'z3',
            start: 8,
            end: 12,
            color: themeColors.pink,
          },
          {
            id: 'zrs',
            label: 'RS',
            lane: 'z3',
            start: 12,
            end: 14,
            color: themeColors.cyan,
          },
        ],
        ticks: [0, 2, 4, 6, 8, 10, 12, 14],
        labelWidth: 230,
        fontSize: 26,
        color: themeColors.muted,
        trackColor: themeColors.panel,
        cursorColor: themeColors.yellow,
      });
      if (resultComplete(3, 1))
        drawChapterText(
          ctx,
          api,
          'Send-volume ratio 27/18 = 1.5 · toy step-time ratio 14/12 ≈ 1.167',
          960,
          875,
          34,
          themeColors.green,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        'AG: all-gather · RS: reduce-scatter · actual dtype, overlap and scheduling change these clocks',
      );
    }
  }
}
export default {
  id: 'ring-volume',
  draw: drawRingVolume,
  cues: [
    'ds-ring-volume-b0-s0',
    'ds-ring-volume-b0-s1',
    'ds-ring-volume-b0-s2',
    'ds-ring-volume-b1-s0',
    'ds-ring-volume-b1-s1',
    'ds-ring-volume-b1-s2',
    'ds-ring-volume-b2-s0',
    'ds-ring-volume-b2-s1',
    'ds-ring-volume-b2-s2',
    'ds-ring-volume-b3-s0',
    'ds-ring-volume-b3-s1',
    'ds-ring-volume-b3-s2',
    'ds-ring-volume-b3-s3',
  ],
};
