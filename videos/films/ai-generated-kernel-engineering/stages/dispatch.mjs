import { gappedRows } from '../fixtures.mjs';
import { layoutDispatch } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawDispatch(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('dispatch', state),
    currentBeat = modelState.step;
  {
    const progress = api.focus.progress('dispatch-beat-2-focus-1', 0),
      gap = currentBeat > 0 && progress > 0;
    if (!gap) {
      modelState.calls.slice(0, modelState.visible).forEach((r, i) => {
        const y = 300 + i * 125;
        api.focus.target('dispatch-row-name', () =>
          drawCard(ctx, api, r.name, 150, y, 1000, themeColors.blue, 85, 32),
        );
        api.focus.target('dispatch-row-fast-fast-path-reference', () =>
          drawCard(
            ctx,
            api,
            r.fast ? 'FAST PATH' : 'REFERENCE',
            1300,
            y,
            430,
            r.fast ? themeColors.green : themeColors.yellow,
            85,
            32,
          ),
        );
      });
    } else {
      const d = layoutDispatch(),
        repaired = progress > 0.35,
        addresses = repaired ? d.rows[1].addresses : d.flattened,
        active = Math.min(
          3,
          Math.floor((repaired ? (progress - 0.35) / 0.65 : progress / 0.35) * 4),
        ),
        address = addresses[active],
        cell = 225 + (address + 0.5) * 147;
      api.focus.target('dispatch-gapped-layout', () => {
        drawText(
          ctx,
          api,
          'Separate layout worksheet:shape2×4 · strides[6,1]',
          960,
          280,
          33,
          themeColors.cyan,
          'center',
        );
        drawText(ctx, api, 'Index', 195, 395, 27, themeColors.muted, 'right');
        drawText(ctx, api, 'Value', 195, 535, 27, themeColors.muted, 'right');
        teaching.grid({
          x: 225,
          y: 335,
          width: 1470,
          height: 100,
          rows: 1,
          columns: 10,
          labels: [
            Array.from(
              {
                length: 10,
              },
              (_, i) => i,
            ),
          ],
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
          fontSize: 35,
        });
        teaching.grid({
          x: 225,
          y: 475,
          width: 1470,
          height: 100,
          rows: 1,
          columns: 10,
          labels: [gappedRows.storage.map((v) => v ?? 'gap')],
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          fontSize: 35,
          highlights: [
            {
              row: 0,
              column: address,
              fill: '#f4d47730',
              stroke: themeColors.yellow,
            },
          ],
        });
        api.arrow(ctx, cell, 585, cell, 635, repaired ? themeColors.green : themeColors.pink, 4);
        drawText(
          ctx,
          api,
          repaired ? 'base +1×6 + column' : 'incorrect flat base +1×4 + column',
          960,
          695,
          33,
          repaired ? themeColors.green : themeColors.pink,
          'center',
        );
        teaching.grid({
          x: 330,
          y: 755,
          width: 1260,
          height: 85,
          rows: 1,
          columns: 4,
          labels: [addresses.map((a) => gappedRows.storage[a] ?? 'gap')],
          fill: themeColors.panel,
          stroke: repaired ? themeColors.green : themeColors.pink,
          textColor: themeColors.ink,
          fontSize: 35,
        });
        drawText(
          ctx,
          api,
          repaired
            ? 'Row1 reads addresses[6,7,8,9] → values[5,6,7,8]'
            : 'Flat row1 reads[4,5,6,7] → gaps corrupt its input',
          960,
          920,
          31,
          repaired ? themeColors.green : themeColors.pink,
          'center',
        );
      });
    }
    drawText(
      ctx,
      api,
      'Whole-layout predicate → verified reference for unsupported valid views',
      960,
      1015,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'dispatch',
  draw: drawDispatch,
  cues: ['dispatch-beat-1-focus-1', 'dispatch-beat-1-focus-2', 'dispatch-beat-2-focus-1'],
};
