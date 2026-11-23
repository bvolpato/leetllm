import { accEvent } from '../construction.mjs';
import {
  drawArrow,
  drawCard,
  drawCenteredText,
  drawFooter,
  drawPanel,
  drawText,
} from '../defaults.mjs';
export function drawMemoryOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('memory-owners-mechanism', () => {
    if (currentBeat === 0) {
      drawPanel(ctx, api, 108, 289, 1704, 584, themeColors.muted);
      drawText(ctx, api, 'One GPU', 145, 357, 40, themeColors.ink);
      drawPanel(ctx, api, 146, 441, 318, 329, themeColors.blue);
      drawCenteredText(ctx, api, 'Device memory', 305, 513, 32, themeColors.blue);
      drawPanel(ctx, api, 497, 441, 318, 329, themeColors.cyan);
      drawCenteredText(ctx, api, 'GPU-wide L2', 656, 513, 32, themeColors.cyan);
      drawPanel(ctx, api, 855, 386, 910, 437, themeColors.yellow);
      drawText(ctx, api, 'One streaming multiprocessor', 890, 450, 34, themeColors.yellow);
      drawPanel(ctx, api, 892, 505, 395, 257, themeColors.green);
      drawCenteredText(ctx, api, 'Block shared memory', 1089, 571, 29, themeColors.green);
      drawPanel(ctx, api, 1315, 505, 404, 257, themeColors.blue);
      drawCenteredText(ctx, api, 'Thread registers', 1517, 571, 29, themeColors.blue);
      const load = ev('owners', 0) * 2;
      const threadLoad = ev('thread', 0);
      const copies = [
        { label: 'W tile', center: 305, arrival: 1, passedOn: load > 0 },
        { label: 'W tile', center: 656, arrival: Math.min(load, 1), passedOn: load > 1 },
        { label: 'W tile', center: 1089, arrival: load - 1, passedOn: threadLoad > 0 },
        { label: 'Operand', center: 1517, arrival: threadLoad, passedOn: false },
      ];
      for (const { label, center, arrival, passedOn } of copies) {
        if (arrival <= 0) continue;
        const x = center - 95 - 40 * (1 - arrival);
        const color = passedOn ? themeColors.muted : themeColors.pink;
        ctx.save();
        ctx.globalAlpha *= Math.min(1, 3 * arrival);
        drawCard(ctx, api, label, x, 628, 190, 81, color, 35);
        ctx.restore();
      }
    } else if (currentBeat === 1) {
      drawCenteredText(
        ctx,
        api,
        'Dated H100 reference · retain the execution owner',
        960,
        285,
        33,
        themeColors.yellow,
      );
      const rows = [
        [
          'SM registers',
          '64K × 32-bit = 256 KiB',
          resultComplete('registers', 1),
          themeColors.blue,
        ],
        ['SM shared memory', '228 KB per SM', B('shared', 1), themeColors.cyan],
        [
          'One block shared',
          'at most 227 KB · opt in',
          resultComplete('shared', 1),
          themeColors.green,
        ],
        ['Device L2 cache', '50 MB GPU-wide', resultComplete('l2', 1), themeColors.pink],
      ];
      rows.forEach(([owner, value, show, col], i) => {
        const y = 370 + i * 140;
        drawCard(ctx, api, owner, 130, y, 600, 100, col, 31);
        drawArrow(ctx, api, 760, y + 50, 1060, y + 50, col);
        drawCard(
          ctx,
          api,
          show ? value : 'Value held',
          1100,
          y,
          690,
          100,
          show ? col : themeColors.muted,
          31,
        );
      });
    } else {
      drawCenteredText(
        ctx,
        api,
        'Separate full-model transfer exercise',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawCard(ctx, api, '16 decimal GB of weights', 190, 430, 1500, 140, themeColors.yellow, 40);
      if (B('paths', 2)) {
        drawCard(ctx, api, 'Resident path\n3.35 TB/s', 160, 700, 680, 175, themeColors.cyan, 37);
        drawCard(ctx, api, 'Host path\n64 GB/s', 1080, 700, 680, 175, themeColors.pink, 37);
      }
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'One possible staged load. An access can skip cache tiers.'
        : 'Capacity belongs to the resource that holds the allocation.',
    );
  });
}
export default {
  id: 'memory-owners',
  draw: drawMemoryOwners,
  cues: [
    'ag-memory-owners-owners',
    'ag-memory-owners-thread',
    'ag-memory-owners-registers',
    'ag-memory-owners-shared',
    'ag-memory-owners-l2',
    'ag-memory-owners-paths',
  ],
};
