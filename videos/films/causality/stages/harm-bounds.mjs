import { responseTypePairing } from '../model.mjs';
import { code, detailText, focusProgress, footer, label } from '../defaults.mjs';
export function drawHarmBounds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-harm-bounds-mechanism', () => {
    const h = done('no-harm-assumption') ? 0 : Math.floor(22 * q('harm-endpoint')),
      f = responseTypePairing(h),
      entries = [
        ['always', themeColors.blue],
        ['helped', themeColors.green],
        ['harmed', themeColors.red],
        ['never', themeColors.muted],
      ],
      units = entries.flatMap(([type, color]) =>
        Array.from(
          {
            length: f.counts[type],
          },
          () => ({
            type,
            color,
          }),
        ),
      );
    units.forEach((u, i) =>
      api.rect(
        ctx,
        230 + (i % 10) * 39,
        355 + Math.floor(i / 10) * 39,
        31,
        31,
        u.color,
        undefined,
        3,
      ),
    );
    label(ctx, api, '100 hypothetical paired types', 425, 810, themeColors.muted, 28);
    code(ctx, api, 'h = ' + h, 425, 875, 36, themeColors.red, 'center');
    entries.forEach(([type, color], i) => {
      const yy = 340 + i * 125;
      detailText(ctx, api, type, 1050, yy + 45, 33, color);
      code(ctx, api, f.counts[type], 1610, yy + 45, 40, color, 'right');
    });
    label(
      ctx,
      api,
      'Assistant successes: ' + f.assistantSuccess + ' / 100',
      1250,
      865,
      themeColors.cyan,
      30,
    );
    label(
      ctx,
      api,
      'Control successes: ' + f.controlSuccess + ' / 100',
      1250,
      925,
      themeColors.pink,
      30,
    );
    footer(
      ctx,
      api,
      'The same two margins allow different pairings; the grid is hypothetical, not observed ticket pairs.',
    );
  });
}
export default {
  id: 'harm-bounds',
  draw: drawHarmBounds,
  cues: [
    'cau-harm-bounds-0',
    'cau-harm-bounds-1',
    'cau-harm-range',
    'cau-harm-endpoint',
    'cau-harm-bounds-2',
    'cau-no-harm-assumption',
  ],
};
