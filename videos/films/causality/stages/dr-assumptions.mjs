import { box, code, focusProgress, footer, label, line } from '../defaults.mjs';
export function drawDrAssumptions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-dr-assumptions-mechanism', () => {
    const zero = done('dr-zero-factor'),
      px = 450,
      py = 700,
      w = 620,
      h = 170 * (1 - q('dr-zero-factor'));
    line(ctx, api, px, py, 1600, py, themeColors.muted, 3);
    line(ctx, api, px, py, px, currentBeat >= 1 ? 570 : 350, themeColors.muted, 3);
    if (h > 0) api.rect(ctx, px, py - h, w, h, themeColors.panel, themeColors.pink, 7);
    code(ctx, api, 'reward prediction error', 1050, 790, 32, themeColors.blue, 'center');
    code(ctx, api, '1 − true e / estimated e', 960, 310, 32, themeColors.yellow, 'center');
    label(
      ctx,
      api,
      zero ? 'One factor 0 → bias term 0' : 'Both error factors can contribute',
      960,
      890,
      zero ? themeColors.green : themeColors.pink,
      35,
    );
    if (currentBeat >= 1) {
      box(
        ctx,
        api,
        'Fit / nuisance rows',
        ['separate from evaluation outcomes'],
        180,
        380,
        620,
        155,
        themeColors.blue,
      );
      box(
        ctx,
        api,
        'Held-out evaluation',
        ['freeze target policy first'],
        1070,
        380,
        670,
        155,
        themeColors.yellow,
      );
    }
    footer(
      ctx,
      api,
      'This product argument concerns supported actions and fixed nuisances; hidden confounding remains separate.',
    );
  });
}
export default {
  id: 'dr-assumptions',
  draw: drawDrAssumptions,
  cues: [
    'cau-dr-assumptions-0',
    'cau-dr-zero-factor',
    'cau-dr-assumptions-1',
    'cau-dr-assumptions-2',
  ],
};
