import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { binaryInformationState } from '../model.mjs';
import { bar, chapterText, note } from '../defaults.mjs';
export function drawInformationLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-information-ledger-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-information-ledger-' + id),
    fmt = (v, n = 4) => Number(v.toFixed(n)).toString();
  {
    const a = currentBeat === 2 ? cueAmount(state, 'vae-information-ledger-uniform', q) : 0,
      info = binaryInformationState(a),
      size = 175,
      x = 250,
      y = 420;
    chapterText(
      ctx,
      api,
      'supplied binary joint p(input, code)',
      600,
      310,
      31,
      themeColors.ink,
      'center',
    );
    chapterText(ctx, api, 'code 0', x + size / 2, 375, 28, themeColors.cyan, 'center');
    chapterText(ctx, api, 'code 1', x + 1.5 * size, 375, 28, themeColors.pink, 'center');
    info.joint.forEach((row, i) => {
      chapterText(
        ctx,
        api,
        'input ' + i,
        x - 35,
        y + i * size + size / 2,
        29,
        themeColors.ink,
        'right',
      );
      row.forEach((v, j) => {
        api.rect(
          ctx,
          x + j * size,
          y + i * size,
          size - 8,
          size - 8,
          themeColors.panel,
          themeColors.muted,
          1,
          4,
        );
        if (v > 0)
          bar(
            ctx,
            api,
            x + j * size + 12,
            y + i * size + size - 25,
            (v / 0.5) * (size - 32),
            14,
            i === j ? themeColors.cyan : themeColors.yellow,
          );
        chapterText(
          ctx,
          api,
          fmt(v),
          x + j * size + size / 2,
          y + i * size + 80,
          35,
          themeColors.ink,
          'center',
        );
      });
    });
    chapterText(
      ctx,
      api,
      'aggregate code probabilities: [0.5, 0.5]',
      1340,
      430,
      31,
      themeColors.green,
      'center',
    );
    chapterText(ctx, api, 'aggregate KL = 0', 1340, 530, 37, themeColors.green, 'center');
    const show = currentBeat === 2 ? ready('noise') : currentBeat === 1 && ready('copy');
    chapterText(
      ctx,
      api,
      show ? 'mutual information = ' + fmt(info.mutualInformation, 6) : 'mutual information = ?',
      1340,
      680,
      34,
      themeColors.yellow,
      'center',
    );
    chapterText(
      ctx,
      api,
      show ? 'average posterior KL = ' + fmt(info.averageKL, 6) : 'average posterior KL = ?',
      1340,
      790,
      32,
      themeColors.cyan,
      'center',
    );
    note(
      ctx,
      api,
      currentBeat === 2
        ? 'Mass moves off the identity diagonal; the mixture stays uniform while input information vanishes.'
        : 'Copying input identity can match the aggregate prior while each conditional posterior remains informative.',
    );
  }
}
export default {
  id: 'information-ledger',
  draw: drawInformationLedger,
  cues: [
    'vae-information-ledger-0-build',
    'vae-information-ledger-1-build',
    'vae-information-ledger-copy',
    'vae-information-ledger-2-build',
    'vae-information-ledger-noise',
    'vae-information-ledger-uniform',
  ],
};
