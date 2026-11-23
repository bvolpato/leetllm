import { visionBound } from '../construction.mjs';
import { arrow, card, detailText, footer, title } from '../defaults.mjs';
export function drawBridgeFamilies(ctx, scene, state, api) {
  api.focus.target('bridge-families-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    {
      const rows = [
          {
            name: 'Original LLaVA',
            encoder: 'CLIP ViT-L/14',
            shape: '256 ×1024 patch states',
            bridge: 'token-wise linear',
            out: '256 ordinary prefix slots',
          },
          {
            name: 'Flamingo',
            encoder: 'NFNet feature grid',
            shape: 'variable spatial features',
            bridge: '64-query resampler',
            out: '64 cross-attention latents',
          },
          {
            name: 'Qwen2.5-VL',
            encoder: 'own width 1280 ViT',
            shape: '256 patches at 224²',
            bridge: 'adjacent 2×2 + MLP',
            out: '64 ordinary prefix slots',
          },
        ],
        r = rows[Math.min(currentBeat, 2)];
      title(ctx, api, 'Architecture-specific boundaries · each lane owns its encoder');
      card(ctx, api, r.encoder, 180, 430, 570, 110, themeColors.blue, 32);
      card(ctx, api, r.bridge, 1050, 430, 690, 110, themeColors.yellow, 32);
      arrow(ctx, api, 785, 485, 1010, 485);
      detailText(ctx, api, r.shape, 465, 700, 30, themeColors.blue, 'center');
      detailText(ctx, api, r.out, 1395, 700, 31, themeColors.green, 'center');
      detailText(ctx, api, r.name, 960, 875, 40, themeColors.ink, 'center');
      footer(
        ctx,
        api,
        currentBeat === 1
          ? 'Cross-attention visual memory is separate from ordinary decoder prefix slots'
          : currentBeat === 2
            ? 'Most Qwen vision layers use local windows; four of 32 use full attention'
            : 'Original 224px encoder differs from LLaVA-1.5’s 336px encoder',
      );
    }
    return true;
  });
}
export default {
  id: 'bridge-families',
  draw: drawBridgeFamilies,
  cues: ['bridge-families-beat-0', 'bridge-families-beat-1', 'bridge-families-beat-2'],
};
