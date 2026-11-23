import { cueMotion } from '../construction.mjs';

const channels = ['A', 'B', 'C', 'D'];
export function drawBridge(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.cyan, C.yellow, C.pink, C.green];
  const pack = cueMotion(state, 1, 'bridge-pack', 0.08, 0.5);
  const project = cueMotion(state, 2, 'bridge-project', 0, 0.4);
  api.focus.target('bridge-grid', () => {
    api.text(ctx, 'Four neighboring patch states', 110, 310, 40, C.ink);
    channels.forEach((name, i) => {
      const x = 140 + (i % 2) * 177;
      const y = 404 + Math.floor(i / 2) * 154;
      api.rect(ctx, x, y, 162, 142, C.panel, colors[i], 0);
      api.text(ctx, name, x + 81, y + 96, 64, colors[i], 'center');
    });
    api.text(ctx, 'Patch features only', 140, 813, 34, C.muted);
  });
  api.focus.target('bridge-output', () => {
    api.text(
      ctx,
      state.beat === 0 ? 'One token-wise projection per patch' : 'One group of four patches',
      745,
      310,
      40,
      C.ink,
    );
    if (state.beat === 0) {
      const advance = cueMotion(state, 0, 'bridge-width', 0.15, 0.6);
      channels.forEach((name, i) => {
        const y = 389 + 102 * i;
        api.text(ctx, 'Slot ' + (i + 1), 747, y + 54, 34, C.ink);
        for (let j = 0; j < 4; j++) {
          const w = j < 2 ? 83 : 83 * advance;
          if (w > 0) api.rect(ctx, 926 + j * 93, y + 9, w, 57, colors[i] + '44', colors[i], 0);
        }
      });
      api.text(ctx, 'Toy widths    2 → 4 coordinates per slot', 745, 902, 38, C.ink);
      return;
    }
    const spreadColumns = api.phase(pack, 0, 0.65);
    const joinRows = api.phase(pack, 0.65, 1);
    channels.forEach((name, i) => {
      const x0 = 797 + (i % 2) * 165,
        y0 = 395 + Math.floor(i / 2) * 156;
      const x = x0 + (760 + i * 154 - x0) * spreadColumns,
        y = y0 + (478 - y0) * joinRows;
      api.rect(ctx, x, y, 147, 125, C.panel, colors[i], 0);
      api.text(ctx, name, x + 74, y + 83, 52, colors[i], 'center');
    });
    if (pack === 1) api.text(ctx, 'Packed coordinates', 1065, 683, 34, C.ink, 'center');
    if (project > 0) {
      api.arrow(ctx, 1402, 541, 1490, 541, C.muted, 4);
      api.components.fade(project, () => {
        api.rect(ctx, 1520, 479, 250, 125, C.panel, C.green, 0);
        api.text(ctx, '1 slot', 1645, 561, 49, C.green, 'center');
      });
    }
    api.text(
      ctx,
      state.beat === 1
        ? 'The packed vector still contains all four inputs.'
        : 'The learned projection determines which distinctions survive.',
      1180,
      892,
      35,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'bridge',
  draw: drawBridge,
  cues: ['bridge-width', 'bridge-pack', 'bridge-project'],
};
