import { codeText, focusTarget, imageLayer, line, rectangle, text } from '../defaults.mjs';

export function drawGpuContracts(ctx, scene, state, api) {
  const { C } = api;
  const after = (key) => state.cues?.['dk-gpu-contracts-' + key]?.phase === 'after';
  focusTarget(ctx, api, 'gpu-contracts-construction', () => {
    if (state.beat === 0) {
      codeText(ctx, api, 'Application image', 145, 314, 41, C.cyan);
      if (after('userspace'))
        imageLayer(ctx, api, 144, 390, 750, 'Framework + CUDA runtime libraries', C.cyan);
      codeText(ctx, api, 'Host', 145, 646, 41, C.blue);
      imageLayer(ctx, api, 144, 700, 750, 'GPU + NVIDIA kernel driver', C.blue);
      rectangle(ctx, api, 1160, 362, 618, 524, C.panel, C.cyan);
      codeText(ctx, api, 'Running container', 1192, 435, 38, C.cyan);
      if (after('userspace')) {
        api.arrow(ctx, 928, 461, 1131, 461, C.cyan, 4);
        codeText(ctx, api, 'Application libraries', 1192, 520, 34);
      }
      if (after('expose')) {
        api.arrow(ctx, 928, 766, 1131, 766, C.blue, 4);
        codeText(ctx, api, 'Via NVIDIA runtime', 1192, 668, 31, C.blue);
        codeText(ctx, api, 'Requested GPU devices', 1192, 748, 34);
        codeText(ctx, api, 'Host driver libraries', 1192, 819, 34);
      }
    } else if (state.beat === 1) {
      const xs = [160, 513, 874, 1250];
      const headings = ['Host probe', 'Container probe', 'PyTorch', 'Inspect next'];
      headings.forEach((label, i) => codeText(ctx, api, label, xs[i], 325, 32, C.muted));
      const rows = [
        { cue: 'host', states: ['fails', '·', '·'], next: 'Host driver' },
        { cue: 'device', states: ['passes', 'fails', '·'], next: 'Toolkit and devices' },
        { cue: 'framework', states: ['passes', 'passes', 'unavailable'], next: 'Framework build' },
      ];
      rows.forEach(({ cue, states, next }, i) => {
        const y = 483 + i * 152;
        line(ctx, api, 150, y + 53, 1772, y + 53, C.muted);
        const current = state.cues?.['dk-gpu-contracts-' + cue];
        if (!current || current.phase === 'before') return;
        states.forEach((status, j) => {
          const color = status === 'passes' ? C.green : status === '·' ? C.muted : C.pink;
          codeText(ctx, api, status, xs[j], y, 39, color);
        });
        if (after(cue)) codeText(ctx, api, next, xs[3], y, 37);
      });
    } else {
      const cases = [
        ['Linux Engine', 'System service or user-scoped rootless daemon'],
        ['Windows Desktop', 'WSL2 and a compatible Windows NVIDIA driver'],
        ['Apple Silicon', 'Linux CPU container · native Mac PyTorch via MPS'],
      ];
      for (const [i, [name, path]] of cases.entries()) {
        const y = 455 + i * 164;
        rectangle(ctx, api, 145, y - 68, 439, 101, C.panel, C.blue);
        text(ctx, api, name, 365, y, 35, C.blue);
        if (i === 0 || (i === 1 && after('windows')) || (i === 2 && after('mac')))
          codeText(ctx, api, path, 652, y, 35);
      }
    }
  });
}
export default {
  id: 'gpu-contracts',
  draw: drawGpuContracts,
  cues: [
    'dk-gpu-contracts-beat0',
    'dk-gpu-contracts-userspace',
    'dk-gpu-contracts-expose',
    'dk-gpu-contracts-beat1',
    'dk-gpu-contracts-host',
    'dk-gpu-contracts-device',
    'dk-gpu-contracts-framework',
    'dk-gpu-contracts-beat2',
    'dk-gpu-contracts-windows',
    'dk-gpu-contracts-mac',
  ],
};
