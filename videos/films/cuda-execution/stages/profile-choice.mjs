import { directed } from '../construction.mjs';
import { memoryRequests } from '../arithmetic.mjs';
import { tokenValues } from '../fixtures.mjs';
import {
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
  drawAddedTokenRowMini,
} from '../defaults.mjs';
export function drawProfileChoice(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('profile-choice-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'One batch from preparation to the end of its kernel',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const x = (t) => 420 + t * 75;
      drawAddedText(ctx, api, 'CPU prepare', 160, 465, 29, themeColors.blue);
      drawAddedLine(ctx, api, x(0), 450, x(6), 450, themeColors.blue, 28);
      drawAddedText(ctx, api, 'GPU copy', 160, 635, 29, themeColors.cyan);
      drawAddedLine(ctx, api, x(6), 620, x(9), 620, themeColors.cyan, 28);
      drawAddedText(ctx, api, 'GPU kernel', 160, 805, 29, themeColors.yellow);
      drawAddedLine(ctx, api, x(9), 790, x(16), 790, themeColors.yellow, 28);
      for (let i = 0; i <= 16; i += 4)
        drawAddedText(ctx, api, i, x(i), 910, 25, themeColors.muted, 'center');
      if (drawAddedP(ctx, api, 'profile-kernel') > 0) {
        api.rect(ctx, x(9) - 20, 735, x(16) - x(9) + 40, 110, 'transparent', themeColors.yellow, 3);
        drawAddedText(
          ctx,
          api,
          'inspect instructions / traffic / stalls',
          1180,
          960,
          27,
          themeColors.yellow,
          'center',
        );
      }
      drawAddedNote(
        ctx,
        api,
        'Authored timeline units; Systems supplies step scope and Compute supplies kernel scope.',
      );
    } else if (currentBeat === 1) {
      drawAddedText(
        ctx,
        api,
        'Every load is in bounds. What did the kernel return?',
        160,
        285,
        32,
        themeColors.cyan,
      );
      drawAddedTokenRowMini(ctx, api, tokenValues, 410);
      const p = drawAddedP(ctx, api, 'profile-correctness');
      drawAddedText(ctx, api, 'Valid-index accesses in this model', 210, 650, 31, themeColors.blue);
      drawAddedText(ctx, api, 'trusted sum: 21', 210, 780, 40, themeColors.cyan);
      if (p > 0) {
        drawAddedText(ctx, api, 'illustrative wrong sum: 22', 1050, 780, 40, themeColors.pink);
        drawAddedText(
          ctx,
          api,
          'Bounds alone do not find the extra +1',
          960,
          930,
          34,
          themeColors.yellow,
          'center',
        );
      }
      drawAddedNote(
        ctx,
        api,
        'Compare the returned value with a trusted implementation.',
      );
    } else {
      const { C, focus } = api;
      const packed = directed(state, 'profile-one-variable', 2);
      const trace = directed(state, 'profile-segment-count', 3);
      const wide = memoryRequests(32), tight = memoryRequests(1);
      const left = 338, step = 179, boxWidth = 162;
      const center = lane => left + step * lane + boxWidth / 2;
      drawAddedText(ctx, api, 'One warp load   /   32-byte aligned base', 160, 270, 36, C.ink);
      drawAddedText(ctx, api, 'Lane', 150, 371, 29, C.muted);
      drawAddedText(ctx, api, 'Value', 150, 435, 32, C.ink);
      tokenValues.forEach((value, lane) => {
        drawAddedText(ctx, api, lane, center(lane), 371, 29, C.muted, 'center', true);
        drawAddedText(ctx, api, value, center(lane), 437, 42, C.ink, 'center', true);
      });
      drawAddedText(ctx, api, 'Strided', 150, 566, 32, C.blue);
      wide.rows.forEach(row => {
        const x = left + row.lane * step;
        api.rect(ctx, x, 498, boxWidth, 116, C.panel, C.blue, 2);
        drawAddedText(ctx, api, row.address + ' B', center(row.lane), 548, 31, C.ink, 'center', true);
        drawAddedText(ctx, api, 'seg ' + row.segment, center(row.lane), 592, 27, C.blue, 'center', true);
      });
      focus.target('profile-packed', () => {
        drawAddedText(ctx, api, 'Packed', 150, 750, 32, C.cyan);
        tight.rows.forEach(row => {
          const placed = packed * 8 >= row.lane + 1;
          drawAddedText(ctx, api, placed ? row.address + ' B' : '·', center(row.lane),
            750, 31, placed ? C.ink : C.muted, 'center', true);
        });
        if (trace > 0) {
          const end = left + step * 7 + boxWidth;
          api.line(ctx, left, 779, left, 806, C.cyan, 4);
          api.line(ctx, left, 806, left + (end - left) * trace, 806, C.cyan, 4);
          if (trace === 1) {
            api.line(ctx, end, 779, end, 806, C.cyan, 4);
            drawAddedText(ctx, api, 'segment 0', (left + end) / 2, 855, 31, C.cyan, 'center');
          }
        }
      });
      focus.target('profile-footprint', () => {
        drawAddedText(ctx, api, 'Segment footprint     ' + wide.footprint + ' B → ' +
          (trace === 1 ? tight.footprint + ' B' : '?'), 960, 962, 41, C.ink, 'center');
      });
    }
  });
}
export default {
  id: 'profile-choice',
  draw: drawProfileChoice,
  cues: ['profile-kernel', 'profile-correctness', 'profile-one-variable', 'profile-segment-count'],
};
