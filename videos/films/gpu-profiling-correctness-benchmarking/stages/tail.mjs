import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawTail(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('tail', state),
    currentBeat = modelState.step;
  {
    text(ctx, api, themeColors, 'Logical length = 5 · launched thread positions = 8', 150, 290, 36);
    text(
      ctx,
      api,
      themeColors,
      'Buggy guard: i ≤ n · n = 5',
      960,
      330,
      28,
      themeColors.yellow,
      'center',
    );
    api.focus.target('tail-array-from-length-8-i-string-i', () =>
      teaching.grid({
        x: 170,
        y: 410,
        width: 1560,
        height: 130,
        rows: 1,
        columns: 8,
        labels: [
          Array.from(
            {
              length: 8,
            },
            (_, i) => String(i),
          ),
        ],
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        fontSize: 40,
        highlights: modelState.writes.map((i) => ({
          row: 0,
          column: i,
          fill: i < 5 ? '#8cdeb52b' : '#ef9ac82b',
          stroke: i < 5 ? themeColors.green : themeColors.pink,
        })),
      }),
    );
    api.line(ctx, 1145, 365, 1145, 595, themeColors.yellow, 4);
    text(ctx, api, themeColors, 'Logical boundary', 1145, 650, 31, themeColors.yellow, 'center');
    text(
      ctx,
      api,
      themeColors,
      'Physical allocation: ' + modelState.allocated + ' slots',
      170,
      360,
      29,
      themeColors.blue,
    );
    api.focus.target('tail-physical-allocation', () =>
      api.rect(ctx, 170, 395, 195 * modelState.allocated, 160, null, themeColors.blue, 4),
    );
    api.focus.target('tail-b-0-allocation-has-spare-space-exact-sized-allocation', () =>
      card(
        ctx,
        api,
        themeColors,
        components,
        modelState.allocated > modelState.valid
          ? 'Allocation has spare space'
          : 'Exact-sized allocation',
        300,
        740,
        650,
        themeColors.blue,
      ),
    );
    api.focus.target('tail-s-illegal-store-at-i-5-beyond-shape-threads-still-launching', () =>
      card(
        ctx,
        api,
        themeColors,
        components,
        modelState.illegal ? 'Store at i = 5: beyond shape' : 'Threads still launching',
        1070,
        740,
        650,
        modelState.illegal ? themeColors.pink : themeColors.muted,
        95,
        29,
      ),
    );
    text(
      ctx,
      api,
      themeColors,
      modelState.allocationOverrun
        ? 'The same extra store now crosses the allocation boundary'
        : 'Logical outputs can match while an extra store stays inside allocation',
      960,
      975,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'tail',
  draw: drawTail,
  cues: [
    'tail-beat-1-focus-1',
    'tail-beat-1-focus-2',
    'tail-beat-2-focus-1',
    'tail-beat-2-focus-2',
  ],
};
