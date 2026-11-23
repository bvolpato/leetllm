import {
  extensionCode,
  foot,
  math,
  panel,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintDeviceIdentity(ctx, scene, state, api, C, c, t, s, id) {
  if (s.step === 0) {
    extensionCode(ctx, api, C, 'torch.device("mps")', 505, 320, 33, C.yellow);
    extensionCode(ctx, api, C, 'torch.device("mps:0")', 1435, 320, 33, C.cyan);
    math(ctx, api, C, '\\ne', 960, 325, 60, C.pink);
    panel(ctx, api, C, c, 220, 430, 600, 275, C.blue);
    text(ctx, api, C, 'Batch tensor', 520, 490, 38, C.blue, 'center');
    extensionCode(ctx, api, C, 'actual device: cpu', 520, 570, 32, C.blue);
    text(ctx, api, C, 'b = b.to(parameter.device)', 960, 790, 39, C.yellow, 'center');
    panel(ctx, api, C, c, 1100, 430, 600, 275, C.cyan);
    text(ctx, api, C, 'Model parameter', 1400, 490, 38, C.cyan, 'center');
    extensionCode(ctx, api, C, 'actual device: mps:0', 1400, 570, 32, C.cyan);
    api.arrow(ctx, 850, 575, 1070, 575, C.yellow, 6);
    text(
      ctx,
      api,
      C,
      'Use the actual tensor device to define the destination',
      960,
      925,
      34,
      C.green,
      'center',
    );
  } else {
    panel(ctx, api, C, c, 380, 340, 1160, 450, C.cyan);
    text(ctx, api, C, 'One logical GPU device', 960, 405, 43, C.cyan, 'center');
    t.grid({
      x: 550,
      y: 470,
      width: 820,
      height: 210,
      rows: 2,
      columns: 4,
      labels: Array.from(
        {
          length: 2,
        },
        () => Array(4).fill('core group'),
      ),
      fill: C.panel,
      stroke: C.blue,
      fontSize: 27,
    });
    text(
      ctx,
      api,
      C,
      'Illustrative internal groups · not eight PyTorch devices',
      960,
      850,
      33,
      C.yellow,
      'center',
    );
    text(
      ctx,
      api,
      C,
      'MLX array placement follows its own framework contract',
      960,
      940,
      31,
      C.ink,
      'center',
    );
  }
  foot(
    ctx,
    api,
    C,
    'Device-object equality, actual placement and hardware topology answer different questions',
  );
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintDeviceIdentity);
}
export function drawDeviceIdentityStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'device-identity',
  draw: drawDeviceIdentityStage,
  cues: ['device-identity-b1', 'device-identity-b2'],
};
