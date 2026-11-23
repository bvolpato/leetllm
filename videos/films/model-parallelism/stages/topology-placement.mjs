import { sceneClock } from '../scene-clock.mjs';

const prefix = 'mp-topology-placement-';
export function drawTopologyPlacement(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  api.focus.target('mp-topology-placement-mechanism', () => {
    if (state.beat === 2) {
      const capacity = 8 * 80;
      const x = 505,
        width = 1120;
      api.text(ctx, 'Raw four-bit weights', 185, 315, 45, C.ink);
      for (const [i, params] of [405, 671].entries()) {
        const y = 423 + i * 176,
          payload = params / 2;
        api.text(ctx, params + 'B', x - 40, y + 62, 48, C.ink, 'right');
        api.rect(ctx, x, y, width, 94, C.panel, C.muted, 0);
        if (clock.done(prefix + 'raw-codes')) {
          const w = (width * payload) / capacity;
          api.rect(ctx, x, y, w, 94, C.blue, undefined, 0);
          api.text(ctx, payload + ' GB', x + w / 2, y + 61, 38, C.bg, 'center');
        }
      }
      const label = clock.done(prefix + 'group') ? '8 × 80 GB = 640 GB' : '8 GPUs × 80 GB';
      api.text(ctx, label, x + width, 808, 43, C.yellow, 'right');
      api.text(
        ctx,
        'Next, check weights and request memory on each GPU',
        960,
        942,
        39,
        C.ink,
        'center',
      );
      return;
    }
    if (state.beat === 1) {
      api.text(ctx, 'GB200 NVL72', 185, 299, 47, C.ink);
      for (let r = 0; r < 72; r++) {
        const x = 185 + (r % 18) * 86,
          y = 385 + Math.floor(r / 18) * 110;
        api.rect(ctx, x, y, 68, 72, r < 8 ? C.blue : C.muted, undefined, 4);
      }
      if (clock.done(prefix + 'domain'))
        api.text(ctx, '8 selected GPUs in one 72-GPU NVLink domain', 960, 947, 43, C.ink, 'center');
      return;
    }
    for (const [i, label] of ['Early layers', 'Later layers'].entries()) {
      const x = 190 + i * 950,
        color = i ? C.cyan : C.blue;
      api.text(ctx, label, x + 235, 385, 48, color, 'center');
      for (let k = 0; k < 4; k++) {
        const left = x + (k % 2) * 250,
          top = 448 + Math.floor(k / 2) * 150;
        api.rect(ctx, left, top, 220, 112, C.panel, color, 8);
        api.text(ctx, 'GPU ' + (i * 4 + k), left + 110, top + 70, 39, color, 'center');
      }
    }
    const q = clock.progress(prefix + 'placement');
    api.line(ctx, 685, 580, 1115, 580, C.muted, 3);
    api.text(ctx, 'Activation', 900, 523, 36, C.ink, 'center');
    if (q > 0) api.circle(ctx, 700 + 400 * q, 580, 18, C.yellow);
    api.text(ctx, 'One stage boundary on the forward pass', 960, 915, 42, C.ink, 'center');
  });
}
export default {
  id: 'topology-placement',
  draw: drawTopologyPlacement,
  cues: ['0', 'placement', '1', 'domain', '2', 'raw-codes', 'group'].map((id) => prefix + id),
};
