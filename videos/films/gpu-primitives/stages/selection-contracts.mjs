import { exclusive } from '../arithmetic.mjs';
import { ARTICLE_INPUT } from '../fixtures.mjs';
import { after, cue, number } from '../score-trace.mjs';
import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedFooter,
  drawExtendedLine,
  drawExtendedRow,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawSelectionContracts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = api.components.fade;
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress, a, z);
  };
  const started = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      const flags = ARTICLE_INPUT.map((v) => Number(v > 0));
      const destinations = exclusive(flags);
      const out = ARTICLE_INPUT.filter((v) => v > 0);
      const flagsReady = after(state, 'selection-flags', 0, 0.22);
      const addressed = after(state, 'selection-addresses', 0, 0.38);
      const writing = cue(state, 'selection-result', 0, 0.54, 0.65);
      const wrote = after(state, 'selection-result', 0, 0.65);
      const pack = cue(state, 'selection-pack', 0, 0.8, 0.94);
      const sx = (i) => 445 + 168 * i;
      const tx = (i) => 615 + 168 * i;
      const chosen = 2,
        slot = destinations[chosen];
      drawExtendedTarget(ctx, api, 'selection-scatter', () => {
        for (const [name, y] of [
          ['Play', 330],
          ['Keep flag', 465],
          ['Address', 600],
          ['Output', 900],
        ]) {
          drawExtendedText(ctx, api, name, 138, y + 49, 37, themeColors.ink, 'left');
        }
        ARTICLE_INPUT.forEach((value, i) => {
          const highlight = addressed && (i === 1 || i === chosen);
          const col = highlight
            ? i === chosen
              ? themeColors.yellow
              : themeColors.pink
            : themeColors.blue;
          drawExtendedBox(ctx, api, number(value), sx(i) - 65, 330, 130, 76, col, 41);
          drawExtendedBox(ctx, api, flagsReady ? flags[i] : '·', sx(i) - 65, 465, 130, 76, col, 41);
          drawExtendedBox(
            ctx,
            api,
            addressed ? destinations[i] : '·',
            sx(i) - 65,
            600,
            130,
            76,
            col,
            41,
          );
        });
        out.forEach((value, i) => {
          const visible = (wrote && i === slot) || (pack > 0 && (i + 1) / out.length <= pack);
          drawExtendedText(ctx, api, 'slot ' + i, tx(i), 866, 28, themeColors.muted);
          drawExtendedBox(
            ctx,
            api,
            visible ? value : '·',
            tx(i) - 65,
            900,
            130,
            76,
            i === slot && wrote ? themeColors.yellow : themeColors.green,
            41,
          );
        });
        if (writing > 0) {
          const label = writing >= 1 ? 'skip' : '×';
          drawExtendedText(ctx, api, label, sx(1), 750, 31, themeColors.pink);
          const x = sx(chosen) + writing * (tx(slot) - sx(chosen));
          const y = 700 + writing * 123;
          api.arrow(ctx, sx(chosen), 689, x, y, themeColors.yellow, 4);
          if (!wrote)
            drawExtendedText(
              ctx,
              api,
              number(ARTICLE_INPUT[chosen]),
              x + 40,
              y + 14,
              38,
              themeColors.yellow,
            );
        }
      });
    } else if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Half-open segment boundaries [0, 4, 4, 8]');
      drawExtendedTarget(ctx, api, 'selection-segments', () => {
        drawExtendedRow(ctx, api, ARTICLE_INPUT, 435, {
          x: 290,
        });
        api.rect(ctx, 275, 415, 680, 125, 'transparent', themeColors.blue, 6);
        api.rect(ctx, 965, 415, 705, 125, 'transparent', themeColors.cyan, 6);
        const show = started('selection-contracts-step-2', 0.25),
          empty = started('selection-empty', 0.55);
        drawExtendedBox(ctx, api, show ? 'Sum 7' : '…', 425, 710, 350, 100, themeColors.blue, 40);
        drawExtendedBox(
          ctx,
          api,
          empty ? 'Empty → 0' : '[4, 4)',
          800,
          710,
          320,
          100,
          themeColors.yellow,
          35,
        );
        drawExtendedBox(ctx, api, show ? 'Sum 4' : '…', 1200, 710, 350, 100, themeColors.cyan, 40);
        drawExtendedText(
          ctx,
          api,
          'The repeated boundary remains a real output group',
          960,
          955,
          33,
          themeColors.yellow,
        );
      });
    } else {
      const tie = started('selection-tie', 0.5),
        values = tie ? [6, -1, 6] : ARTICLE_INPUT;
      drawExtendedTitle(
        ctx,
        api,
        tie
          ? 'Separate tie fixture · lowest source index wins'
          : 'Arg maximum retains both value and source position',
      );
      drawExtendedTarget(ctx, api, 'selection-argmax', () => {
        drawExtendedRow(
          ctx,
          api,
          values,
          420,
          tie
            ? {
                x: 540,
                step: 360,
                w: 220,
                indices: true,
              }
            : {
                x: 290,
                indices: true,
              },
        );
        const ready = after(state, 'selection-max', 2, 0.3);
        const winner = after(state, 'selection-winner', 2, 0.8);
        drawExtendedBox(
          ctx,
          api,
          tie
            ? winner
              ? 'Value 6 · index 0'
              : 'Two sixes · winning index ?'
            : ready
              ? 'Value 6 · index 7'
              : 'Value + index …',
          590,
          720,
          740,
          115,
          themeColors.green,
          42,
        );
        drawExtendedText(
          ctx,
          api,
          'Reference policy rejects empty input, NaN and infinities',
          960,
          940,
          30,
          themeColors.muted,
        );
      });
    }
    if (currentBeat === 0)
      drawExtendedFooter(ctx, api, 'Each kept play writes into a separate output buffer.');
    return;
  }
  return;
}
export default {
  id: 'selection-contracts',
  draw: drawSelectionContracts,
  cues: [
    'selection-contracts-step-1',
    'selection-flags',
    'selection-addresses',
    'selection-result',
    'selection-pack',
    'selection-contracts-step-2',
    'selection-empty',
    'selection-contracts-step-3',
    'selection-max',
    'selection-tie',
    'selection-winner',
  ],
};
