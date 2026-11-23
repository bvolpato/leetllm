import { pairs, xs } from '../fixtures.mjs';
import { scanSnapshot } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawScan(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0);
  {
    const scan = scanSnapshot(currentBeat, progress2, state.cues);
    const columns = [345, 755, 1165, 1575],
      rowY = [355, 565, 775];
    const number = (value) => String(Number(value.toFixed(4)));
    const tuple = (pair) => `(${number(pair[0])}, ${number(pair[1])})`;
    const fading = (alpha, paint) => {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      paint();
      ctx.restore();
    };
    const cell = (row, index, alpha, color) =>
      fading(alpha, () => {
        const first = Math.max(0, index - 2 ** row + 1);
        const range = first === index ? `t${index + 1}` : `t${first + 1}…t${index + 1}`;
        api.focus.target(row === 0 ? 'affine-input-pairs' : 'composed-affine-pairs', () => {
          api.rect(ctx, columns[index] - 150, rowY[row], 300, 90, themeColors.panel, color, 10);
          if (row)
            text(ctx, api, range, columns[index], rowY[row] + 29, 26, themeColors.muted, 'center');
          text(
            ctx,
            api,
            tuple(scan.levels[row][index]),
            columns[index],
            rowY[row] + (row ? 68 : 58),
            32,
            color,
            'center',
          );
        });
      });
    const connection = (fromRow, source, target, progress, color) => {
      if (progress <= 0) return;
      const x1 = columns[source],
        y1 = rowY[fromRow] + 100;
      const x2 = columns[target],
        y2 = rowY[fromRow + 1] - 12;
      api.arrow(
        ctx,
        x1,
        y1,
        api.lerp(x1, x2, Math.min(1, progress * 1.4)),
        api.lerp(y1, y2, Math.min(1, progress * 1.4)),
        color,
        3,
      );
    };
    api.focus.target('scan-ordered-affine-pairs-carry-write', () =>
      text(ctx, api, 'Affine updates (carry, write)', 960, 270, 38, themeColors.muted, 'center'),
    );
    xs.forEach((x, i) =>
      api.focus.target('scan-readout', () =>
        text(ctx, api, `t${i + 1} · x = ${x}`, columns[i], 325, 28, themeColors.blue, 'center'),
      ),
    );
    for (let i = 0; i < pairs.length; i++) cell(0, i, 1, themeColors.blue);
    if (scan.pairProgress > 0 || scan.neighborProgress > 0) {
      text(ctx, api, '1 apart', 95, 610, 27, themeColors.muted, 'center');
      api.focus.target('composed-affine-pairs', () => {
        for (let i = 0; i < pairs.length; i++) {
          const progress =
            i === 1 ? Math.max(scan.pairProgress, scan.neighborProgress) : scan.neighborProgress;
          connection(0, i, i, progress, themeColors.muted);
          if (i > 0) connection(0, i - 1, i, progress, themeColors.yellow);
          cell(1, i, Math.max(0, (progress - 0.5) * 2), i ? themeColors.yellow : themeColors.muted);
        }
      });
    }
    if (scan.prefixProgress > 0) {
      text(ctx, api, '2 apart', 95, 820, 27, themeColors.muted, 'center');
      api.focus.target('scan-readout-2', () => {
        for (let i = 0; i < pairs.length; i++) {
          connection(1, i, i, scan.prefixProgress, themeColors.muted);
          if (i >= 2) connection(1, i - 2, i, scan.prefixProgress, themeColors.green);
          cell(2, i, Math.max(0, (scan.prefixProgress - 0.5) * 2), themeColors.green);
        }
        fading(Math.max(0, (scan.prefixProgress - 0.75) * 4), () => {
          scan.prefixes.forEach((pair, i) =>
            api.focus.target(`scan-prefix-state-${i + 1}`, () =>
              text(
                ctx,
                api,
                `h${i + 1} = ${pair[1].toFixed(4)}`,
                columns[i],
                935,
                35,
                themeColors.green,
                'center',
              ),
            ),
          );
        });
      });
    } else if (scan.pairProgress > 0) {
      fading(scan.pairProgress, () =>
        api.focus.target('scan-readout-2', () =>
          equation(
            ctx,
            api,
            String.raw`0.9(0.9h+0.6)+0.2=0.81h+0.74`,
            960,
            900,
            44,
            themeColors.ink,
            'center',
          ),
        ),
      );
    }
    text(
      ctx,
      api,
      scan.prefixProgress === 1
        ? 'All four prefixes · same zero initial state'
        : scan.prefixProgress > 0
          ? 'Recover each prefix without changing token order'
          : 'Each column keeps its input position',
      960,
      995,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'scan',
  draw: drawScan,
  cues: [
    'affine-updates',
    'compose-two',
    'ordered-tree',
    'all-prefix-states',
    'fused-scan',
    'scan-reference',
  ],
};
