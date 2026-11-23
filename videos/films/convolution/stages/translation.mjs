import { correlate } from '../arithmetic.mjs';
import { IMAGE, KERNEL } from '../fixtures.mjs';
import { MAP } from '../model.mjs';
import { cueProgress, featureGrid, formatValue, imageGrid, text } from '../defaults.mjs';
import { cueClock } from '../footprint.mjs';

function stridePairs(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const before = [0, 1, 1, 1, 1, 1];
  const after = [0, 0, 1, 1, 1, 1];
  const shifted = cue('pair-shift');
  const { C } = api;
  api.focus.target('stride-pairs', () => {
    for (const [row, pixels] of [before, after].entries()) {
      if (row === 1 && shifted === 0) continue;
      const y = 288 + row * 385,
        pitch = 142,
        x = 465;
      const amount = row === 0 ? cue('pair-original') : cue('pair-read-again');
      const visible = Math.floor(amount * 3);
      const data = row === 1 ? pixels.map((v, i) => api.lerp(before[i], v, shifted)) : pixels;
      text(ctx, api, row ? 'Shifted' : 'Original', 140, y + 88, 40, row ? C.yellow : C.ink);
      imageGrid(ctx, api, [data], x, y, pitch, {
        visible: shifted > 0 && shifted < 1 && row === 1 ? 0 : 6,
      });
      const response = correlate([pixels], [[-1, 1]], 2)[0];
      for (const [i, v] of response.entries()) {
        if (cue('pair-read') * 3 <= i) continue;
        const left = x + i * pitch * 2 + 4,
          right = left + pitch * 2 - 16;
        const bottom = y + pitch + 27;
        api.path(
          ctx,
          [
            { x: left, y: bottom - 17 },
            { x: left, y: bottom },
            { x: right, y: bottom },
            { x: right, y: bottom - 17 },
          ],
          { color: C.cyan, width: 4 },
        );
        text(
          ctx,
          api,
          i < visible ? String(pixels[2 * i + 1]) + ' − ' + pixels[2 * i] + ' = ' + v : '?',
          (left + right) / 2,
          bottom + 63,
          39,
          i < visible ? C.ink : C.muted,
          'center',
        );
      }
      const peak = row === 1 ? cue('pair-peak') === 1 : visible === 3;
      text(ctx, api, 'Maximum', 1585, y + 35, 34, C.muted, 'center');
      text(
        ctx,
        api,
        peak ? Math.max(...response) : '?',
        1585,
        y + 137,
        80,
        peak ? C.green : C.muted,
        'center',
      );
    }
  });
}
export function drawTranslation(ctx, scene, state, api) {
  if (state.beat >= 2) return stridePairs(ctx, scene, state, api);
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress2, start, end);
  const fade = components.fade;
  ctx.save();
  {
    const shift = cueProgress(ctx, api, 'translated-edge', stage(0)),
      im = IMAGE.map((row) => row.map((v, col) => (col === 2 ? 1 - shift : v))),
      map = correlate(im, KERNEL);
    const held = shift === 0 || shift === 1;
    api.focus.target('translated-input', () =>
      imageGrid(ctx, api, im, 230, 350, 100, {
        visible: held ? Infinity : 0,
      }),
    );
    api.focus.target('translated-response', () => {
      if (currentBeat === 0) {
        featureGrid(ctx, api, MAP, 1110, 420, 90, {
          opacity: 0.35,
        });
        featureGrid(ctx, api, map, 1470, 420, 90, {
          visible: held ? Infinity : 0,
        });
        text(ctx, api, 'old map', 1240, 350, 31, themeColors.muted, 'center');
        text(ctx, api, 'shifted map', 1600, 350, 31, themeColors.green, 'center');
        api.arrow(ctx, 1388, 555, 1455, 555, themeColors.green, 4);
        text(ctx, api, 'response shifts with the edge', 1450, 900, 31, themeColors.green, 'center');
      } else {
        const progress = cueProgress(ctx, api, 'max-aggregate', stage(1)),
          flat = map.flat(),
          scanned = progress * flat.length,
          count = Math.floor(scanned),
          active = Math.min(flat.length - 1, count),
          running = count ? Math.max(...flat.slice(0, count)) : null;
        featureGrid(ctx, api, map, 1250, 430, 110, {
          active: progress > 0 ? active : undefined,
        });
        text(ctx, api, 'current cell', 1040, 615, 29, themeColors.muted, 'center');
        const current = components.card({
          label: progress > 0 ? formatValue(flat[active]) : '?',
          x: 950,
          y: 650,
          width: 180,
          height: 100,
          fontSize: 43,
          stroke: themeColors.yellow,
          textColor: themeColors.yellow,
        });
        const centerX = current.x + current.width / 2;
        const accumulator = components.card({
          label: running === null ? 'maximum ?' : 'maximum ' + formatValue(running),
          x: centerX - 200,
          y: 880,
          width: 400,
          height: 110,
          fontSize: 40,
          stroke: themeColors.green,
          textColor: themeColors.green,
        });
        // Keep the whole traveling digit between the two card borders.
        const digitClearance = 30;
        const startY = current.y + current.height + digitClearance;
        const endY = accumulator.y - digitClearance;
        const travel = progress === 1 ? 1 : scanned - count;
        const tipY = api.lerp(startY, endY, travel);
        api.line(ctx, centerX, startY, centerX, endY, themeColors.muted, 2);
        api.arrow(ctx, centerX, startY, centerX, tipY, themeColors.green, 4);
        if (travel > 0 && travel < 1)
          text(
            ctx,
            api,
            formatValue(flat[active]),
            centerX + 40,
            tipY + 12,
            32,
            themeColors.green,
            'center',
          );
        if (count > 0) text(ctx, api, 'old maximum 3', 440, 960, 32, themeColors.muted, 'center');
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'translation',
  draw: drawTranslation,
  cues: [
    'translated-edge',
    'max-aggregate',
    'pair-read',
    'pair-original',
    'pair-shift',
    'pair-read-again',
    'pair-peak',
  ],
};
