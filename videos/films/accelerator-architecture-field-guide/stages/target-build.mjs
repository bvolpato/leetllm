import { accEvent } from '../construction.mjs';
import { drawCard, drawCenteredText, drawLine } from '../defaults.mjs';
export function drawTargetBuild(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('target-build-mechanism', () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Documented CDNA target · wave64 ownership',
        960,
        285,
        34,
        themeColors.yellow,
      );
      teaching.grid({
        x: 150,
        y: 390,
        width: 1620,
        height: 300,
        rows: 4,
        columns: 16,
        labels: Array.from(
          {
            length: 4,
          },
          (_, r) =>
            Array.from(
              {
                length: 16,
              },
              (_, i) => r * 16 + i + 1,
            ),
        ),
        fill: themeColors.panel,
        stroke: themeColors.blue,
        fontSize: 27,
      });
      if (B('contract', 0))
        drawCenteredText(
          ctx,
          api,
          'Check that the primitive combines all 64 lanes',
          960,
          850,
          35,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      drawCenteredText(ctx, api, 'ROCm 7.14 build targets', 960, 285, 35, themeColors.yellow);
      drawCard(ctx, api, 'MI300 series\ngfx942 · CDNA3', 170, 390, 690, 240, themeColors.blue, 38);
      drawCard(ctx, api, 'MI350 series\ngfx950 · CDNA4', 1060, 390, 690, 240, themeColors.cyan, 38);
      if (resultComplete('targets', 1))
        drawCenteredText(
          ctx,
          api,
          'Save the target and toolchain versions with the test result.',
          960,
          850,
          33,
          themeColors.yellow,
        );
    } else {
      const group = [0, 2, 4, 6],
        selected = group.slice(0, Math.ceil(group.length * ev('subset', 2))),
        nodes = Array.from(
          {
            length: 8,
          },
          (_, i) => ({
            id: i,
            x: 960 + 340 * Math.cos(-Math.PI / 2 + (i * Math.PI) / 4),
            y: 615 + 260 * Math.sin(-Math.PI / 2 + (i * Math.PI) / 4),
          }),
        );
      nodes.forEach((a, i) =>
        nodes.slice(i + 1).forEach((z) => {
          const active = selected.includes(a.id) && selected.includes(z.id);
          const dx = z.x - a.x,
            dy = z.y - a.y,
            len = Math.hypot(dx, dy),
            clearance = 50;
          drawLine(
            ctx,
            api,
            a.x + (dx / len) * clearance,
            a.y + (dy / len) * clearance,
            z.x - (dx / len) * clearance,
            z.y - (dy / len) * clearance,
            active ? themeColors.cyan : themeColors.muted,
            active ? 4 : 1,
          );
        }),
      );
      nodes.forEach((n) => {
        api.circle(
          ctx,
          n.x,
          n.y,
          42,
          selected.includes(n.id) ? themeColors.cyan : themeColors.blue,
        );
        drawCenteredText(ctx, api, 'R' + n.id, n.x, n.y + 10, 27, themeColors.bg);
      });
      drawCenteredText(
        ctx,
        api,
        'MI300X   ·   One rank per GPU   ·   Dedicated Infinity Fabric links',
        960,
        285,
        30,
        themeColors.yellow,
      );
      drawCenteredText(
        ctx,
        api,
        selected.length === group.length
          ? 'R0, R2, R4, R6   ·   ' +
              (group.length * (group.length - 1)) / 2 +
              ' pairs in this group'
          : 'Choose four GPUs for the collective.',
        960,
        985,
        36,
        themeColors.ink,
      );
    }
  });
}
export default {
  id: 'target-build',
  draw: drawTargetBuild,
  cues: [
    'ag-target-build-wave',
    'ag-target-build-contract',
    'ag-target-build-targets',
    'ag-target-build-pairs',
    'ag-target-build-subset',
  ],
};
