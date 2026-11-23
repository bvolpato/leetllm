import { sampleModel } from '../construction.mjs';
import { allocationStrip, card, text } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('synthesis', state);
  {
    api.focus.target('synthesis-d1-approved-by-incident-lead', () =>
      card(ctx, api, 'D1 · approved by incident lead', 440, 350, 1040, themeColors.yellow, 110),
    );
    allocationStrip(ctx, api, 'synthesis', modelState.kept, 620);
    api.focus.target('synthesis-required-source-d1-retained-latest-exchange-intact-gen', () =>
      text(
        ctx,
        api,
        'Required source D1 retained · latest exchange intact · generation protected',
        960,
        955,
        29,
        themeColors.green,
        'center',
      ),
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'retained-fact',
    'protected-generation',
    'required-evidence',
    'paired-policy',
    'source-bound-note',
    'inspectable-request',
  ],
};
