import {
  card,
  extensionCode,
  foot,
  panel,
  target,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
import { float32Neighbors } from '../arithmetic.mjs';
export function paintDtypeAllocation(ctx, scene, state, api, C, c, t, s, id) {
  const value = float32Neighbors().input;
  text(ctx, api, C, 'Follow the dtype into the allocation', 960, 280, 38, C.ink, 'center');
  const boxes = [
    {
      x: 160,
      label: 'NumPy float64',
      color: C.blue,
    },
    {
      x: 740,
      label: 'CPU tensor · float64',
      color: C.blue,
    },
    {
      x: 1320,
      label: s.converted ? 'MPS float32' : 'MPS allocation',
      color: s.converted ? C.green : s.rejected ? C.pink : C.yellow,
    },
  ];
  boxes.forEach((b, i) => {
    panel(ctx, api, C, c, b.x, 380, 440, 280, b.color);
    text(ctx, api, C, b.label, b.x + 220, 435, 32, b.color, 'center');
    if (i === 2 && !s.converted) {
      text(ctx, api, C, 'float64 requested', b.x + 220, 530, 29, b.color, 'center');
      text(
        ctx,
        api,
        C,
        s.rejected ? 'tensor not created' : 'request pending',
        b.x + 220,
        600,
        29,
        b.color,
        'center',
      );
    } else if (i === 2) {
      text(ctx, api, C, '2 features allocated', b.x + 220, 545, 32, b.color, 'center');
    } else
      value.forEach((v, j) =>
        extensionCode(ctx, api, C, v.toLocaleString('en-US'), b.x + 220, 520 + j * 75, 32, b.color),
      );
  });
  api.arrow(ctx, 620, 510, 715, 510, C.cyan, 5);
  api.arrow(ctx, 1200, 510, 1295, 510, s.converted ? C.green : C.yellow, 5);
  target(ctx, api, 'mps-dtype-gate', () => {
    if (s.converted) {
      extensionCode(ctx, api, C, 'features.to(device="mps", dtype=torch.float32)', 960, 742, 34, C.green);
      if (s.labelsReady)
        extensionCode(ctx, api, C, 'labels  [0, 2, 1, 0]     torch.long  →  torch.long', 960, 839, 32, C.blue);
      text(
        ctx,
        api,
        C,
        'Allocation succeeded. Which values did it store?',
        960,
        940,
        35,
        C.yellow,
        'center',
      );
    } else if (s.rejected) {
      card(
        ctx,
        api,
        C,
        c,
        'float64 rejected before the tensor exists',
        335,
        760,
        1250,
        115,
        C.pink,
        36,
      );
      text(
        ctx,
        api,
        C,
        'Operator fallback cannot repair this allocation',
        960,
        935,
        34,
        C.pink,
        'center',
      );
    } else
      text(
        ctx,
        api,
        C,
        'Will the fallback flag create a supported dtype?',
        960,
        820,
        38,
        C.yellow,
        'center',
      );
  });
  if (s.step === 0) foot(ctx, api, C, 'Allocation check in PyTorch 2.14.1');
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintDtypeAllocation);
}
export function drawDtypeAllocationStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'dtype-allocation',
  draw: drawDtypeAllocationStage,
  cues: ['dtype-allocation-b1', 'mps-dtype-reject', 'dtype-allocation-b2', 'mps-dtype-convert', 'class-index-dtype'],
};
