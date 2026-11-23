import { ranked } from './construction.mjs';
import { rankScore, sourceIdentity } from './arithmetic.mjs';
import { SHORT } from './fixtures.mjs';
import { drawRecommendationColor } from './defaults.mjs';

export function drawReserve(
  ctx,
  api,
  { target, blocked, placements, title = 'Reserve in score order' },
) {
  const { C } = api;
  api.focus.target(target, () => {
    api.text(ctx, title, 120, 252, 38, C.ink);
    api.text(ctx, 'Page', 172, 329, 28, C.muted);
    api.text(ctx, 'Score', 653, 329, 28, C.muted, 'right');
    api.text(ctx, 'Source', 722, 329, 28, C.muted);
    if (placements) api.text(ctx, 'Slot', 968, 329, 28, C.muted, 'center');
    for (const [i, page] of ranked.entries()) {
      const y = 415 + 91 * i,
        denied = page.id === blocked;
      const color = denied ? C.muted : drawRecommendationColor(ctx, api, C, page);
      api.text(ctx, denied ? '×' : String(i + 1), 119, y, 34, denied ? C.red : C.muted);
      api.text(ctx, SHORT[page.id], 172, y, 39, color);
      api.text(ctx, rankScore(page).toFixed(3), 653, y, 34, color, 'right');
      api.text(ctx, sourceIdentity(page.id), 722, y, 32, color);
      const slot = placements?.indexOf(page.id) ?? -1;
      if (slot >= 0) api.text(ctx, String(slot + 1), 968, y, 33, C.green, 'center');
    }
    if (blocked) api.text(ctx, SHORT[blocked] + ' access revoked', 122, 896, 32, C.red);
  });
}

export function drawSlots(
  ctx,
  api,
  { title, entries, target, thirdTarget, question = '', questionSlot = 2, platformUsed },
) {
  const { C } = api;
  api.focus.target(target, () => {
    api.text(ctx, title, 1072, 252, 38, C.ink);
    api.text(ctx, '3 slots   ·   cap 2 per source', 1072, 316, 29, C.muted);
    if (platformUsed !== undefined) {
      api.text(ctx, 'Platform', 1515, 316, 28, C.muted);
      for (let i = 0; i < 2; i++) {
        api.circle(ctx, 1680 + 42 * i, 305, 12, i < platformUsed ? C.blue : C.bg, C.blue, 2);
      }
    }
    for (let i = 0; i < 3; i++) {
      const paint = () => {
        const y = 361 + 147 * i;
        const entry = entries[i];
        const opacity = entry?.opacity ?? 1;
        const doc = entry?.page;
        api.rect(
          ctx,
          1072,
          y,
          718,
          116,
          C.panel,
          i === questionSlot && question ? C.yellow : C.muted,
          12,
        );
        api.text(ctx, String(i + 1), 1100, y + 76, 36, C.muted);
        if (doc && opacity > 0) {
          ctx.save();
          ctx.globalAlpha *= opacity;
          const x = 1190 + 46 * (1 - opacity);
          api.text(ctx, SHORT[doc.id], x, y + 73, 43, drawRecommendationColor(ctx, api, C, doc));
          api.text(ctx, 'grade ' + doc.relevance, 1759, y + 73, 29, C.muted, 'right');
          ctx.restore();
        } else if (question && i === questionSlot) {
          api.text(ctx, '?', 1432, y + 82, 58, C.yellow, 'center');
        }
      };
      if (i === 2 && thirdTarget) api.focus.target(thirdTarget, paint);
      else paint();
    }
    if (question) api.text(ctx, question, 1072, 857, 32, C.yellow);
  });
}
