import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const local = { type: 'integer', minimum: 0 };
const wire = { type: 'integer', description: 'at least 0' };
function accepts(rule, value) {
  return Number.isInteger(value) && (rule.minimum === undefined || value >= rule.minimum);
}
export function drawWireContract(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('retry-bound', () => {
    const copied = after(state, 'wire-copy');
    const checked = after(state, 'wire-check');
    const replaced = after(state, 'wire-replace');
    const originalSide = replaced ? wire : local;
    text(ctx, api, 'Completed candidate', 145, 267, 34, C.muted);
    code(ctx, api, '{"retry_count": -1}', 145, 371, 67);
    const columns = [
      [145, 'Host validator', originalSide],
      [1020, 'Sent to backend', copied ? wire : local],
    ];
    columns.forEach(([x, heading, schema], i) => {
      const active = i === 0 ? checked : after(state, 'wire-integer');
      const color = i === 0 ? C.yellow : C.cyan;
      text(ctx, api, heading, x, 515, 39, color);
      api.line(ctx, x, 545, x + 727, 545, color, 4);
      code(ctx, api, 'type: integer', x, 635, 45);
      code(
        ctx,
        api,
        schema.minimum === undefined ? 'description: at least 0' : 'minimum: 0',
        x,
        728,
        39,
        color,
      );
      if (active)
        text(
          ctx,
          api,
          accepts(schema, -1) ? 'Accepts −1' : 'Rejects −1',
          x,
          861,
          56,
          accepts(schema, -1) ? C.cyan : C.pink,
        );
    });
    if (replaced) text(ctx, api, 'Host now uses the wire schema too', 145, 965, 37, C.pink);
  });
}
export default {
  id: 'wire-contract',
  draw: drawWireContract,
  cues: ['wire-copy', 'wire-integer', 'wire-check', 'wire-replace'],
};
