import { centerPopulation, cosine } from '../arithmetic.mjs';
import { completed, event } from '../construction.mjs';
import { axes, centeredText, footer, vectorArrow } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawAnisotropyCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString()),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  api.focus.target('anisotropy-check-mechanism', () => {
    const center = currentBeat > 0 ? ev('common-center', 1) : 0,
      zero = ev('common-zero', 1) > 0;
    centeredText(
      ctx,
      api,
      zero
        ? 'New three-point population includes its mean'
        : 'Separate supplied common-direction fixture',
      960,
      285,
      33,
      themeColors.yellow,
    );
    const points = zero
        ? [
            [10, 1],
            [10, 2],
            [10, 3],
          ]
        : [
            [10, 1],
            [10, -1],
          ],
      m = centerPopulation(points),
      current = points.map((v, i) => v.map((x, j) => x - center * m.mean[j])),
      a = axes(ctx, api, 170, 415, 880, 450, [-1, 11], [-2, 4], [-1, 0, 1, 10]);
    current.forEach((v, i) =>
      vectorArrow(ctx, api, a, v, [themeColors.cyan, themeColors.pink, themeColors.blue][i]),
    );
    centeredText(ctx, api, 'same fitted mean ' + vec(m.mean), 1460, 415, 34, themeColors.yellow);
    if (zero) {
      centeredText(ctx, api, 'centered middle ' + vec(current[1]), 1460, 580, 37, themeColors.pink);
      centeredText(ctx, api, 'cosine undefined at zero length', 1460, 745, 32, themeColors.pink);
    } else {
      centeredText(
        ctx,
        api,
        'dot ' + fmt(dotProduct(current[0], current[1])),
        1460,
        580,
        36,
        themeColors.ink,
      );
      centeredText(
        ctx,
        api,
        done('common-cosine', 0) ? 'cosine ' + fmt(cosine(current[0], current[1])) : 'cosine ?',
        1460,
        745,
        44,
        themeColors.green,
      );
    }
    if (currentBeat === 2)
      centeredText(
        ctx,
        api,
        'Fit on a representative training population · apply one fixed transform to both roles',
        960,
        950,
        30,
        themeColors.muted,
      );
    footer(
      ctx,
      api,
      'Pair-centering two distinct points makes opposites; it does not establish improved retrieval',
    );
  });
}
export default {
  id: 'anisotropy-check',
  draw: drawAnisotropyCheck,
  cues: [
    'emb-common-dot',
    'emb-common-cosine',
    'emb-common-center',
    'emb-common-opposite',
    'emb-common-zero',
    'emb-common-population',
  ],
};
