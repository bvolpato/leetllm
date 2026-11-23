import { beatCue } from '../arithmetic.mjs';
import { center, lower } from '../fixtures.mjs';
import { freshCollisionState } from '../model.mjs';
import { chapterGrid, line, point, text } from '../defaults.mjs';

const columns = [335, 960, 1585];
const side = 82;
const cutoff = 0.9;

function peakRuler(ctx, api, x, peak, verdict) {
  const { C } = api;
  const start = x - 202,
    width = 404,
    y = 848;
  // Magnify the upper end of the brightness scale. All three peaks fall in this interval.
  const at = (v) => start + ((v - 0.7) / 0.3) * width;
  line(ctx, api, start, y, start + width, y, C.muted, 3);
  line(ctx, api, at(cutoff), y - 18, at(cutoff), y + 24, C.pink, 4);
  text(ctx, api, '0.90', at(cutoff), y + 64, 27, C.pink, 'center');
  point(ctx, api, at(peak), y, verdict && peak > cutoff ? C.pink : C.ink, 10);
  text(ctx, api, 'Peak   ' + peak.toFixed(2), x, y - 45, 36, C.ink, 'center');
}

export function drawFreshCollision(ctx, scene, state, api) {
  const { C } = api;
  const f = freshCollisionState(state.beat, state.beatP, state.cues);
  const count = Math.ceil(4 * beatCue(state, 1, 'sum-centers', 0, 0.21));
  const revealed = Math.ceil(4 * beatCue(state, 0, 'vae-fresh-collision-0-build', 0.13, 0.33));
  const miss = beatCue(state, 2, 'compare-miss', 0.1, 0.24) > 0;
  const peaks = beatCue(state, 2, 'return-cutoff', 0.68, 0.81) > 0;
  const verdict = beatCue(state, 3, 'audit-peaks', 0, 0.15) === 1;
  const retained = beatCue(state, 3, 'retain-flag', 0.5, 0.7) === 1;
  const locations = beatCue(state, 3, 'retain-positions', 0.7, 0.8) === 1;
  const rows = [...f.inputs, f.outputs[0]];
  const names = ['Crop A', 'Crop B', f.decodeReady ? 'Decoded from either pair' : 'Fixed decoder'];
  rows.forEach((row, column) => {
    const x = columns[column],
      color = [C.cyan, C.pink, C.green][column];
    text(ctx, api, names[column], x, 244, 38, color, 'center');
    const left = x - 202,
      top = 293;
    if (column === 2 && !f.decodeReady) {
      api.rect(ctx, left, top, 405, 405, null, C.muted, 3);
      text(ctx, api, '?', x, top + 225, 72, C.muted, 'center');
      return;
    }
    const cells = chapterGrid(ctx, api, row, left, top, side);
    const peak = Math.max(...center.map((i) => row[i]));
    [...center.slice(0, revealed), ...lower].forEach((i) => {
      const cell = cells[i];
      const isCenter = center.includes(i);
      let border = isCenter ? C.yellow : C.cyan;
      if (verdict && isCenter && row[i] > cutoff) border = C.pink;
      const activeMiss = miss && !peaks && i === center[0];
      const activeSum = state.beat === 1 && count && i === center[count - 1] && !f.codeReady;
      api.rect(ctx, cell.x, cell.y, cell.width, cell.height, null, activeMiss ? C.pink : border, 3);
      if (activeMiss || activeSum || (verdict && isCenter && row[i] > cutoff)) {
        api.rect(ctx, cell.x + 5, cell.y + 5, cell.width - 10, cell.height - 10, null, C.bg, 1);
      }
      text(
        ctx,
        api,
        row[i].toFixed(2),
        cell.x + cell.width / 2,
        cell.y + 50,
        27,
        row[i] > 0.5 ? C.bg : C.ink,
        'center',
      );
    });
    if (peaks) {
      if (column < 2)
        text(
          ctx,
          api,
          'Code   [ ' + f.codes[column].map((v) => v.toFixed(2)).join(',  ') + ' ]',
          x,
          748,
          30,
          C.yellow,
          'center',
        );
      peakRuler(ctx, api, x, peak, verdict);
    } else {
      if (column < 2 && state.beat === 1 && count && !f.codeReady) {
        const partial = center.slice(0, count).reduce((sum, i) => sum + row[i], 0);
        text(ctx, api, 'Center sum   ' + partial.toFixed(2), x, 780, 35, C.yellow, 'center');
      } else if (column < 2) {
        const pair = f.codeReady ? f.codes[column].map((v) => v.toFixed(2)).join(',  ') : '?,  ?';
        text(ctx, api, 'Code   [ ' + pair + ' ]', x, 780, 35, C.yellow, 'center');
      }
      if (f.errorReady && column < 2)
        text(ctx, api, 'MSE   ' + f.mse[column].toFixed(5), x, 860, 33, C.ink, 'center');
      else if (miss && column < 2) {
        const i = center[0],
          delta = Math.abs(row[i] - f.outputs[column][i]);
        text(ctx, api, 'Top-left miss   ' + delta.toFixed(2), x, 860, 32, C.ink, 'center');
      }
    }
  });
  if (locations)
    text(
      ctx,
      api,
      'Did it cross? Keep the peak or flag.     Where? Keep the flagged positions.',
      960,
      992,
      34,
      C.ink,
      'center',
    );
  else if (retained)
    text(
      ctx,
      api,
      'Store the original peak or the flag with the code.',
      960,
      992,
      36,
      C.ink,
      'center',
    );
  else if (f.decodeReady && state.beat === 1)
    text(
      ctx,
      api,
      'The decoder cannot recover the original arrangement.',
      960,
      935,
      36,
      C.ink,
      'center',
    );
}

export default {
  id: 'fresh-collision',
  draw: drawFreshCollision,
  cues: [
    'vae-fresh-collision-0-build',
    'sum-centers',
    'vae-fresh-collision-code',
    'vae-fresh-collision-decoded',
    'compare-miss',
    'vae-fresh-collision-errors',
    'return-cutoff',
    'audit-peaks',
    'retain-flag',
    'retain-positions',
  ],
};
