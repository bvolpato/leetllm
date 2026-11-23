import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { lv, mu } from '../fixtures.mjs';
import { bar, chapterEquation, chapterText, line, note } from '../defaults.mjs';
export function drawKlLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-kl-ledger-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-kl-ledger-' + id),
    fmt = (v, n = 4) => Number(v.toFixed(n)).toString();
  {
    const contributions = mu.map((m, i) => 0.5 * (m * m + Math.expm1(lv[i]) - lv[i]));
    chapterEquation(
      ctx,
      api,
      '\\tfrac12(\\mu_j^2+e^{\\ell_j}-1-\\ell_j)',
      960,
      310,
      47,
      themeColors.ink,
      'center',
    );
    chapterText(ctx, api, 'squared mean', 630, 365, 27, themeColors.cyan, 'center');
    chapterText(ctx, api, 'variance − 1', 930, 365, 27, themeColors.green, 'center');
    chapterText(ctx, api, '− log variance', 1230, 365, 27, themeColors.yellow, 'center');
    for (let i = 0; i < 2; i++) {
      const y = 465 + i * 185,
        terms = [mu[i] ** 2, Math.expm1(lv[i]), -lv[i]],
        colors = [themeColors.cyan, themeColors.green, themeColors.yellow];
      chapterText(ctx, api, 'coordinate ' + (i + 1), 190, y, 29, themeColors.ink);
      terms.forEach((v, j) => {
        const a = currentBeat === 0 ? clamped(q * 3 - j) : 1,
          current = v * a,
          cx = 630 + j * 300,
          width = Math.abs(current) * 220;
        line(ctx, api, cx, y - 55, cx, y + 10, themeColors.muted, 1);
        bar(ctx, api, current < 0 ? cx - width : cx, y - 40, width, 40, colors[j]);
        chapterText(
          ctx,
          api,
          (current >= 0 ? '+' : '−') + fmt(Math.abs(current)),
          cx,
          y + 65,
          29,
          colors[j],
          'center',
        );
      });
      chapterText(
        ctx,
        api,
        currentBeat === 0
          ? '× ½'
          : ready('sum') || currentBeat === 2
            ? '→ ' + fmt(contributions[i], 8)
            : '→ ?',
        1620,
        y,
        31,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat < 2)
      chapterText(
        ctx,
        api,
        ready('sum')
          ? 'sum = 0.20087811 nats per example'
          : 'sum coordinates, then average examples',
        960,
        870,
        34,
        themeColors.ink,
        'center',
      );
    else {
      chapterEquation(
        ctx,
        api,
        '\\partial_{\\mu_j}D=\\mu_j',
        580,
        850,
        40,
        themeColors.cyan,
        'center',
      );
      chapterEquation(
        ctx,
        api,
        '\\partial_{\\ell_j}D=\\tfrac12(e^{\\ell_j}-1)',
        1320,
        850,
        40,
        themeColors.yellow,
        'center',
      );
    }
    note(
      ctx,
      api,
      'Signed terms combine into a nonnegative divergence · expm1(ℓ) − ℓ improves small-ℓ cancellation.',
    );
  }
}
export default {
  id: 'kl-ledger',
  draw: drawKlLedger,
  cues: [
    'vae-kl-ledger-0-build',
    'vae-kl-ledger-1-build',
    'vae-kl-ledger-sum',
    'vae-kl-ledger-2-build',
  ],
};
