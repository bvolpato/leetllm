import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyEquation, drawLegacyText } from '../defaults.mjs';
export function drawCapacity(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('capacity', state),
    currentBeat = modelState.step;
  {
    if (currentBeat === 0) {
      drawLegacyText(
        ctx,
        api,
        '224 GiB usable pool · each cell holds up to 64 jobs',
        720,
        300,
        31,
        themeColors.blue,
        'center',
      );
      modelState.slotGroups.forEach((jobs, i) => {
        const x = 180 + (i % 12) * 86,
          y = 390 + Math.floor(i / 12) * 66;
        api.focus.target('capacity-jobs-string-jobs', () =>
          drawLegacyCard(
            ctx,
            api,
            jobs ? String(jobs) : '·',
            x,
            y,
            74,
            jobs ? themeColors.cyan : themeColors.muted,
            50,
            21,
          ),
        );
      });
      drawLegacyText(
        ctx,
        api,
        'Assumed private footprint',
        1490,
        415,
        29,
        themeColors.muted,
        'center',
      );
      drawLegacyText(
        ctx,
        api,
        modelState.privateMiB + ' MiB / job',
        1490,
        515,
        40,
        themeColors.yellow,
        'center',
      );
      drawLegacyText(
        ctx,
        api,
        modelState.capacity.toLocaleString() + ' slots',
        1490,
        665,
        47,
        themeColors.cyan,
        'center',
      );
      drawLegacyEquation(
        ctx,
        api,
        `\\left\\lfloor\\frac{229376}{${modelState.privateMiB}}\\right\\rfloor=${modelState.capacity}`,
        960,
        900,
        45,
      );
      drawLegacyText(
        ctx,
        api,
        'Planning illustration · each cell count derives from the current footprint',
        960,
        1000,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      drawLegacyText(
        ctx,
        api,
        '128 physical cores · one active job per core in this fixture',
        710,
        290,
        29,
        themeColors.blue,
        'center',
      );
      for (let i = 0; i < 128; i++)
        components.card({
          label: i < modelState.running ? '●' : '·',
          x: 180 + (i % 16) * 60,
          y: 365 + Math.floor(i / 16) * 55,
          width: 48,
          height: 42,
          fontSize: 20,
          padding: 4,
          fill: themeColors.panel,
          stroke: i < modelState.running ? themeColors.green : themeColors.muted,
          textColor: i < modelState.running ? themeColors.green : themeColors.muted,
        });
      drawLegacyText(
        ctx,
        api,
        'Queue · up to 320 jobs per cell',
        1480,
        290,
        27,
        themeColors.pink,
        'center',
      );
      modelState.queueGroups.forEach((jobs, i) =>
        api.focus.target('capacity-jobs-string-jobs-2', () =>
          drawLegacyCard(
            ctx,
            api,
            jobs ? String(jobs) : '·',
            1280 + (i % 4) * 115,
            375 + Math.floor(i / 4) * 125,
            100,
            jobs ? themeColors.pink : themeColors.muted,
            85,
            23,
          ),
        ),
      );
      drawLegacyText(
        ctx,
        api,
        `Woken ${modelState.burstJobs.toLocaleString()} · running ${modelState.running} · queued ${modelState.queued.toLocaleString()}`,
        960,
        855,
        33,
        themeColors.yellow,
        'center',
      );
      api.focus.target('capacity-id-wake-label-wake-up-wave', () =>
        teaching.timeline({
          x: 180,
          y: 885,
          width: 1560,
          height: 100,
          domain: [0, 8],
          time: modelState.now,
          lanes: [
            {
              id: 'wake',
              label: 'Wake-up wave',
            },
          ],
          intervals: [
            {
              id: 'burst',
              lane: 'wake',
              start: 3,
              end: 4.6,
              label: '3,840 wake',
              color: themeColors.pink,
            },
          ],
          ticks: [0, 2, 4, 6, 8],
          formatTime: (v) => v + ' s',
          fontSize: 20,
          labelWidth: 230,
        }),
      );
      drawLegacyText(
        ctx,
        api,
        `Reference mean demand: 3,840 × 3% = ${modelState.meanCores.toFixed(1)} cores; burst accounting uses actual arrivals above`,
        960,
        1040,
        25,
        themeColors.muted,
        'center',
      );
    }
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: [
    'capacity-beat-1-focus-1',
    'capacity-beat-1-focus-2',
    'capacity-beat-2-focus-1',
    'capacity-beat-2-focus-2',
  ],
};
