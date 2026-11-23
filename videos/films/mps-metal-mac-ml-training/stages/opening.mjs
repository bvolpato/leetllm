import { classNames, dimensions } from '../fixtures.mjs';
import { fixed } from '../arithmetic.mjs';
import { full } from '../model.mjs';
import { extensionCode, target, text, withMpsRootFrame } from '../defaults.mjs';

export function paintTicketCall(ctx, api, C, { pool, travel, device, verdict }) {
  const placed = device === 'mps:0';
  const color = placed ? C.cyan : C.blue;
  target(ctx, api, 'mean-call', () => {
    extensionCode(ctx, api, C, 'pooled = batch.mean(dim=1)', 485, 270, 44);
  });
  target(ctx, api, 'score-call', () => {
    extensionCode(ctx, api, C, 'scores = model(pooled)', 1470, 270, 44);
  });

  target(ctx, api, 'batch-device', () => {
    extensionCode(ctx, api, C, 'batch.device', 488, 404, 36, color);
    extensionCode(ctx, api, C, device, 488, 529, 108, color);
  });
  const originX = 282, rowY = 650, pitch = 26;
  const drawRow = (x, y, ink) => {
    for (let j = 0; j < dimensions.features; j++)
      api.rect(ctx, x + j * pitch, y, 21, 16, ink, undefined, 2);
  };
  const sourceY = (row) => rowY + (row - (dimensions.positions - 1) / 2) * 27;
  // The mean creates another tensor. Keep the source matrix in place as its rows converge.
  if (pool > 0) {
    ctx.save();
    ctx.globalAlpha *= 0.24;
    for (let i = 0; i < dimensions.positions; i++) drawRow(originX, sourceY(i), color);
    ctx.restore();
  }
  const vectorX = originX + 529 * travel;
  target(ctx, api, 'ticket-journey', () => {
    const rows = pool === 1 ? 1 : dimensions.positions;
    for (let i = 0; i < rows; i++)
      drawRow(vectorX, sourceY(i) * (1 - pool) + rowY * pool, color);
    if (pool === 1)
      extensionCode(ctx, api, C, 'pooled.device → ' + device, vectorX + 205, 828, 32, color);
  });

  target(ctx, api, placed ? 'accepted-forward' : 'weight-device', () => {
    const left = 1278, width = 485;
    for (let i = 0; i < 8; i++) {
      const y = 388 + i * 48;
      api.line(ctx, left - 20, y, left, y, C.cyan, 5);
      api.line(ctx, left + width, y, left + width + 20, y, C.cyan, 5);
    }
    api.rect(ctx, left, 335, width, 432, C.panel, C.cyan, 22);
    extensionCode(ctx, api, C, 'model.weight.device', 1520, 404, 33, C.cyan);
    extensionCode(ctx, api, C, 'mps:0', 1520, 529, 98, C.cyan);
    for (let k = 0; k < dimensions.classes; k++) {
      const y = 586 + k * 47;
      for (let j = 0; j < dimensions.features; j++)
        api.rect(ctx, 1323 + j * 25, y, 20, 27, C.cyan, undefined, 2);
    }
  });
  if (!verdict) return;
  if (placed) {
    target(ctx, api, 'accepted-forward', () => {
      api.arrow(ctx, 1229, rowY + 8, 1266, rowY + 8, C.green, 5);
      classNames.forEach((name, i) => {
        text(ctx, api, C, name + '   ' + fixed(full.logits[0][i]), 420 + i * 540, 921, 46, C.cyan, 'center');
      });
    });
  } else {
    target(ctx, api, 'device-mismatch', () => {
      api.line(ctx, 1240, rowY - 47, 1240, rowY + 63, C.pink, 9);
      text(ctx, api, C, 'DEVICE MISMATCH', 1520, 852, 43, C.pink, 'center');
    });
  }
}

export function paintOpening(ctx, scene, state, api, C, c, t, s) {
  paintTicketCall(ctx, api, C, { ...s, device: 'cpu', verdict: s.blocked });
  if (!s.blocked && s.travel === 1)
    text(ctx, api, C, 'Will this call succeed?', 960, 949, 52, C.yellow, 'center');
  if (s.repair)
    target(ctx, api, 'placement-fix', () => {
      text(ctx, api, C, 'Before retrying', 335, 973, 37, C.ink);
      extensionCode(ctx, api, C, 'batch = batch.to(model.weight.device)', 1120, 973, 43, C.cyan);
    });
}

export function drawOpeningStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintOpening);
}
export default {
  id: 'opening',
  draw: drawOpeningStage,
  cues: ['opening-mean', 'opening-linear', 'opening-score-line', 'failed-call', 'opening-repair'],
};
