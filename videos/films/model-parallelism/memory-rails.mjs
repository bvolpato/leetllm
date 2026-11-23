import { weightLedger } from './arithmetic.mjs';

const ledger = weightLedger();
export const deviceGB = ledger.capacity / 1e9;
export const reserveGB = ledger.reserve / 1e9;
export const checkpointGB = ledger.payload / 1e9;
export const halfGB = checkpointGB / 2;
export const poolGB = deviceGB - reserveGB - halfGB;
const origin = 360;
const pixelsPerGB = 15;
const barHeight = 98;
export const gpuRows = [365, 610];
export const atGB = (gb) => origin + pixelsPerGB * gb;

export function memoryBlock(ctx, api, start, y, gb, color, label = '') {
  if (gb <= 0) return;
  const width = gb * pixelsPerGB;
  api.rect(ctx, atGB(start), y, width, barHeight, color, undefined, 0);
  if (label) api.text(ctx, label, atGB(start) + width / 2, y + 63, 36, api.C.bg, 'center');
}

export function memoryRail(ctx, api, rank, y, label = `GPU ${rank}`) {
  api.text(ctx, label, origin - 40, y + 65, 42, api.C.ink, 'right');
  api.rect(ctx, origin, y, deviceGB * pixelsPerGB, barHeight, api.C.panel, api.C.muted, 0);
  memoryBlock(ctx, api, 0, y, reserveGB, api.C.muted, `${reserveGB} GB held`);
  api.line(ctx, atGB(deviceGB), y - 24, atGB(deviceGB), y - 3, api.C.yellow, 5);
  api.line(
    ctx,
    atGB(deviceGB),
    y + barHeight + 3,
    atGB(deviceGB),
    y + barHeight + 24,
    api.C.yellow,
    5,
  );
}

export function limitLabel(ctx, api) {
  api.text(
    ctx,
    `${deviceGB} GB limit`,
    atGB(deviceGB),
    gpuRows[0] - 46,
    37,
    api.C.yellow,
    'center',
  );
}
