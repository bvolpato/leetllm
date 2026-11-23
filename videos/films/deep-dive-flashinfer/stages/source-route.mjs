import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, footer, header, line } from '../defaults.mjs';
export function drawSourceRoute(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('source-route', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-source-route-mechanism', () => {
    header(ctx, api, 'Follow one concrete invariant through the repository');
    const rows = [
      ['decode wrapper plan/run', 'query/page offsets + split buffers'],
      ['batch decode CUDA', 'request/head/tile assignment'],
      ['cascade wrapper + CUH', 'LSE base + normalized scales'],
      ['page append', 'logical slot → physical page'],
    ];
    rows.forEach(([a, z], i) => {
      extensionCard(ctx, api, a, 140, 370 + i * 135, 680, themeColors.blue, 85, 28);
      if (progress > (i + 0.2) / 4) {
        line(ctx, api, 850, 410 + i * 135, 1000, 410 + i * 135, themeColors.cyan, 4);
        extensionCard(ctx, api, z, 1040, 370 + i * 135, 740, themeColors.cyan, 85, 27);
      }
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Release record: backend/split/workspace/compile/warmup/graph/correctness/p50/p99 on the intended trace'
        : 'Wrapper tests and dense reference establish the contract before a specialized microkernel',
    );
  });
}
export default {
  id: 'source-route',
  draw: drawSourceRoute,
  cues: [
    'fi-source-route-0',
    'fi-source-route-0-result',
    'fi-source-route-1',
    'fi-source-route-1-result',
    'fi-source-route-2',
    'fi-source-route-2-result',
  ],
};
