import { sampleModel } from '../model.mjs';
import { drawOriginalSlimeText } from '../defaults.mjs';
export function drawPlacement(ctx, scene, state, api) {
  return paintPlacement(ctx, scene, state, api);
}
function paintPlacement(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('placement', state),
    currentBeat = modelState.b;
  {
    drawOriginalSlimeText(
      ctx,
      api,
      currentBeat === 0
        ? 'Simultaneous residency on one device'
        : currentBeat === 1
          ? `Colocated phase: ${modelState.active}`
          : 'Decoupled devices · independent local gates',
      960,
      285,
      38,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 2) {
      modelState.devices.forEach((device, i) => {
        const x = 185 + i * 850,
          color = i ? themeColors.pink : themeColors.blue;
        drawOriginalSlimeText(
          ctx,
          api,
          `${i ? 'Inference' : 'Train'} device · ${device.fits ? 'PASS' : 'FAIL'}`,
          x + 350,
          365,
          32,
          device.fits ? themeColors.green : themeColors.pink,
          'center',
        );
        api.focus.target(`placement-${device.id}-device`, () =>
          teaching.allocation({
            x,
            y: 415,
            width: 700,
            height: 235,
            capacity: device.capacity,
            parts: [
              {
                id: device.id,
                label: i ? 'Inference resident' : 'Resident training',
                value: device.resident,
                color,
              },
            ],
            unit: 'GiB',
            fontSize: 28,
            color: themeColors.ink,
            trackColor: themeColors.panel,
          }),
        );
      });
      api.focus.target('placement-concurrent-execution', () =>
        teaching.timeline({
          x: 150,
          y: 715,
          width: 1600,
          height: 235,
          domain: [0, 1],
          time: modelState.overlapProgress,
          lanes: [
            {
              id: 'train',
              label: 'Actor training',
            },
            {
              id: 'inference',
              label: 'Generation',
            },
          ],
          intervals: modelState.intervals.map((interval) => ({
            ...interval,
            color: interval.id === 'train' ? themeColors.blue : themeColors.pink,
          })),
          ticks: [0, 1],
          formatTime: (value) => (value === 0 ? 'start' : 'end'),
          labelWidth: 280,
          fontSize: 27,
          color: themeColors.muted,
          trackColor: themeColors.panel,
        }),
      );
      drawOriginalSlimeText(
        ctx,
        api,
        'Supplied resident working sets · illustrative concurrent interval, not measured timing',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
      return;
    }
    if (currentBeat === 0) {
      api.focus.target(
        'placement-s-train-s-inference-s-live-s-capacity-train-inference-together-capac',
        () =>
          teaching.bars({
            x: 270,
            y: 430,
            width: 1350,
            height: 360,
            values: [modelState.train, modelState.inference, modelState.live, modelState.capacity],
            labels: ['Train', 'Inference', 'Together', 'Capacity'],
            colors: [themeColors.blue, themeColors.pink, themeColors.pink, themeColors.green],
            max: 24,
            fontSize: 28,
            showValues: true,
          }),
      );
    } else {
      api.focus.target(
        'placement-id-resident-label-b-2-active-train-device-active-s-active-tolowercas',
        () =>
          teaching.allocation({
            x: 250,
            y: 430,
            width: 1400,
            height: 350,
            capacity: modelState.capacity,
            parts: [
              {
                id: 'resident',
                label:
                  currentBeat === 2
                    ? 'Active train device'
                    : `Active ${modelState.active.toLowerCase()}`,
                value: modelState.live,
                color: themeColors.blue,
              },
            ],
            unit: 'GiB',
            fontSize: 31,
            color: themeColors.ink,
            trackColor: themeColors.panel,
          }),
      );
    }
    drawOriginalSlimeText(
      ctx,
      api,
      currentBeat === 2
        ? 'Train 12 / 16 GiB · separate inference device 10 / 16 GiB'
        : `Current resident ${modelState.live} GiB · capacity ${modelState.capacity} GiB · ${modelState.fits ? 'fits' : 'exceeds capacity'}`,
      960,
      920,
      35,
      modelState.fits ? themeColors.green : themeColors.pink,
      'center',
    );
    drawOriginalSlimeText(
      ctx,
      api,
      'Supplied resident working sets · topology and lifecycle determine overlap',
      960,
      1010,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'placement',
  draw: drawPlacement,
  cues: [
    'placement-beat-1-focus-1',
    'placement-beat-2-focus-1',
    'placement-beat-3-focus-1',
    'placement-overlap',
  ],
};
