import { sampleModel } from '../construction.mjs';
import { CANDIDATE } from '../model.mjs';
import { legacyText, releaseBundle } from '../defaults.mjs';
export function drawIdentity(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('identity', state),
    currentBeat = modelState.beat;
  if (state.cues) {
    Object.assign(
      modelState,
      sampleModel('identity', {
        ...state,
        beatP: api.focus.visible('edit-prompt') ? 1 : 0,
      }),
    );
  }
  {
    legacyText(
      ctx,
      api,
      'Actual retained prompt bytes',
      520,
      315,
      34,
      themeColors.yellow,
      'center',
    );
    const lines = modelState.edited
      ? ['Check every claim and withhold', 'unsupported approval.']
      : ['Check each claim against the admitted', 'record before serving.'];
    const prompt = api.focus.target('prompt-bytes', () =>
      components.panel(
        {
          x: 140,
          y: 375,
          width: 790,
          height: 220,
          fill: themeColors.panel,
          stroke: modelState.edited ? themeColors.yellow : themeColors.blue,
          padding: 25,
        },
        () => {
          lines.forEach((line, i) =>
            legacyText(ctx, api, line, 535, 455 + i * 60, 31, themeColors.ink, 'center'),
          );
        },
      ),
    );
    legacyText(ctx, api, 'SHA-256 of these bytes', 535, 685, 29, themeColors.muted, 'center');
    api.focus.target('prompt-digest', () =>
      legacyText(
        ctx,
        api,
        modelState.candidate.prompt.slice(0, 24),
        535,
        750,
        31,
        modelState.edited ? themeColors.yellow : themeColors.cyan,
        'center',
      ),
    );
    const release = releaseBundle(
      ctx,
      api,
      modelState.candidate,
      modelState.edited ? 'CORRECTED bundle' : 'CANDIDATE bundle',
      1130,
      375,
      650,
      modelState.edited ? themeColors.yellow : themeColors.cyan,
    );
    api.connect(ctx, prompt, release, {
      color: modelState.edited ? themeColors.yellow : themeColors.cyan,
      gap: 20,
    });
    legacyText(
      ctx,
      api,
      modelState.edited
        ? 'Prompt pin and whole-release digest change together'
        : 'Model, policy and evaluation pins remain attached',
      960,
      915,
      34,
      modelState.edited ? themeColors.yellow : themeColors.blue,
      'center',
    );
    legacyText(
      ctx,
      api,
      modelState.edited
        ? 'Separate variant · rollout keeps original candidate ' + CANDIDATE.slice(0, 12)
        : 'Retain the bytes that each component digest identifies',
      960,
      1010,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'identity',
  draw: drawIdentity,
  cues: ['component-bytes', 'hash-bundle', 'edit-prompt', 'restore-bytes'],
};
