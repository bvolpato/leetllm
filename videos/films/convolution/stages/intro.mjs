import { IMAGE } from '../fixtures.mjs';
import { imageGrid, text } from '../defaults.mjs';
import { cueClock, footprint } from '../footprint.mjs';
import { MAP } from '../model.mjs';

function metalPanel(ctx, api, x, y, size, seam) {
  const steel = ctx.createLinearGradient(x, y, x + size * 0.6, y + size);
  steel.addColorStop(0, '#26323a');
  steel.addColorStop(0.42, '#52616a');
  steel.addColorStop(0.48, '#637078');
  steel.addColorStop(1, '#26333b');
  const bright = ctx.createLinearGradient(x, y, x + size, y + size);
  bright.addColorStop(0, '#859297');
  bright.addColorStop(0.52, '#e1e6e4');
  bright.addColorStop(1, '#99a4aa');
  api.rect(ctx, x, y, size, size, steel, undefined, 0);
  api.rect(ctx, seam, y, x + size - seam, size, bright, undefined, 0);
  api.line(ctx, seam - 3, y, seam - 3, y + size, '#202930', 5);
  api.line(ctx, seam + 2, y, seam + 2, y + size, '#f1f1e7', 3);
  for (const cx of [x + 35, x + size - 35]) {
    const cy = y + size - 36;
    api.circle(ctx, cx, cy, 15, '#536067', '#aeb7b9', 2);
    api.line(ctx, cx - 8, cy + 4, cx + 8, cy - 4, '#26323a', 4);
  }
}

export function drawIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const cue = cueClock(scene, state, api);
  const first = cue('opening-image');
  const choice = cue('opening-choice');
  // The original timing track groups the two slides into the choice cue.
  const progress = (id, original) => state.cues && !Object.hasOwn(state.cues, id) ? original : cue(id);
  const stops = [
    1,
    progress('second-window', api.clamp(2 * choice)),
    progress('third-window', api.clamp(2 * choice - 1)),
  ];
  const x = 160,
    y = 286,
    pitch = 130;
  const edge = IMAGE[0].indexOf(1);
  const approach = api.clamp((state.t ?? 0) / 0.4);
  const pan = progress('opening-pan', first);
  const seamColumn = edge + 0.9 * (1 - pan) + 0.2 * (1 - approach);
  const image = IMAGE.map((row) => row.map((v, c) => v * api.clamp(c + 1 - seamColumn)));
  const winner = progress('opening-winner', 0) === 1;
  const resolved = progress('opening-zero', 0) === 1;
  api.focus.target('edge-input', () => {
    const size = pitch * IMAGE.length - 7;
    if (first < 1) metalPanel(ctx, api, x, y, size, x + pitch * seamColumn);
    if (first > 0) api.components.fade(first, () =>
      imageGrid(ctx, api, image, x, y, pitch, { visible: 0 }));
    const column = api.ease(stops[1]) + api.ease(stops[2]);
    footprint(ctx, api, x, y, pitch, 0, column, 3, 3);
  });
  api.focus.target('edge-choice', () => {
    for (const [i, stop] of stops.entries()) {
      if (stop < 0.75) continue;
      const patch = image.slice(0, 3).map((row) => row.slice(i, i + 3));
      const closeup = i === 0 ? 1 - api.ease(stops[1]) : 0;
      const left = 1048 + i * 280 + 115 * closeup;
      const top = 490 - 112 * closeup;
      const cell = 86 + 72 * closeup;
      const center = left + (3 * cell - 7) / 2;
      api.components.fade(api.phase(stop, 0.75, 1), () => {
        imageGrid(ctx, api, patch, left, top, cell, { visible: 0 });
        if (progress('opening-left', choice) > 0) footprint(ctx, api, left, top, cell, 0, 0, 3, 1, api.C.pink);
        if (progress('opening-right', choice) > 0) footprint(ctx, api, left, top, cell, 0, 2, 3, 1, api.C.cyan);
        const name = String.fromCharCode(65 + i);
        const label = closeup > 0.5 ? 'Detector view' : name + (resolved || (winner && i === 2) ? '' : '  ?');
        text(ctx, api, label, center, top - 34, 49, winner && i === 2 ? api.C.green : api.C.yellow, 'center');
        if (resolved) text(ctx, api, MAP[0][i], center, 826, 52, i === 2 ? api.C.green : api.C.ink, 'center');
      });
    }
    if (choice > 0 && !winner)
      text(ctx, api, 'Which window gives zero?', 1453, 900, 43, api.C.yellow, 'center');
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'opening-pan',
    'opening-image',
    'second-window',
    'third-window',
    'opening-left',
    'opening-right',
    'opening-choice',
    'opening-winner',
    'opening-zero',
  ],
};
