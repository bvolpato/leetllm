import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawOverflow(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('overflow', state),
    currentBeat = modelState.step;
  {
    api.focus.target('overflow-required-input-26-units-output-reserve-8-window-32', () =>
      text(
        ctx,
        api,
        'Required input 26 units · output reserve 8 · window 32',
        140,
        270,
        31,
        themeColors.muted,
      ),
    );
    api.focus.target('overflow-required-instructions-14-units', () =>
      card(ctx, api, 'Required instructions\n14 units', 170, 390, 680, themeColors.blue, 130),
    );
    api.focus.target('overflow-current-question-12-units', () =>
      card(ctx, api, 'Current question\n12 units', 1070, 390, 680, themeColors.cyan, 130),
    );
    api.focus.target('overflow-equation', () => {
      const shown = currentBeat === 0 ? 26 + 8 * modelState.p : 34;
      for (let i = 0; i < 34; i++)
        api.rect(
          ctx,
          170 + i * 45,
          600,
          41,
          55,
          i < shown ? (i < 26 ? themeColors.blue : themeColors.pink) : themeColors.panel,
          themeColors.muted,
          1,
        );
      api.line(ctx, 170 + 32 * 45, 570, 170 + 32 * 45, 680, themeColors.pink, 4);
      text(ctx, api, '32-unit boundary', 1530, 725, 26, themeColors.pink, 'center');
      api.math(ctx, String.raw`26+8=34>32`, 740, 740, 50, themeColors.pink, 'center');
    });
    api.focus.target('overflow-readout', () =>
      card(ctx, api, modelState.error, 250, 820, 1420, themeColors.pink, 95),
    );
    api.focus.target('overflow-preserve-the-required-packets-revise-or-split-the-reque', () =>
      text(
        ctx,
        api,
        'Preserve the required packets · revise or split the request',
        960,
        975,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'overflow',
  draw: drawOverflow,
  cues: [
    'mandatory-input',
    'overflow-total',
    'explicit-rejection',
    'preserved-required',
    'configured-cap',
    'execution-limits',
  ],
};
