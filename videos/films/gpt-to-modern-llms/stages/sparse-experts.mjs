import { phraseEnded, phraseProgress } from '../arithmetic.mjs';
import { expertInputs, routeExperts } from '../workload.mjs';
import { card, text } from '../defaults.mjs';

export function drawSparseExperts(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  if (b < 3) {
    const swapped = b > 1 || (b === 1 && phraseEnded(state, 'swap-token', 0.24));
    const input = expertInputs[Number(swapped)];
    const routes = routeExperts(input.logits);
    const showRoute =
      b === 0
        ? phraseProgress(state, 'route-import', 0.28, 0.63) > 0
        : b === 1
          ? !swapped
          : phraseEnded(state, 'route-assertion', 0.4);
    text(ctx, api, 'Router scores for one token', 225, 330, 34, C.muted);
    api.focus.target('route-token', () =>
      card(ctx, api, input.token, 235, 515, 310, 116, C.yellow, 46),
    );
    const startX = 560;
    const top = 371;
    api.focus.target('expert-banks', () => {
      for (let i = 0; i < 4; i++) {
        const y = top + i * 142;
        const chosen = showRoute && routes.find((r) => r.id === i);
        const color = chosen ? C.yellow : C.muted;
        if (chosen) api.line(ctx, startX, 573, 873, y + 48, C.yellow, 4);
        card(ctx, api, 'E' + i, 895, y, 190, 96, color, 40);
        text(ctx, api, input.logits[i].toFixed(1), 1135, y + 63, 41, C.ink);
        if (chosen) {
          api.rect(ctx, 1340, y + 34, chosen.share * 320, 30, C.cyan, null, 2);
          text(ctx, api, chosen.share.toFixed(3), 1700, y + 63, 33, C.cyan);
        }
      }
    });
    text(ctx, api, 'Logit', 1135, 319, 30, C.muted);
    text(ctx, api, 'Output share', 1340, 319, 30, C.muted);
    text(
      ctx,
      api,
      showRoute
        ? 'Weighted sum of the two selected outputs'
        : 'Which two outputs will enter the sum?',
      960,
      995,
      40,
      C.ink,
      'center',
    );
    return;
  }

  const bytes = 2,
    active = 13,
    total = 47,
    capacity = 32;
  const x = 340,
    width = 1260,
    y = 582;
  const pos = (gb) => x + (width * gb) / 100;
  const revealed = b > 4 || (b === 4 && phraseEnded(state, 'resident-total', 0.36));
  const activeGB = active * bytes,
    totalGB = total * bytes;
  text(
    ctx,
    api,
    'Mixtral 8×7B  ·  rounded counts  ·  8 experts per layer, 2 selected',
    960,
    280,
    33,
    C.muted,
    'center',
  );
  text(ctx, api, '47B total weights    ×    2 bytes per weight', 960, 390, 47, C.ink, 'center');
  text(ctx, api, 'One GPU  ·  32 GB', pos(capacity), 491, 35, C.yellow, 'center');
  api.focus.target('weight-budget', () => {
    api.line(ctx, x, y + 70, pos(100), y + 70, C.muted, 2);
    if (revealed) api.rect(ctx, x, y, pos(totalGB) - x, 61, C.blue, null, 2);
    api.rect(ctx, x, y, pos(activeGB) - x, 61, C.cyan, null, 2);
    api.line(ctx, pos(capacity), y - 59, pos(capacity), y + 82, C.yellow, 4);
    text(ctx, api, '13B active  ·  ' + activeGB + ' GB', x, 755, 41, C.cyan);
    if (revealed) text(ctx, api, totalGB + ' GB resident', pos(totalGB), 755, 41, C.blue, 'right');
  });
  text(
    ctx,
    api,
    revealed
      ? 'Raw weights alone exceed capacity by ' + (totalGB - capacity) + ' GB'
      : 'Can this worker keep the whole checkpoint on its GPU?',
    960,
    946,
    42,
    revealed ? C.pink : C.ink,
    'center',
  );
}
export default {
  id: 'sparse-experts',
  draw: drawSparseExperts,
  cues: [
    'route-import',
    'swap-token',
    'new-token',
    'route-assertion',
    'active-bytes',
    'resident-total',
    'full-budget',
  ],
};
