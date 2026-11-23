import { vec } from './arithmetic.mjs';
import { rect, text } from './defaults.mjs';

export const packedX = 170;
export const incomingX = 1300;
export const rowY = (index) => 347 + index * 111;

export function assignmentTicket(ctx, api, row, x, y, hot = false) {
  const { C } = api;
  const color = hot ? C.cyan : C.muted;
  rect(ctx, api, x, y, 435, 78, C.panel, color, 10);
  text(ctx, api, 'E' + row.expert, x + 38, y + 52, 37, C.ink, 'left', 'mono');
  text(ctx, api, 't' + row.token, x + 162, y + 52, 37, color, 'left', 'mono');
  text(ctx, api, '×' + row.gate, x + 271, y + 52, 33, color, 'left', 'mono');
}

export function inputLine(ctx, api, inputs) {
  const entries = inputs.map((v, i) => 't' + i + '  ' + vec(v));
  text(ctx, api, 'Input vectors', 170, 989, 30, api.C.muted);
  entries.forEach((entry, i) =>
    text(ctx, api, entry, 494 + 414 * i, 989, 35, api.C.ink, 'left', 'mono'),
  );
}
