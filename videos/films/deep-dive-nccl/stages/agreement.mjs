import { done, sampleModel } from '../construction.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawAgreement(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors, focus: f } = api,
      modelState = sampleModel('agreement', state),
      currentBeat = modelState.b;
    {
      const repaired = currentBeat === 2 && f.progress('agreement-repair', modelState.q) >= 0.65,
        mismatch = currentBeat === 1 || (currentBeat === 2 && !repaired),
        diagnosed = currentBeat === 1 && done(state, 'agreement', 1, 0),
        agreed = currentBeat === 0 || (currentBeat === 2 && done(state, 'agreement', 2, 0));
      originalText(
        ctx,
        api,
        'Communicator C0 · ordered call receipts',
        960,
        285,
        39,
        themeColors.yellow,
        'center',
      );
      for (let rank = 0; rank < 4; rank++) {
        originalText(ctx, api, 'Rank ' + rank, 160, 432 + rank * 125, 30, themeColors.blue);
        f.target('agreement-contract-' + rank, () =>
          originalCard(
            ctx,
            api,
            'seq 0 · All-reduce · count 4 · float32',
            370,
            365 + rank * 125,
            700,
            themeColors.blue,
            90,
          ),
        );
        if (currentBeat > 0)
          f.target('agreement-next-' + rank, () =>
            originalCard(
              ctx,
              api,
              'seq 1 · ' + (rank === 2 && mismatch ? 'Broadcast' : 'All-gather'),
              1140,
              365 + rank * 125,
              610,
              rank === 2 && mismatch
                ? diagnosed || currentBeat === 2
                  ? themeColors.pink
                  : themeColors.yellow
                : themeColors.cyan,
              90,
            ),
          );
      }
      f.target('agreement-verdict', () =>
        originalText(
          ctx,
          api,
          agreed
            ? 'Compatible ordered calls'
            : diagnosed
              ? 'C0 / seq 1: rank 2 diverges'
              : currentBeat === 2
                ? 'Repair in progress · agreement pending'
                : 'Comparing sequence 1 · diagnosis pending',
          960,
          960,
          37,
          agreed ? themeColors.green : diagnosed ? themeColors.pink : themeColors.yellow,
          'center',
        ),
      );
    }
  });
}
export default {
  id: 'agreement',
  draw: drawAgreement,
  cues: [
    'agreement-communicator',
    'agreement-ordered',
    'nc-agreement-b0-s0',
    'nc-agreement-b0-s1',
    'nc-agreement-b0-s2',
    'nc-agreement-b0-s3',
    'agreement-mismatch',
    'agreement-compare',
    'nc-agreement-b1-s0',
    'nc-agreement-b1-s1',
    'nc-agreement-b1-s2',
    'nc-agreement-b1-s3',
    'agreement-repair',
    'agreement-agreed',
    'nc-agreement-b2-s0',
    'nc-agreement-b2-s1',
    'nc-agreement-b2-s2',
  ],
};
