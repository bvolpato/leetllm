import { clamp } from '../arithmetic.mjs';
import { records } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { aggregate } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawExactCounts(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('exact-counts', state),
    currentBeat = modelState.step;
  if (state.cues && currentBeat === 1) {
    modelState.inspected = Math.ceil(records.length * api.focus.progress('complete-filter', 0));
    modelState.selected = records
      .slice(0, modelState.inspected)
      .filter((row) => row.month === 'Mar' && row.type === 'timeout');
    Object.assign(modelState, aggregate(modelState.selected));
    modelState.complete = modelState.inspected === records.length;
  }
  {
    ['ID', 'Month', 'Service', 'Event', 'Selected'].forEach((value, i) =>
      api.focus.target('exact-counts-readout', () =>
        text(ctx, api, value, [150, 330, 560, 800, 1120][i], 300, 28, themeColors.muted),
      ),
    );
    records.forEach((row, i) =>
      api.focus.target('counted-records', () => {
        const selected = modelState.selected.some((item) => item.id === row.id),
          color = selected ? themeColors.ink : themeColors.muted,
          y = 385 + i * 68;
        const pending = currentBeat === 1 && i >= modelState.inspected;
        [
          row.id,
          row.month,
          row.service,
          row.type,
          selected ? 'counted' : pending ? 'pending' : 'excluded',
        ].forEach((value, j) =>
          api.focus.target('exact-counts-readout-2', () =>
            text(
              ctx,
              api,
              value,
              [150, 330, 560, 800, 1120][j],
              y,
              29,
              j === 4 && selected ? themeColors.green : color,
            ),
          ),
        );
      }),
    );
    api.focus.target('exact-counts-readout-3', () => {
      ['A', 'B'].forEach((name, j) => {
        text(
          ctx,
          api,
          name + ': ' + modelState.counts[name],
          1495 + j * 205,
          335,
          32,
          themeColors.cyan,
          'center',
        );
        api.line(ctx, 1420 + j * 205, 655, 1570 + j * 205, 655, themeColors.muted, 3);
      });
      const slots = {
        A: 0,
        B: 0,
      };
      modelState.selected.forEach((row) => {
        const i = records.indexOf(row),
          slot = slots[row.service]++,
          j = row.service === 'A' ? 0 : 1,
          move =
            currentBeat === 1
              ? clamp(api.focus.progress('complete-filter', modelState.p) * records.length - i)
              : 1,
          x = api.lerp(1290, 1450 + j * 205, api.phase(move, 0.25, 0.75)),
          y =
            move < 0.25
              ? api.lerp(350 + i * 68, 360, move / 0.25)
              : move > 0.75
                ? api.lerp(360, 595 - slot * 75, (move - 0.75) / 0.25)
                : 360;
        api.rect(ctx, x, y, 90, 55, themeColors.panel, themeColors.green, 2);
        text(ctx, api, row.id, x + 45, y + 37, 27, themeColors.green, 'center');
      });
    });
    api.focus.target('exact-counts-readout-4', () =>
      card(
        ctx,
        api,
        `${modelState.complete ? 'Winner' : 'Current leader'}: ${modelState.winner}`,
        1370,
        680,
        430,
        themeColors.yellow,
      ),
    );
    api.focus.target('exact-counts-readout-5', () =>
      text(
        ctx,
        api,
        currentBeat === 0
          ? 'Top-two matching rows'
          : `${modelState.complete ? 'All March timeouts' : `Inspected ${modelState.inspected}/${records.length} records`} · counted ${modelState.sources.join(', ') || 'none'}`,
        140,
        960,
        30,
        themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'exact-counts',
  draw: drawExactCounts,
  cues: [
    'ranked-rows',
    'partial-winner',
    'complete-filter',
    'exact-result',
    'checked-aggregate',
    'counted-population',
  ],
};
