import { text } from './defaults.mjs';
import { answer, tables, seats, extras } from './fixtures.mjs';

function chair(ctx, api, x, y, back, color) {
  api.rect(ctx, x - 17, y - 10, 34, 20, color, undefined, 5);
  const backY = back === 'top' ? y - 17 : y + 13;
  api.rect(ctx, x - 18, backY, 36, 5, color, undefined, 2);
}

export function roomPlan(ctx, api, tableProgress = 1, wallProgress = 1) {
  const { C } = api;
  api.rect(ctx, 110, 246, 850, 590, C.panel, C.muted, 18);
  api.focus.target('tables', () => {
    const counted = Math.round(tables * seats * tableProgress);
    for (let t = 0; t < tables; t++) {
      const x = 208 + (t % 2) * 376;
      const y = 345 + Math.floor(t / 2) * 184;
      api.rect(ctx, x, y, 278, 74, C.blue, undefined, 16);
      for (let k = 0; k < seats; k++) {
        const top = k < 4;
        chair(
          ctx,
          api,
          x + 37 + (k % 4) * 68,
          top ? y - 24 : y + 98,
          top ? 'top' : 'bottom',
          t * seats + k < counted ? C.blue : C.muted,
        );
      }
    }
  });
  api.focus.target('wall', () => {
    api.line(ctx, 151, 766, 919, 766, C.muted, 4);
    for (let i = 0; i < extras; i++) {
      const counted = i < Math.round(extras * wallProgress);
      chair(ctx, api, 183 + i * 64, 736, 'bottom', counted ? C.yellow : C.muted);
    }
    text(
      ctx,
      api,
      wallProgress === 1 ? '12 along the wall' : 'Wall',
      535,
      812,
      30,
      C.muted,
      'center',
    );
  });
}

export function verifiedChairs(pool) {
  return pool.filter((n) => n === answer);
}
