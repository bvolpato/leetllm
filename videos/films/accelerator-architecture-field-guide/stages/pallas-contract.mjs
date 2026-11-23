import { pallasOwnershipTrace } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawArrow, drawCard, drawCenteredText, drawFooter, drawPanel } from '../defaults.mjs';
export function drawPallasContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('pallas-contract-mechanism', () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'TensorCore assembly · 2 MXUs + vector/scalar resources',
        960,
        285,
        32,
        themeColors.yellow,
      );
      drawPanel(ctx, api, 110, 365, 740, 460, themeColors.blue);
      drawCenteredText(ctx, api, 'HBM input tensor', 480, 430, 34, themeColors.blue);
      teaching.grid({
        x: 170,
        y: 490,
        width: 620,
        height: 260,
        rows: 4,
        columns: 6,
        fill: themeColors.panel,
        stroke: themeColors.blue,
      });
      drawPanel(ctx, api, 1110, 365, 700, 460, themeColors.cyan);
      drawCenteredText(ctx, api, 'Program-local window', 1460, 430, 34, themeColors.cyan);
      if (B('block', 0)) {
        teaching.grid({
          x: 1240,
          y: 530,
          width: 420,
          height: 150,
          rows: 2,
          columns: 3,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
        });
        drawArrow(ctx, api, 880, 620, 1070, 620, themeColors.yellow);
        drawCenteredText(ctx, api, 'BlockSpec(program index)', 960, 940, 32, themeColors.yellow);
      }
    } else if (currentBeat === 1) {
      const repaired = resultComplete('reduction', 1),
        bad = B('output', 1) && !repaired,
        trace = pallasOwnershipTrace(bad ? 'interleaved' : 'consecutive'),
        count = Math.min(
          4,
          Math.floor(4 * (bad ? ev('output', 1) : repaired ? 1 : ev('reuse', 1))),
        );
      drawCenteredText(
        ctx,
        api,
        bad
          ? 'Interleaved output windows · single live accumulator'
          : 'Consecutive reduction visits · owned output survives',
        960,
        285,
        31,
        bad ? themeColors.pink : themeColors.yellow,
      );
      trace.forEach((r, i) => {
        const xx = 150 + i * 430;
        drawCard(
          ctx,
          api,
          'program ' + i + '\n' + r.output + ' / k' + r.k,
          xx,
          400,
          390,
          155,
          i < count ? (bad && r.lost ? themeColors.pink : themeColors.cyan) : themeColors.muted,
          31,
        );
        if (i < count)
          drawCenteredText(
            ctx,
            api,
            '+' + r.value + ' → ' + r.sum,
            xx + 195,
            665,
            34,
            r.lost ? themeColors.pink : themeColors.green,
          );
      });
      if (bad)
        drawCenteredText(
          ctx,
          api,
          'Switching output discards the incomplete owned partial',
          960,
          850,
          33,
          themeColors.pink,
        );
      if (repaired)
        drawCenteredText(
          ctx,
          api,
          'Reduction last: complete Y00=3, then Y01=7',
          960,
          900,
          36,
          themeColors.green,
        );
    } else {
      drawCenteredText(
        ctx,
        api,
        'Mathematical shape and legal physical block differ',
        960,
        285,
        33,
        themeColors.yellow,
      );
      teaching.grid({
        x: 220,
        y: 400,
        width: 600,
        height: 420,
        rows: 4,
        columns: 4,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        highlights: [
          {
            row: 3,
            column: 0,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
          {
            row: 3,
            column: 1,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
          {
            row: 3,
            column: 2,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
          {
            row: 3,
            column: 3,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
        ],
      });
      drawCard(
        ctx,
        api,
        resultComplete('legal', 2)
          ? 'Mask padding or choose a legal block'
          : 'Backend shape constraints',
        1110,
        520,
        640,
        180,
        resultComplete('legal', 2) ? themeColors.green : themeColors.yellow,
        34,
      );
    }
    drawFooter(
      ctx,
      api,
      'TPU Pallas documented execution/lifetime contract; schematic local window, not an executed TPU kernel',
    );
  });
}
export default {
  id: 'pallas-contract',
  draw: drawPallasContract,
  cues: [
    'ag-pallas-contract-assembly',
    'ag-pallas-contract-block',
    'ag-pallas-contract-reuse',
    'ag-pallas-contract-output',
    'ag-pallas-contract-reduction',
    'ag-pallas-contract-legal',
  ],
};
