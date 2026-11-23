import { recipeLedger } from '../model.mjs';
import { CARD_GB, gbX, onWords } from '../card-memory.mjs';

const ranks = 16;
const weights = recipeLedger(70, ranks).full.weights;
const shard = weights / ranks;
const stripWidth = gbX(weights) - gbX(0);
const shardWidth = stripWidth / ranks;

function gpu(ctx, api, rank, y) {
  const { C } = api;
  const edge = gbX(CARD_GB);
  const left = 122;
  // The memory slot and the approaching weight strip use the same scale.
  api.rect(ctx, left, y - 59, edge - left, 220, C.panel, C.muted, 8);
  api.rect(ctx, left + 18, y - 36, 253, 173, C.bg, C.muted, 6);
  api.text(ctx, 'GPU ' + rank, left + 145, y + 12, 36, C.ink, 'center');
  api.text(ctx, CARD_GB + ' GB', left + 145, y + 83, 64, C.yellow, 'center');
  api.text(ctx, 'free', left + 145, y + 120, 31, C.yellow, 'center');
  for (let i = 0; i < 18; i++) {
    const x = left + 60 + i * 29 + (i >= 5 ? 15 : 0);
    api.rect(ctx, x, y + 162, 19, 20, C.yellow, undefined, 0);
  }
  api.rect(ctx, gbX(0), y, edge - gbX(0), 76, C.bg, C.yellow, 3);
  api.line(ctx, edge, y - 24, edge, y + 114, C.yellow, 6);
}

function replicas(ctx, api, state) {
  const { C } = api;
  const drop = api.phase(state.t ?? 0, -0.2, 2.4);
  const firstY = 522;
  const firstX = gbX(0) - 175 * (1 - drop);
  const tapeY = firstY - 232 * (1 - drop);
  const size = onWords(state, api, 0, 'weight-request', 0.48, 0.68);
  const over = onWords(state, api, 1, 'first-copy', 0, 0.16);
  const second = onWords(state, api, 1, 'second-copy', 0.2, 0.36);

  api.focus.target('first-rank', () => {
    gpu(ctx, api, 0, firstY);
    api.focus.target('request', () => {
      api.rect(ctx, firstX, tapeY, stripWidth, 76, C.blue, undefined, 0);
      api.text(ctx, '70B BF16 weights  ×  2 bytes', firstX + 23, tapeY + 51, 40, C.bg);
      if (size === 1)
        api.text(ctx, weights + ' GB of weights', gbX(0), firstY - 91, 48, C.blue);
    });
    if (over > 0) {
      api.rect(ctx, gbX(CARD_GB), firstY, (gbX(weights) - gbX(CARD_GB)) * over, 76, C.pink, undefined, 0);
      if (over === 1)
        api.text(ctx, (weights - CARD_GB) + ' GB over', gbX((weights + CARD_GB) / 2), firstY + 52, 43, C.bg, 'center');
    }
  });
  if (second > 0) api.focus.target('next-rank', () => {
    const y = 821;
    gpu(ctx, api, 1, y);
    const x = gbX(0);
    const top = y - 76 * (1 - second);
    api.rect(ctx, x, top, stripWidth, 76, C.blue, undefined, 0);
    api.text(ctx, 'Same ' + weights + ' GB copy', x + 23, top + 51, 40, C.bg);
    if (second === 1) {
      api.rect(ctx, gbX(CARD_GB), y, gbX(weights) - gbX(CARD_GB), 76, C.pink, undefined, 0);
      api.text(ctx, (weights - CARD_GB) + ' GB over', gbX((weights + CARD_GB) / 2), y + 52, 43, C.bg, 'center');
    }
  });
}

function distribute(ctx, api, state) {
  const { C } = api;
  const cut = onWords(state, api, 2, 'cut-replica', 0.04, 0.22);
  const deal = onWords(state, api, 2, 'deal-weights', 0.24, 0.39);
  const owned = onWords(state, api, 2, 'owned-weights', 0.4, 0.53);
  const origin = (1920 - stripWidth) / 2;
  api.focus.target('request', () => {
    api.text(ctx, 'One copy   ·   ' + weights + ' GB', origin, 292, 47, C.ink);
    api.line(ctx, origin, 317, origin + stripWidth, 317, C.muted, 2);
    if (deal === 0) {
      api.rect(ctx, origin, 327, stripWidth, 78, C.blue, undefined, 0);
      for (let i = 1; i < ranks && i <= cut * ranks; i++)
        api.line(ctx, origin + i * shardWidth, 327, origin + i * shardWidth, 405, C.bg, 4);
    }
  });
  api.focus.target('shard-distribution', () => {
    for (let i = 0; i < ranks; i++) {
      const center = 195 + i * 102;
      api.line(ctx, center - 43, 750, center + 43, 750, C.yellow, 5);
      api.text(ctx, 'GPU ' + i, center, 806, 26, C.ink, 'center');
    }
    if (deal > 0) {
      for (let i = 0; i < ranks; i++) {
        const from = origin + i * shardWidth;
        const to = 195 + i * 102 - shardWidth / 2;
        const y = 327 + (664 - 327) * deal;
        const x = from + (to - from) * deal;
        api.rect(ctx, x, y, shardWidth - 3, 78, C.blue, undefined, 0);
        api.text(ctx, i, x + shardWidth / 2, y + 51, 32, C.bg, 'center');
      }
    }
  });
  api.focus.target('owned-shard', () => {
    api.text(ctx, owned === 1 ? weights + ' GB ÷ ' + ranks + ' = ' + shard + ' GB of weights per GPU'
      : 'One piece for each of the ' + ranks + ' GPUs', 960, 993, 43, owned === 1 ? C.blue : C.ink, 'center');
  });
}

export function drawIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  if (state.beat < 2) replicas(ctx, api, state);
  else distribute(ctx, api, state);
}

export default {
  id: 'intro', draw: drawIntro,
  cues: ['weight-request', 'first-copy', 'second-copy', 'cut-replica', 'deal-weights', 'owned-weights'],
};
