import { CONTEXT_REQUIRED } from '../fixtures.mjs';
import { boundedContext, contextDone, contextProgress, requiredPacking } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteRectangle,
  drawCompleteStatus,
  drawCompleteText,
} from '../defaults.mjs';
export function drawRequiredPacker(ctx, scene, state, api) {
  if (paintRequiredPacker(ctx, scene, state, api)) return;
}
function paintRequiredPacker(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  const number = (value) => value.toLocaleString('en-US');
  drawCompleteFocus(ctx, api, 'ce-required-packer-mechanism', () => {
    const m = requiredPacking(CONTEXT_REQUIRED, currentBeat === 2 ? 2472 : 3000),
      x = 360,
      w = 1320,
      y = 500,
      scale = w / m.budget;
    drawCompleteHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Required items lead; priority orders the remaining candidates'
        : currentBeat === 1
          ? 'Attempt each item against the same remaining allocation'
          : 'Subtract reserves before the same selected evidence enters',
    );
    if (currentBeat === 0) {
      const move = cueProgress('ce-pack-order', 0);
      CONTEXT_REQUIRED.forEach((r, i) => {
        const rank = m.ordered.findIndex((v) => v.id === r.id),
          yy = 380 + (i + (rank - i) * move) * 140;
        drawCompleteRecord(
          ctx,
          api,
          r.id,
          [r.required ? 'required' : 'optional', r.units + ' units · priority' + r.priority],
          150,
          yy,
          590,
          r.required ? themeColors.yellow : themeColors.blue,
          115,
        );
        const xx = 1080;
        drawCompleteLine(ctx, api, 820, yy + 58, 1020, yy + 58, themeColors.muted, 2);
        drawCompleteRecord(
          ctx,
          api,
          'queue ' + (rank + 1),
          r.id,
          xx,
          380 + rank * 140,
          650,
          r.required ? themeColors.yellow : themeColors.blue,
          100,
        );
      });
    } else if (currentBeat === 1) {
      const qReq = cueProgress('ce-pack-600', 1),
        qRun = cueProgress('ce-pack-2400', 1);
      let used = 0;
      drawCompleteRectangle(ctx, api, x, y, w, 120, themeColors.panel, themeColors.muted, 2);
      drawCompleteText(ctx, api, '3,000 units', x + w, y - 8, 30, themeColors.yellow, 'right');
      for (const r of m.ordered.slice(0, 3)) {
        const q = r.required ? qReq : qRun,
          units = r.units * q;
        api.rect(
          ctx,
          x + used * scale,
          y,
          units * scale,
          120,
          r.required ? themeColors.yellow : themeColors.blue,
        );
        used += units;
      }
      drawCompleteText(ctx, api, 'alert 180 + trace 420', x, 730, 30, themeColors.yellow);
      drawCompleteText(ctx, api, 'runbook 1,800', x + 650, 730, 30, themeColors.blue);
      if (resultComplete('ce-pack-600', 1))
        drawCompleteText(ctx, api, 'required subtotal 600', x, 825, 31, themeColors.yellow);
      if (resultComplete('ce-pack-2400', 1))
        drawCompleteText(ctx, api, 'selected 2,400 / remaining 600', x, 895, 34, themeColors.green);
      const fail = resultComplete('ce-pack-error', 1);
      drawCompleteRecord(
        ctx,
        api,
        'full export 8,200',
        fail ? 'required=true → error; no request emitted' : 'optional → outside this packet',
        150,
        340,
        1530,
        fail ? themeColors.pink : themeColors.muted,
        100,
      );
      if (fail) {
        drawCompleteLine(ctx, api, x, y - 20, x + w, y + 140, themeColors.pink, 4);
        drawCompleteStatus(
          ctx,
          api,
          'Required-set failure stops assembly',
          x,
          985,
          themeColors.pink,
        );
      }
    } else {
      const segments = [
          ['instructions', 420, themeColors.blue],
          ['framing', 180, themeColors.cyan],
          ['output / reasoning', 1024, themeColors.yellow],
          ['evidence allocation', 2472, themeColors.green],
        ],
        barX = 180,
        barW = 1500;
      let xx = barX;
      segments.forEach(([label, units, color], i) => {
        const ww = (units / 4096) * barW;
        api.rect(ctx, xx, 390, ww, 110, color);
        drawCompleteText(ctx, api, label, 180 + i * 405, 590, 25, color);
        drawCompleteText(ctx, api, number(units), 180 + i * 405, 640, 32, color);
        xx += ww;
      });
      const visible = resultComplete('ce-pack-reserve', 2);
      drawCompleteText(
        ctx,
        api,
        visible ? '4,096 −420 −180 −1,024 =2,472' : 'allocated evidence budget: ?',
        180,
        750,
        37,
        themeColors.green,
      );
      drawCompleteRectangle(ctx, api, 180, 825, 1500, 90, themeColors.panel, themeColors.green, 2);
      if (visible) api.rect(ctx, 180, 825, (1500 * 2400) / 2472, 90, themeColors.blue);
      if (resultComplete('ce-pack-remaining', 2))
        drawCompleteText(ctx, api, '2,400 retained ·72 unused', 180, 985, 35, themeColors.yellow);
    }
    drawCompleteFooter(
      ctx,
      api,
      'Assigned units. Required membership, input validity and actual rendered request are checked separately.',
    );
  });
  return true;
}
export default {
  id: 'required-packer',
  draw: drawRequiredPacker,
  cues: [
    'ce-required-packer-1',
    'ce-pack-order',
    'ce-required-packer-2',
    'ce-pack-600',
    'ce-pack-2400',
    'ce-pack-error',
    'ce-required-packer-3',
    'ce-pack-reserve',
    'ce-pack-remaining',
  ],
};
