import { cell, cueProgress, evidenceReceipt, requestIdentity, text } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    requestIdentity(ctx, api);
    if (currentBeat < 3) {
      api.focus.target('independent-reads', () =>
        ['Eval', 'Health', 'Policy'].forEach((r, i) =>
          evidenceReceipt(ctx, api, r, 180 + i * 555, 410, 450),
        ),
      );
      api.focus.target('validated-state', () =>
        api.focus.target('exact-proposal', () =>
          text(
            ctx,
            api,
            'independent inputs → validated state → exact current proposal',
            960,
            740,
            35,
            themeColors.yellow,
            'center',
          ),
        ),
      );
      api.focus.target('guarded-writer', () =>
        text(
          ctx,
          api,
          'One effect owner rechecks policy and destination result',
          960,
          930,
          35,
          themeColors.green,
          'center',
        ),
      );
    } else {
      const reveal = cueProgress(ctx, api, 'fresh-revision-rejection', q(3, 0.32, 0.45)) >= 1,
        duplicateProgress = cueProgress(ctx, api, 'fresh-duplicate-input', q(3, 0.6, 0.7)),
        duplicate = duplicateProgress > 0,
        duplicateAnswer = cueProgress(ctx, api, 'fresh-duplicate-rejection', q(3, 0.7, 0.8)) >= 1;
      text(
        ctx,
        api,
        duplicate
          ? 'Changed batch: health returns twice'
          : 'New batch: each branch reports success',
        960,
        365,
        35,
        themeColors.yellow,
        'center',
      );
      ['Eval', 'Health', 'Policy'].forEach((r, i) =>
        evidenceReceipt(ctx, api, r, 180 + i * 555, 470, 450, !duplicate && i === 1 ? 4 : 3),
      );
      if (duplicate)
        cell(
          ctx,
          api,
          'Health · r17/v3 · duplicate identity',
          680,
          620 + 100 * duplicateProgress,
          560,
          themeColors.pink,
        );
      const resultComplete = duplicate ? duplicateAnswer : reveal;
      text(
        ctx,
        api,
        duplicate
          ? duplicateAnswer
            ? 'REJECT duplicate branch; do not count it as extra evidence'
            : 'Inspect the repeated Health identity before joining'
          : reveal
            ? 'REJECT mixed revisions; refresh health and revalidate freshness'
            : 'Predict: can this successful batch form one proposal?',
        960,
        925,
        32,
        resultComplete ? themeColors.pink : themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Writer unchanged until a valid current packet and required review exist',
        960,
        1030,
        31,
        themeColors.green,
        'center',
      );
    }
  };
  api.focus.target('transfer-construction', body);
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'stable-inputs',
    'validation-result',
    'transfer-construct-0',
    'branch-contract',
    'effect-boundary',
    'transfer-construct-1',
    'receipt-identity',
    'recovery-meaning',
    'transfer-construct-2',
    'transfer-construct-3',
    'fresh-revision-rejection',
    'fresh-duplicate-rejection',
    'fresh-duplicate-input',
  ],
};
