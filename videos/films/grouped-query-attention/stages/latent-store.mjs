import { chapterModel } from '../construction.mjs';
import { bar, chapterEquation, chapterText, grid, note, operation } from '../defaults.mjs';
export function drawLatentStore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('latent-store', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Each small cell stands for 8 stored numbers',
        960,
        275,
        36,
        themeColors.cyan,
      );
      operation(ctx, api, 'latent-store', () => {
        grid(ctx, api, 300, 380, 8, 8, 49, (r, c) =>
          r * 8 + c < Math.ceil(64 * progress) ? themeColors.blue : themeColors.panel,
        );
        grid(ctx, api, 1120, 480, 1, 8, 54, () => themeColors.yellow);
      });
      chapterText(ctx, api, '512 content coordinates', 490, 860, 39, themeColors.blue);
      chapterText(ctx, api, '64 positional coordinates', 1340, 735, 37, themeColors.yellow);
      chapterEquation(
        ctx,
        api,
        String.raw`512+64=576\ \mathrm{numbers/token/layer}`,
        960,
        945,
        42,
        themeColors.ink,
      );
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Chosen raw cache layouts · common 2,048-number scale',
        960,
        270,
        35,
        themeColors.cyan,
      );
      [
        ['GQA-8', 2048, themeColors.blue],
        ['GQA-4', 1024, themeColors.green],
        ['MLA', 576, themeColors.yellow],
        ['MQA', 256, themeColors.pink],
      ].forEach(([name, value, color], i) => {
        const y = 365 + i * 125;
        chapterText(ctx, api, name, 300, y + 38, 32, color);
        bar(ctx, api, 480, y, 1050, value, 2048, color, 55);
        chapterText(ctx, api, value, 1680, y + 38, 33, color);
      });
      operation(ctx, api, 'latent-store', () =>
        chapterText(
          ctx,
          api,
          'MHA baseline: 32,768 numbers · 56.9× / MLA',
          960,
          935,
          36,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'All 128 queries remain distinct · cache counts do not establish equal functions or quality',
      );
    } else {
      chapterText(
        ctx,
        api,
        'Content and position have separate score terms',
        960,
        280,
        38,
        themeColors.cyan,
      );
      bar(ctx, api, 250, 420, 1100, 128, 192, themeColors.blue, 100);
      bar(
        ctx,
        api,
        250 + (1100 * 128) / 192,
        420,
        (1100 * 64) / 192,
        64,
        64,
        themeColors.yellow,
        100,
      );
      chapterText(ctx, api, 'content 128', 600, 590, 37, themeColors.blue);
      chapterText(ctx, api, 'position 64', 1180, 590, 37, themeColors.yellow);
      operation(ctx, api, 'latent-store', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`s_{t,s,i}=\frac{(q_i^C)^\top k_i^C+(q_i^R)^\top k_s^R}{\sqrt{128+64}}`,
          960,
          790,
          49,
          themeColors.ink,
        ),
      );
      note(
        ctx,
        api,
        'A fallback can materialize expanded keys; inspect actual retained and peak allocations',
      );
    }
  }
}
export default {
  id: 'latent-store',
  draw: drawLatentStore,
  cues: ['latent-store-0', 'latent-store-1', 'latent-store-2'],
};
