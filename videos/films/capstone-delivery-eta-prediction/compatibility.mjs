import { sampleModel } from './construction.mjs';
import { retainedDrawCard, retainedDrawText } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('unknown', state);
  {
    const input = api.focus.target('source-snapshot', () =>
      retainedDrawCard(ctx, api, 'As-of source snapshot', 180, 450, 430, themeColors.blue),
    );
    const output = api.focus.target('prediction-output', () =>
      retainedDrawCard(ctx, api, 'ETA + warning proposal', 1180, 450, 540, themeColors.green),
    );
    teaching.transfer({
      source: {
        shape: input,
        opacity: 1,
      },
      target: {
        shape: output,
        opacity: 1,
      },
      color: themeColors.cyan,
      progress: modelState.p,
      particle: {
        radius: 9,
        fill: themeColors.yellow,
      },
    });
    api.focus.target('release-contract', () =>
      retainedDrawText(
        ctx,
        api,
        'Model artifact · input contract · threshold policy',
        960,
        850,
        32,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
