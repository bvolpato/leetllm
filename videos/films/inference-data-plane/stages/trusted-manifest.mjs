import { L, memory, rectangle, text } from '../defaults.mjs';
export function drawTrustedManifest(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'R4219 · trusted reservation authorizes interpretation',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      const fields = [
          'tenant billing',
          'M17/r5 + tokenizer + adapter',
          'canonical tokens + positions',
          'bf16 · TP2 · paged-v2',
          'rank/block coverage + lease12',
        ],
        n = Math.max(1, Math.ceil(q(0) * fields.length));
      text(ctx, api, 'trusted destination', 450, 360, 31, themeColors.blue, 'center');
      text(ctx, api, 'received descriptor', 1480, 360, 31, themeColors.green, 'center');
      fields.slice(0, n).forEach((v, i) => {
        const y = 420 + i * 92;
        text(ctx, api, v, 170, y + 35, 30, themeColors.blue);
        L(ctx, api, 760, y + 15, 1100, y + 15, themeColors.muted, 2);
        text(ctx, api, v, 1180, y + 35, 30, themeColors.green);
      });
      text(
        ctx,
        api,
        'Compare identity and coverage before treating bytes as valid state',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      rectangle(ctx, api, 200, 450, 480, 170, themeColors.blue);
      text(ctx, api, 'source physical904', 440, 515, 36, themeColors.blue, 'center');
      text(ctx, api, 'logical block31', 440, 580, 33, themeColors.yellow, 'center');
      rectangle(ctx, api, 1240, 450, 480, 170, themeColors.green);
      text(ctx, api, 'destination physical118', 1480, 515, 32, themeColors.green, 'center');
      text(ctx, api, 'logical block31', 1480, 580, 33, themeColors.yellow, 'center');
      const u = q(1),
        x = 740 + 340 * u;
      rectangle(ctx, api, x - 75, 475, 150, 115, themeColors.yellow);
      text(ctx, api, 'KV31', x, 548, 36, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'Addresses differ; canonical token positions and layout must match',
        960,
        760,
        32,
        themeColors.cyan,
        'center',
      );
      if (q(1) > 0.55) {
        ['last token / hidden state', 'sampling state', 'first-token owner'].forEach((v, i) => {
          rectangle(ctx, api, 220 + i * 550, 855, 480, 95, themeColors.yellow);
          text(ctx, api, v, 460 + i * 550, 915, 28, themeColors.yellow, 'center');
        });
      }
    } else if (currentBeat === 2) {
      rectangle(ctx, api, 180, 440, 700, 310, themeColors.blue);
      text(ctx, api, 'registered payload region', 530, 500, 37, themeColors.blue, 'center');
      memory(ctx, api, 250, 550, 8, 2, 16, '', themeColors.blue, 68);
      rectangle(ctx, api, 1140, 440, 600, 200, themeColors.green);
      text(ctx, api, 'small protected descriptor', 1440, 500, 32, themeColors.green, 'center');
      text(ctx, api, 'region key · offset · length', 1440, 575, 29, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'Authorization + integrity + tenant isolation',
        960,
        855,
        36,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Keep region keys out of application logs',
        960,
        990,
        35,
        themeColors.pink,
        'center',
      );
    } else {
      const stopped = q(3) > 0.8;
      rectangle(ctx, api, 470, 415, 980, 260, stopped ? themeColors.green : themeColors.pink);
      for (let i = 0; i < 12; i++) {
        const x = 510 + i * 74;
        rectangle(ctx, api, x, 485, 62, 92, i >= 4 && i <= 7 ? themeColors.pink : themeColors.blue);
        text(
          ctx,
          api,
          String(i),
          x + 31,
          545,
          30,
          i >= 4 && i <= 7 ? themeColors.pink : themeColors.blue,
          'center',
        );
      }
      text(ctx, api, 'one registered region', 960, 725, 36, themeColors.yellow, 'center');
      const u = q(3);
      text(
        ctx,
        api,
        stopped
          ? 'writer stopped + consumers stopped'
          : 'operation17 cancelled; physical writer may remain',
        960,
        850,
        34,
        stopped ? themeColors.green : themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        stopped
          ? 'Region reusable after observed quiescence'
          : 'operation18 overlapping cells4–7 → corruption risk',
        960,
        990,
        34,
        stopped ? themeColors.green : themeColors.pink,
        'center',
      );
    }
  };
  if (api.focus)
    api.focus.target('trusted-manifest-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'trusted-manifest',
  draw: drawTrustedManifest,
  cues: [
    'trusted-manifest-b1',
    'trusted-manifest-b2',
    'trusted-manifest-b3',
    'trusted-manifest-b4',
  ],
};
