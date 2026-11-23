import { spoken } from '../arithmetic.mjs';
import { launchContract } from '../model.mjs';
import {
  drawProfileChapterCard,
  drawProfileChapterEquation,
  drawProfileChapterFooter,
  drawProfileChapterTable,
  drawProfileChapterText,
} from '../defaults.mjs';
export function drawReferenceCases(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    P = (cue, beat = currentBeat) => spoken(state, cue, beat);
  const num = (v) => v.toLocaleString('en-US');
  api.focus.target('reference-cases-mechanism', () => {
    const s = launchContract();
    if (currentBeat === 0) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Main n = 1,000,003 · 256 threads per block',
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      const cutoff = 1000003 % 256,
        reveal = P('rounded-launch', 0) > 0;
      for (let r = 0; r < 16; r++)
        for (let col = 0; col < 16; col++) {
          const i = r * 16 + col;
          api.rect(
            ctx,
            200 + col * 29,
            370 + r * 29,
            25,
            25,
            i < cutoff ? themeColors.blue : reveal ? themeColors.pink : themeColors.panel,
            themeColors.muted,
            1,
          );
        }
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Final block · indices 999,936…1,000,191',
        440,
        890,
        27,
        themeColors.muted,
        'center',
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Blocks', 'Launched positions'],
          [String(s.blocks), num(s.launched)],
          ['Valid in last block', 'Excluded in last block'],
          [String(cutoff), reveal ? String(s.excluded) : '?'],
        ],
        910,
        400,
        810,
        360,
        31,
      );
      drawProfileChapterEquation(ctx, api, themeColors, 'i<n', 1315, 880, 65, themeColors.green);
    } else if (currentBeat === 1) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'All logical outputs · irregular boundaries and independent seeds',
        960,
        285,
        33,
        themeColors.ink,
        'center',
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Lengths', 'Main large-input seeds'],
          ['0, 1, 255, 256, 257, 1,000,003', '7, 19, 101'],
        ],
        170,
        355,
        1580,
        180,
        30,
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Illustrative X = [1, 2, 3, 4, 5] · Z = [0, 1, 2, 3, 4]',
        960,
        590,
        27,
        themeColors.muted,
        'center',
      );
      const poison = P('poison-output', 1) > 0;
      Array.from({ length: 5 }, () => 'NaN').forEach((v, i) =>
        drawProfileChapterCard(
          ctx,
          api,
          themeColors,
          components,
          poison && i !== 2 ? String(1.25 * (i + 1) + i) : v,
          230 + i * 310,
          660,
          240,
          poison && i === 2 ? themeColors.pink : themeColors.blue,
          110,
          35,
        ),
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        poison
          ? 'Illustrative omitted store at position 2 leaves poison visible'
          : 'Poison every output before this illustrative five-element launch',
        960,
        890,
        29,
        poison ? themeColors.pink : themeColors.muted,
        'center',
      );
    } else {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'One float32 output · declared numerical contract',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawProfileChapterEquation(
        ctx,
        api,
        themeColors,
        String.raw`y_i=\operatorname{fmaf}(1.25,x_i,z_i)`,
        960,
        445,
        54,
      );
      api.arrow(ctx, 960, 505, 960, 620, themeColors.cyan, 5);
      drawProfileChapterCard(
        ctx,
        api,
        themeColors,
        components,
        P('reference-fma', 2) > 0 ? 'CPU double FMA → one float cast' : 'CPU reference operation',
        240,
        655,
        1440,
        themeColors.cyan,
        115,
        37,
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Reject nonfinite outputs · inspect every position · record max errors',
        960,
        900,
        30,
        themeColors.green,
        'center',
      );
    }
    drawProfileChapterFooter(
      ctx,
      api,
      themeColors,
      'This bounded reference and tolerance do not establish a bitwise oracle for every GPU computation',
    );
  });
}
export default {
  id: 'reference-cases',
  draw: drawReferenceCases,
  cues: ['rounded-launch', 'poison-output', 'reference-fma'],
};
