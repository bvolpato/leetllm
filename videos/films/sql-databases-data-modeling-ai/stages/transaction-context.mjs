import { mix } from '../arithmetic.mjs';
import { directed, extendedSqlState } from '../construction.mjs';
import { drawSqlText, withSqlFade } from '../defaults.mjs';

export function drawTransactionContext(ctx, scene, state, api) {
  const { C } = api;
  const { first, duplicate, leave } = extendedSqlState('transaction-context', state);
  drawSqlText(
    ctx,
    api,
    'Two empty SQLite tables  /  unique key K  /  Python legacy transaction mode',
    960,
    265,
    29,
    C.muted,
    'center',
  );
  for (const [i, title] of ['Catch inside the block', 'Catch outside the block'].entries()) {
    const x = 125 + i * 875;
    const inside = i === 0;
    drawSqlText(ctx, api, title, x + 385, 350, 37, C.ink, 'center');
    api.rect(ctx, x, 389, 770, 253, C.panel, C.blue, 2, 8);
    drawSqlText(ctx, api, 'with conn', x + 25, 436, 28, C.blue);
    const handlerY = inside ? 594 : 750;
    api.focus.target('error-path', () => {
      drawSqlText(ctx, api, 'catch error', x + 40, handlerY, 27, C.muted);
      if (duplicate === 1) {
        const y = mix(481, handlerY - 10, leave);
        api.path(
          ctx,
          [
            { x: x + 278, y: 466 },
            { x: x + 278, y: handlerY - 10 },
            { x: x + 227, y: handlerY - 10 },
          ],
          { color: C.muted, width: 2 },
        );
        api.circle(ctx, x + 278, y, 10, C.pink, C.pink, 2);
      }
    });
    api.focus.target('key-inserts', () => {
      drawSqlText(ctx, api, 'Writes', x + 408, 437, 27, C.muted);
      if (duplicate > 0) {
        drawSqlText(
          ctx,
          api,
          duplicate === 1 ? 'K · duplicate' : 'K',
          x + 587,
          531,
          26,
          duplicate === 1 ? C.pink : C.ink,
        );
      }
      if (first > 0) {
        const y = inside ? mix(469, 856, leave) : 469;
        withSqlFade(ctx, api, first * (inside ? 1 : 1 - leave), () => {
          api.rect(ctx, x + 405, y, 130, 82, C.panel, C.cyan, 3, 8);
          drawSqlText(ctx, api, 'K', x + 470, y + 57, 43, C.ink, 'center');
        });
      }
    });
    api.focus.target('transaction-exit', () => {
      drawSqlText(ctx, api, 'After the block exits', x + 25, 825, 28, C.muted);
      api.line(ctx, x + 20, 949, x + 756, 949, C.muted, 2);
      if (leave === 1 && directed(state, 'compare-k-rows', 1, 0.68, 0.88) === 1)
        drawSqlText(
          ctx,
          api,
          inside ? '1 row committed' : '0 rows after rollback',
          x + 25,
          914,
          32,
          inside ? C.cyan : C.ink,
        );
    });
  }
}

export default {
  id: 'transaction-context',
  draw: drawTransactionContext,
  cues: ['insert-first-k', 'attempt-second-k', 'leave-with-blocks', 'compare-k-rows'],
};
