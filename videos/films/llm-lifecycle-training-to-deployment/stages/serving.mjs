import { sampleModel } from '../model.mjs';
import { drawLegacyText } from '../defaults.mjs';
export function drawServing(ctx, scene, state, api) {
  api.focus.target('serving-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api;
    const modelState = sampleModel('serving', state);
    {
      const stages = ['post-training', 'evaluation', 'compression', 'serving'],
        labels = [
          'v4 · trained checkpoint',
          'v4 · candidate under test',
          'v4 · quantized derivative',
          'v4 / INT4 · runtime artifact',
        ];
      const current = stages.indexOf('serving');
      const x = 550 + current * 250;
      api.line(ctx, 550, 235, 1300, 235, themeColors.muted, 2);
      stages.forEach((id, i) =>
        api.circle(
          ctx,
          550 + i * 250,
          235,
          8,
          i <= current ? themeColors.green : themeColors.muted,
        ),
      );
      drawLegacyText(ctx, api, labels[current], x, 205, 24, themeColors.green, 'center');
    }
    {
      drawLegacyText(
        ctx,
        api,
        'One short request and one long request · decode iterations',
        960,
        300,
        27,
        themeColors.muted,
        'center',
      );
      const timeline = teaching.timeline({
        x: 150,
        y: 350,
        width: 1620,
        height: 300,
        domain: [0, 600],
        time: modelState.time,
        lanes: [
          {
            id: 'static-short',
            focusTarget: 'static-request-slot',
            label: 'Static · A',
          },
          {
            id: 'static-long',
            label: 'Static · B',
          },
          {
            id: 'continuous-short',
            label: 'Iterative · slot A',
          },
          {
            id: 'continuous-long',
            label: 'Iterative · B',
          },
        ],
        intervals: [
          {
            id: 'static-a',
            lane: 'static-short',
            start: 0,
            end: 15,
            label: 'A',
            color: themeColors.blue,
          },
          {
            id: 'static-idle',
            lane: 'static-short',
            start: 15,
            end: 600,
            label: 'idle slot',
            color: themeColors.pink,
          },
          {
            id: 'static-b',
            lane: 'static-long',
            start: 0,
            end: 600,
            label: 'B',
            color: themeColors.cyan,
          },
          {
            id: 'continuous-a',
            lane: 'continuous-short',
            start: 0,
            end: 15,
            label: 'A',
            color: themeColors.blue,
          },
          {
            id: 'continuous-c',
            lane: 'continuous-short',
            start: 15,
            end: 45,
            label: 'C',
            color: themeColors.green,
          },
          {
            id: 'continuous-b',
            lane: 'continuous-long',
            start: 0,
            end: 600,
            label: 'B',
            color: themeColors.cyan,
          },
          {
            id: 'continuous-capacity',
            lane: 'continuous-short',
            start: 45,
            end: 600,
            label: 'capacity for arrivals',
            color: themeColors.muted,
          },
        ],
        ticks: [0, 15, 300, 600],
        formatTime: (value) => String(value),
        labelWidth: 190,
        fontSize: 20,
      });
      drawLegacyText(
        ctx,
        api,
        'Static batch leaves ' + modelState.staticIdle + ' iterations of the short slot unused',
        960,
        690,
        25,
        themeColors.yellow,
        'center',
      );
      if (modelState.step < 2) {
        drawLegacyText(
          ctx,
          api,
          modelState.step === 0
            ? 'Zoom · the first 45 iterations'
            : 'Same freed slot · request C enters after A completes',
          960,
          745,
          26,
          themeColors.green,
          'center',
        );
        teaching.timeline({
          x: 220,
          y: 785,
          width: 1480,
          height: 195,
          domain: [0, 45],
          time: modelState.time,
          lanes: [
            {
              id: 'static',
              label: 'Static · slot A',
            },
            {
              id: 'iterative',
              focusTarget: 'reused-request-slot',
              label: 'Iterative · slot A',
            },
          ],
          intervals: [
            {
              id: 'zoom-static-a',
              lane: 'static',
              start: 0,
              end: 15,
              label: 'A',
              color: themeColors.blue,
            },
            {
              id: 'zoom-idle',
              lane: 'static',
              start: 15,
              end: 45,
              label: 'idle',
              color: themeColors.pink,
            },
            {
              id: 'zoom-iterative-a',
              lane: 'iterative',
              start: 0,
              end: 15,
              label: 'A',
              color: themeColors.blue,
            },
            {
              id: 'zoom-c',
              lane: 'iterative',
              start: 15,
              end: 45,
              label: 'C · replacement request',
              color: themeColors.green,
            },
          ],
          ticks: [0, 15, 30, 45],
          formatTime: String,
          labelWidth: 240,
          fontSize: 22,
        });
      } else {
        drawLegacyText(
          ctx,
          api,
          'Cache close-up · B positions 15 → 20 · ' +
            modelState.tokensStored +
            ' stored · ' +
            modelState.blocksNeeded +
            ' logical blocks',
          960,
          790,
          24,
          themeColors.muted,
          'center',
        );
        drawLegacyText(ctx, api, 'Logical blocks', 200, 900, 22, themeColors.ink);
        for (let index = 0; index < 5; index++) {
          const used = index < modelState.blocksNeeded;
          api.focus.target('logical-cache-block-' + index, () =>
            api.rect(
              ctx,
              385 + index * 88,
              865,
              76,
              54,
              used ? themeColors.cyan : themeColors.panel,
              themeColors.muted,
              2,
            ),
          );
          drawLegacyText(
            ctx,
            api,
            'L' + index,
            423 + index * 88,
            900,
            19,
            used ? themeColors.ink : themeColors.muted,
            'center',
          );
        }
        drawLegacyText(ctx, api, 'Physical slots', 905, 900, 22, themeColors.ink);
        const physicalOrder = [0, 2, 3, 5, 7];
        for (let index = 0; index < 8; index++) {
          const logical = physicalOrder.indexOf(index);
          const used = logical >= 0 && logical < modelState.blocksNeeded;
          api.focus.target('physical-cache-slot-' + index, () =>
            api.rect(
              ctx,
              1080 + index * 86,
              865,
              74,
              54,
              used ? themeColors.green : themeColors.panel,
              themeColors.muted,
              2,
            ),
          );
          drawLegacyText(
            ctx,
            api,
            String(index),
            1117 + index * 86,
            900,
            19,
            used ? themeColors.ink : themeColors.muted,
            'center',
          );
        }
      }
      drawLegacyText(
        ctx,
        api,
        'Current time · ' + modelState.time.toFixed(0) + ' iterations',
        960,
        1030,
        24,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'serving',
  draw: drawServing,
  cues: ['static-request-slot-b1-1', 'reused-request-slot-b2-1', 'physical-cache-slot-0-b3-1'],
};
