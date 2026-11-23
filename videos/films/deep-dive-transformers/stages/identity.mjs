import { sampleModel } from '../model.mjs';
import { originalCard, originalGrid, originalText, originalTransfer } from '../defaults.mjs';
export function drawIdentity(ctx, scene, state, api) {
  return api.focus.target('hf-identity-mechanism', () => {
    {
      sampleModel('identity', state);
    }
    const { C: themeColors } = api,
      modelState = sampleModel('identity', state),
      currentBeat = modelState.b;
    {
      const ref = api.focus.target('identity-main', () =>
          originalCard(
            ctx,
            api,
            'main → ' + modelState.revision,
            130,
            505,
            310,
            themeColors.yellow,
            90,
          ),
        ),
        r1 = api.focus.target('identity-snapshot-r1', () =>
          originalCard(ctx, api, 'Snapshot R1', 650, 340, 360, themeColors.blue, 90),
        ),
        weights = api.focus.target('identity-weight-blob', () =>
          originalCard(ctx, api, 'Shared weight W7', 1390, 470, 380, themeColors.green, 100),
        ),
        t3 = api.focus.target('identity-tokenizer-t3', () =>
          originalCard(ctx, api, 'Tokenizer T3', 1390, 245, 380, themeColors.blue, 90),
        );
      api.focus.target('identity-shared-weight-links', () =>
        originalTransfer(ctx, api, currentBeat, modelState, r1, weights, themeColors.green, 1),
      );
      api.focus.target('identity-tokenizer-t3', () =>
        originalTransfer(ctx, api, currentBeat, modelState, r1, t3, themeColors.blue, 1),
      );
      if (modelState.moved) {
        const r2 = api.focus.target('identity-snapshot-r2', () =>
          originalCard(ctx, api, 'Snapshot R2', 650, 695, 360, themeColors.pink, 90),
        );
        api.focus.target('identity-main', () =>
          originalTransfer(ctx, api, currentBeat, modelState, ref, r2, themeColors.yellow, 1),
        );
        api.focus.target('identity-shared-weight-links', () =>
          originalTransfer(ctx, api, currentBeat, modelState, r2, weights, themeColors.green, 1),
        );
        if (modelState.tokenizerChanged) {
          const t4 = api.focus.target('identity-tokenizer-t4', () =>
            originalCard(ctx, api, 'Tokenizer T4', 1390, 785, 380, themeColors.pink, 90),
          );
          api.focus.target('identity-tokenizer-t4', () =>
            originalTransfer(ctx, api, currentBeat, modelState, r2, t4, themeColors.pink, 1),
          );
        }
      } else
        api.focus.target('identity-main', () =>
          originalTransfer(ctx, api, currentBeat, modelState, ref, r1, themeColors.yellow, 1),
        );
      originalGrid(
        ctx,
        api,
        modelState.tokenizerChanged
          ? [
              ['T3', 'END', 'BEGIN', 'assistant'],
              ['T4', 'END', '—', '—'],
            ]
          : [['T3', 'END', 'BEGIN', 'assistant']],
        150,
        765,
        450,
        modelState.tokenizerChanged ? 140 : 70,
        themeColors.blue,
        20,
      );
      api.focus.target('identity-weight-copy-count', () =>
        originalText(
          ctx,
          api,
          'Physical W7 copies: ' + modelState.physicalWeightCopies,
          960,
          940,
          37,
          themeColors.green,
          'center',
        ),
      );
      originalText(
        ctx,
        api,
        'Immutable snapshots · shared content-addressed blobs',
        960,
        1020,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'identity',
  draw: drawIdentity,
  cues: [
    'identity-beat-1-focus-1',
    'identity-beat-1-focus-2',
    'hf-identity-0',
    'identity-beat-2-focus-1',
    'identity-tokenizer-change',
    'identity-beat-2-focus-2',
    'hf-identity-1',
    'identity-beat-3-focus-1',
    'identity-beat-3-focus-2',
    'hf-identity-2',
  ],
};
