import { contractText, cueComplete, footer, rectangle } from '../defaults.mjs';
export function drawRequestWaves(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('request-waves-mechanism', () => {
    if (currentBeat === 0) {
      contractText(
        ctx,
        api,
        'Run nodes and model requests have different units',
        960,
        285,
        35,
        themeColors.yellow,
      );
      const levels = Array.from(
          {
            length: 4,
          },
          (_, i) => 4 ** i,
        ),
        controllers = levels.slice(0, 3).reduce((a, b) => a + b, 0),
        leaves = levels[3];
      levels.forEach((n, row) => {
        const y = 390 + row * 130;
        contractText(ctx, api, 'level ' + row, 280, y + 38, 29, themeColors.muted);
        for (let i = 0; i < n; i++)
          rectangle(
            ctx,
            api,
            450 + i * 20,
            y,
            14,
            50,
            row < 3 ? themeColors.blue : themeColors.cyan,
          );
        contractText(
          ctx,
          api,
          String(n),
          1800,
          y + 38,
          32,
          row < 3 ? themeColors.blue : themeColors.cyan,
        );
      });
      if (cueComplete(ctx, api, 'run-tree'))
        contractText(
          ctx,
          api,
          controllers +
            ' controllers + ' +
            leaves +
            ' leaves = ' +
            (controllers + leaves) +
            ' runs',
          960,
          925,
          35,
          themeColors.blue,
        );
      if (cueComplete(ctx, api, 'run-requests'))
        contractText(
          ctx,
          api,
          controllers + ' × 31 + ' + leaves + ' = ' + (controllers * 31 + leaves) + ' requests',
          960,
          975,
          34,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const concurrency = cueComplete(ctx, api, 'waves-four')
        ? 4
        : cueComplete(ctx, api, 'waves-two')
          ? 2
          : 1;
      contractText(ctx, api, 'Same eight independent requests', 960, 290, 37, themeColors.blue);
      for (let wave = 0; wave < 8; wave++) {
        const x = 375 + wave * 190;
        contractText(ctx, api, 'Wave ' + (wave + 1), x, 400, 30, themeColors.muted);
      }
      for (let slot = 0; slot < concurrency; slot++) {
        contractText(ctx, api, 'Slot ' + (slot + 1), 155, 521 + slot * 91, 30, themeColors.muted);
      }
      for (let i = 0; i < 8; i++) {
        const x = 375 + Math.floor(i / concurrency) * 190;
        const y = 475 + (i % concurrency) * 91;
        api.rect(ctx, x - 78, y, 156, 65, themeColors.panel, themeColors.cyan, 8);
        contractText(ctx, api, 'Call ' + (i + 1), x, y + 45, 31, themeColors.cyan);
      }
      contractText(
        ctx,
        api,
        'concurrency ' + concurrency + ' · requests 8 · ideal waves ' + Math.ceil(8 / concurrency),
        960,
        925,
        36,
        themeColors.yellow,
      );
    } else {
      const { C, focus } = api;
      const answer = currentBeat === 3;
      const at = (id, from, to) =>
        focus.progress(id, answer ? api.phase(state.beatP, from, to) : 0);
      const promised = at('race-stale', 0, 0.05);
      const locked = at('race-lock', 0.18, 0.35) > 0;
      const first = at('first-reservation', 0.36, 0.45);
      const checked = at('remaining-balance', 0.46, 0.55) === 1;
      const workers = 4;
      const balance = 20;
      const price = 15;
      const left = 240;
      const scale = 1440 / (workers * price);
      const limit = left + scale * balance;
      contractText(
        ctx,
        api,
        locked ? 'Check and reserve under one lock' : 'Four workers read the same balance',
        960,
        300,
        49,
        C.ink,
      );
      for (let i = 0; i < workers; i++) {
        const x = left + (i + 0.5) * price * scale;
        contractText(ctx, api, 'Worker ' + (i + 1), x, 398, 32, C.muted);
        const status =
          i === 0 && first === 1 ? ' reserved' : i > 0 && checked ? ' refused' : ' requested';
        contractText(
          ctx,
          api,
          price + '¢' + status,
          x,
          464,
          37,
          i > 0 && checked ? C.pink : C.cyan,
        );
      }

      api.line(ctx, left, 765, left + 1440, 765, C.muted, 3);
      contractText(ctx, api, 'Shared balance  ' + balance + '¢', limit, 574, 39, C.yellow);
      for (let i = 0; i < workers; i++) {
        const progress = locked ? (i === 0 ? first : 0) : api.clamp(promised * workers - i);
        if (progress <= 0) continue;
        const x = left + price * scale * i;
        rectangle(ctx, api, x, 622, (price * scale - 4) * progress, 140, C.cyan);
        if (progress === 1)
          contractText(ctx, api, price + '¢', x + (price * scale) / 2, 718, 51, C.bg);
      }
      api.line(ctx, limit, 596, limit, 782, C.yellow, 5);
      const result = locked
        ? checked
          ? price + '¢ reserved   /   ' + (balance - price) + '¢ left'
          : 'Balance available to the next worker'
        : promised === 1
          ? workers + ' × ' + price + '¢ = ' + workers * price + '¢ promised'
          : 'How much could the four workers promise?';
      contractText(
        ctx,
        api,
        result,
        960,
        924,
        46,
        locked && checked ? C.green : promised === 1 && !locked ? C.pink : C.ink,
      );
    }
    if (currentBeat === 1) footer(ctx, api, 'Each wave lasts one equal-duration request');
  });
}
export default {
  id: 'request-waves',
  draw: drawRequestWaves,
  cues: [
    'run-tree',
    'run-requests',
    'waves-two',
    'waves-four',
    'race-stale',
    'race-lock',
    'first-reservation',
    'remaining-balance',
  ],
};
