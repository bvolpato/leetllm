import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawPlacement(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('placement', state),
    currentBeat = modelState.b;
  {
    text(
      ctx,
      api,
      modelState.strict ? 'Strict pack · all bundles on one node' : 'Pack · may span nodes',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    const resultReady =
        currentBeat === 0 ||
        state.cues?.[currentBeat === 1 ? 'ray-placement-pending' : 'ray-placement-reserved']
          ?.phase === 'after',
      assigned = currentBeat === 2 && !resultReady ? [0, 0] : modelState.assigned;
    modelState.capacity.forEach((cap, i) => {
      text(
        ctx,
        api,
        `Node ${i} · ${cap} GPUs available`,
        510 + i * 880,
        400,
        33,
        themeColors.blue,
        'center',
      );
      api.focus.target('placement-array-from-length-cap-j-j-s-assigned-i-bundle-i-j-2-j-free', () =>
        teaching.grid({
          x: 190 + i * 880,
          y: 510,
          width: 640,
          height: 160,
          rows: 1,
          columns: cap,
          labels: [
            Array.from(
              {
                length: cap,
              },
              (_, j) => (j < assigned[i] ? `bundle ${i ? j + 2 : j}` : 'free'),
            ),
          ],
          fontSize: 29,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          highlights: Array.from(
            {
              length: assigned[i],
            },
            (_, column) => ({
              row: 0,
              column,
              fill: themeColors.panel,
              stroke: themeColors.green,
            }),
          ),
        }),
      );
    });
    api.focus.target('placement-reservation-status', () =>
      text(
        ctx,
        api,
        resultReady
          ? modelState.feasible
            ? 'All four bundles reserved'
            : 'All four bundles pending · initial allocation stays atomic'
          : 'Compare strict group with the supplied node capacities',
        960,
        850,
        37,
        resultReady
          ? modelState.feasible
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Scheduling resources describe capacity; topology requirements remain explicit',
      960,
      990,
      27,
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
    'ray-placement-pending',
    'placement-beat-3-focus-1',
    'ray-placement-reserved',
    'ray-placement-grow',
  ],
};
