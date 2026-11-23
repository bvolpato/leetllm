import { exactCue } from '../construction.mjs';
import { nestedState } from '../model.mjs';
import { arrow, box, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawNestedOwnership(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    modelState = nestedState(state),
    progress =
      currentBeat === 0
        ? exactCue(state, 'py-nested-rows')
        : currentBeat === 1
          ? exactCue(state, 'py-nested-tag')
          : modelState.appendToCopy || modelState.copyTags;
  pyMark(api, 'nested-ownership', () => {
    text(
      ctx,
      api,
      currentBeat === 2 ? 'Replay from empty tags' : 'Supplied row · baseline and trial',
      960,
      280,
      34,
      api.C.muted,
      'center',
    );
    const left = box(ctx, api, 230, 355, 600, 200, api.C.blue);
    text(ctx, api, 'baseline · row R1', 260, 415, 35, api.C.blue);
    const right = box(ctx, api, 1090, 355, 600, modelState.copied ? 200 : 100, api.C.cyan);
    text(
      ctx,
      api,
      modelState.copied ? 'trial · row R2' : 'trial → row R1',
      1120,
      415,
      35,
      api.C.cyan,
    );
    text(
      ctx,
      api,
      'prediction: "' + modelState.baseline.prediction + '"',
      260,
      525,
      31,
      api.C.blue,
      'left',
      true,
    );
    if (modelState.copied)
      text(
        ctx,
        api,
        'prediction: "' + modelState.trial.prediction + '"',
        1120,
        525,
        31,
        api.C.cyan,
        'left',
        true,
      );
    const tags1 = rail(
      ctx,
      api,
      400,
      720,
      650,
      'T1: ' + JSON.stringify(modelState.baseline.tags),
      api.C.blue,
      110,
      35,
    );
    const tags2 = modelState.isolatedTags
      ? rail(
          ctx,
          api,
          1210,
          720,
          500,
          'T2: ' + JSON.stringify(modelState.trial.tags),
          api.C.cyan,
          110,
          30,
        )
      : null;
    arrow(ctx, api, left, tags1, api.C.blue);
    arrow(ctx, api, right, modelState.copied ? (tags2 ?? tags1) : left, api.C.cyan);
    if (progress > 0 && progress < 1) {
      text(
        ctx,
        api,
        currentBeat === 1 || modelState.appendToCopy > 0
          ? 'append("review")'
          : currentBeat === 2
            ? 'trial["tags"] = trial["tags"].copy()'
            : 'copy row dictionary',
        960,
        320,
        30,
        api.C.yellow,
        'center',
        true,
      );
      stripe(ctx, api, 540, 335, 840, progress, api.C.yellow);
    }
    text(
      ctx,
      api,
      !modelState.copied
        ? 'Two names reach one row and its tags list.'
        : modelState.sameTags
          ? 'Both tags fields reach T1.'
          : 'The tags lists have distinct identity.',
      960,
      925,
      33,
      modelState.sameTags ? api.C.yellow : api.C.green,
      'center',
    );
  });
}
export default {
  id: 'nested-ownership',
  draw: drawNestedOwnership,
  cues: [
    'py-nested-ownership-0',
    'py-nested-rows',
    'py-nested-ownership-1',
    'py-nested-string',
    'py-nested-tag',
    'py-nested-ownership-2',
    'py-nested-repair',
    'replay-empty-tags',
  ],
};
