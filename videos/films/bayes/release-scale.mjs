import { text } from './defaults.mjs';
import { releasePolicy } from './fixtures.mjs';

const { requiredMass } = releasePolicy;
export const percent = (value) => (100 * value).toFixed(1) + '%';

export function massRuler(ctx, api, { x, y, width, mass, low = 0, reference }) {
  const { C } = api;
  const position = (value) => x + (width * (value - low)) / (1 - low);
  const gate = position(requiredMass);
  api.rect(ctx, x, y, width, 15, C.panel, C.muted, 2, 0);
  if (mass != null && mass > low) {
    api.rect(ctx, x, y, position(mass) - x, 15, C.blue, undefined, 0, 0);
    api.circle(ctx, position(mass), y + 7.5, 9, C.blue);
  }
  if (reference != null) {
    const start = position(reference);
    api.line(ctx, start, y + 18, start, y + 39, C.muted, 3);
    text(ctx, api, 'Before ' + percent(reference), start, y + 74, 25, C.muted, 'center');
  }
  api.line(ctx, gate, y - 18, gate, y + 25, C.yellow, 4);
  text(
    ctx,
    api,
    Math.round(100 * requiredMass) + '% required',
    gate,
    y - 35,
    26,
    C.yellow,
    'right',
  );
  text(ctx, api, Math.round(low * 100) + '%', x, y + 57, 25, C.muted);
  text(ctx, api, '100%', x + width, y + 57, 25, C.muted, 'right');
}
