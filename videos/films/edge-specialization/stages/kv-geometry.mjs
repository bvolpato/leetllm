import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeEquation, drawEdgeL, drawEdgeText } from '../defaults.mjs';
export function drawKvGeometry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('kv-geometry', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-kv-geometry-mechanism', () => {
    heading('Storage follows KV heads while the query count stays sixteen');
    const qheads = 16,
      kv = currentBeat === 0 ? 16 : done('gqa') ? 4 : 16;
    for (let i = 0; i < qheads; i++) {
      const x = 190 + i * 97;
      drawEdgeCard(ctx, api, `Q${i}`, x, 390, 82, themeColors.blue, 65);
      const target = Math.floor(i / (16 / kv));
      const tx = kv === 4 ? 365 + target * 390 : 190 + target * 97;
      if (currentBeat > 0 || q * 16 >= i)
        drawEdgeL(
          ctx,
          api,
          x + 41,
          455,
          tx + (kv === 4 ? 110 : 41),
          620,
          [themeColors.cyan, themeColors.green, themeColors.yellow, themeColors.pink][target % 4],
          2,
        );
    }
    for (let i = 0; i < kv; i++)
      if (currentBeat > 0 || q * kv >= i)
        drawEdgeCard(
          ctx,
          api,
          kv === 4 ? `KV${i}` : String(i),
          kv === 4 ? 365 + i * 390 : 190 + i * 97,
          620,
          kv === 4 ? 220 : 82,
          [themeColors.cyan, themeColors.green, themeColors.yellow, themeColors.pink][i % 4],
          95,
        );
    drawEdgeEquation(ctx, api, String.raw`B=2\,L\,H_{\rm KV}\,d\,S\,b`, 960, 820, 46);
    if (currentBeat === 0)
      drawEdgeText(
        ctx,
        api,
        'K and V × layers × KV heads × width × positions × bytes',
        960,
        930,
        30,
        themeColors.cyan,
        'center',
      );
    if (currentBeat === 1 && done('mha'))
      drawEdgeText(
        ctx,
        api,
        kv === 16 ? '24 × 16 × 64 × 4096 × 2 × 2 → 384 MiB' : '24 × 4 × 64 × 4096 × 2 × 2 → 96 MiB',
        960,
        930,
        32,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2) {
      drawEdgeText(
        ctx,
        api,
        '384 MiB → 96 MiB KV payload',
        960,
        870,
        30,
        themeColors.cyan,
        'center',
      );
      drawEdgeCard(
        ctx,
        api,
        'weights + metadata + pools + temporary buffers',
        300,
        930,
        1320,
        themeColors.pink,
        65,
      );
    }
    note('Trained architectural alternatives, not an inference-time head-layout switch');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'kv-geometry',
  draw: drawKvGeometry,
  cues: [
    'edge-kv-geometry-op-0',
    'edge-kv-geometry-factors',
    'edge-kv-geometry-op-1',
    'edge-kv-geometry-mha',
    'edge-kv-geometry-gqa',
    'edge-kv-geometry-groups',
    'edge-kv-geometry-op-2',
  ],
};
