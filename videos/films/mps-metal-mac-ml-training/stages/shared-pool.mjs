import { card, panel, tag, target, text, ticket, withMpsRootFrame } from '../defaults.mjs';
export function paintSharedPool(ctx, scene, state, api, C, c, t, s) {
  if (s.step === 0) {
    panel(ctx, api, C, c, 180, 315, 640, 480, C.blue);
    panel(ctx, api, C, c, 1100, 315, 640, 480, C.pink);
    text(ctx, api, C, 'Host RAM', 500, 390, 44, C.blue, 'center');
    text(ctx, api, C, 'Discrete GPU VRAM', 1420, 390, 38, C.pink, 'center');
    card(ctx, api, C, c, 'ticket features · cpu', 260, 505, 480, 110, C.blue, 33);
    card(ctx, api, C, c, 'weights · cuda', 1180, 505, 480, 110, C.pink, 33);
    api.arrow(ctx, 835, 560, 1085, 560, C.yellow, 6);
    text(ctx, api, C, 'physical-memory boundary', 960, 890, 38, C.yellow, 'center');
  } else {
    target(ctx, api, 'one-memory-pool', () => panel(ctx, api, C, c, 160, 290, 1600, 600, C.green));
    text(ctx, api, C, 'Apple silicon · shared physical memory', 960, 365, 42, C.green, 'center');
    target(ctx, api, 'cpu-allocation', () => {
      ticket(ctx, api, C, c, 270, 460, 650, 180, C.blue);
      tag(ctx, api, C, c, 'CPU', 300, 690, C.blue);
    });
    target(ctx, api, 'mps-allocation', () => {
      card(ctx, api, C, c, 'Classifier weights', 1080, 460, 540, 180, C.cyan, 42);
      tag(ctx, api, C, c, 'MPS', 1265, 690, C.cyan);
    });
    text(ctx, api, C, 'Two PyTorch device tags remain', 960, 950, 38, C.yellow, 'center');
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintSharedPool(ctx, scene, state, api, C, c, t, s);
}
export function drawSharedPoolStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'shared-pool',
  draw: drawSharedPoolStage,
  cues: ['shared-physical-pool', 'distinct-device-tags'],
};
