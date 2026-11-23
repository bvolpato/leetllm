import { clamp, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawPanel,
  drawReference,
  drawText,
  drawTransfer,
  withFocus,
} from '../defaults.mjs';
export function drawCacheOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const store = progress('cache-store', 0),
      hit = progress('cache-hit', 0, 0.65, 0.85);
    if (currentBeat === 0)
      withFocus(ctx, api, 'cache-storage', () => {
        drawCard(
          ctx,
          api,
          'Key: (v7, charged twice, k=2, scope)',
          250,
          300,
          1420,
          90,
          themeColors.cyan,
          1,
          32,
        );
        drawCard(
          ctx,
          api,
          store >= 0.98 ? 'Stored tuple: (M0, M2)' : 'Entry absent; compute the ranked IDs',
          360,
          520,
          1200,
          110,
          store >= 0.98 ? themeColors.green : themeColors.muted,
          1,
          33,
        );
        drawCaption(
          ctx,
          api,
          hit > 0
            ? 'Matching snapshot and key → reuse the stored ranking'
            : 'First request → lookup → compute → store',
          themeColors.cyan,
        );
      });
    else
      withFocus(ctx, api, 'cache-ownership', () => {
        const alias = progress('cache-alias-remove', 1),
          copy = progress('cache-copy', 1, 0.45, 0.65),
          remove = progress('cache-copy-remove', 1, 0.72, 0.9),
          safe = copy > 0,
          removal = safe ? remove : alias;
        drawText(
          ctx,
          api,
          safe
            ? 'Replay: request-owned list, immutable cached IDs'
            : 'Intentional broken cache: one mutable list',
          960,
          280,
          32,
          safe ? themeColors.cyan : themeColors.pink,
          'center',
        );
        const leave = clamp(removal / 0.5),
          shift = clamp((removal - 0.55) / 0.45);
        if (!safe) {
          const names = ['Cache entry', 'Caller A', 'Next cache hit'].map((label, i) =>
            drawCard(
              ctx,
              api,
              label,
              180,
              410 + i * 170,
              380,
              80,
              i === 1 ? themeColors.yellow : themeColors.cyan,
            ),
          );
          const shared = drawPanel(ctx, api, 850, 410, 860, 410, themeColors.cyan, () => {
            drawText(ctx, api, 'One mutable list object', 890, 475, 32, themeColors.cyan);
            if (leave < 1)
              drawReference(ctx, api, 0, 930, mix(550, 700, leave), themeColors.pink, 1 - leave);
            drawReference(ctx, api, 2, mix(1240, 930, shift), 550, themeColors.green);
          });
          names.forEach((name) => drawTransfer(ctx, api, name, shared, themeColors.cyan));
        } else {
          drawCard(
            ctx,
            api,
            'Cached tuple · immutable',
            180,
            400,
            650,
            80,
            themeColors.cyan,
            1,
            31,
          );
          drawReference(ctx, api, 0, 210, 520, themeColors.cyan);
          drawReference(ctx, api, 2, 510, 520, themeColors.cyan);
          drawCard(
            ctx,
            api,
            'Caller A · owned list',
            1050,
            400,
            680,
            80,
            themeColors.yellow,
            1,
            31,
          );
          for (const [id, startX, endX, y] of [
            [0, 210, 1100, 650],
            [2, 510, 1410, 760],
          ]) {
            const p = clamp(copy * 2 - (id === 0 ? 0 : 1)),
              travel = clamp(p / 0.75),
              landing = clamp((p - 0.75) / 0.25);
            if (p > 0) {
              if (id === 0) {
                if (leave < 1)
                  drawReference(
                    ctx,
                    api,
                    0,
                    mix(startX, endX, travel),
                    mix(y, 520, landing) + 160 * leave,
                    themeColors.pink,
                    1 - leave,
                  );
              } else
                drawReference(
                  ctx,
                  api,
                  2,
                  mix(startX, endX, travel) - 310 * shift,
                  mix(y, 520, landing),
                  themeColors.green,
                );
            }
          }
          if (copy >= 0.98) {
            drawText(ctx, api, 'Next hit reads the intact tuple', 180, 780, 30, themeColors.cyan);
            drawReference(ctx, api, 0, 210, 830, themeColors.cyan);
            drawReference(ctx, api, 2, 510, 830, themeColors.cyan);
          }
        }
        drawCaption(
          ctx,
          api,
          safe
            ? 'The request can change its own list; stored IDs stay intact'
            : removal >= 0.98
              ? 'Mutation through an alias changes the next hit'
              : 'Caller A removes the first reference',
          safe ? themeColors.green : themeColors.pink,
        );
      });
  }
}
export default {
  id: 'cache-ownership',
  draw: drawCacheOwnership,
  cues: ['cache-store', 'cache-hit', 'cache-alias-remove', 'cache-copy', 'cache-copy-remove'],
};
