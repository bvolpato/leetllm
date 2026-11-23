import { clamp } from '../arithmetic.mjs';
import { chapterModel } from '../construction.mjs';
import { meanVisible } from '../model.mjs';
import { chapterText, note, operation } from '../defaults.mjs';
export function drawCacheStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('cache-step', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    const cue = (name, fallback) => (state.cues ? api.focus.progress(name, 0) : fallback);
    const write = currentBeat === 0 ? cue('cache-write', clamp((progress - 0.4) / 0.25)) : 1,
      advance = currentBeat > 0 || cue('cache-advance', progress) > 0.8;
    const length = write > 0.95 ? 2 : 1;
    chapterText(
      ctx,
      api,
      currentBeat === 1
        ? 'Stale cursor 1 must not overwrite valid position 1'
        : 'The request owns its logical position and physical locations',
      960,
      275,
      35,
      themeColors.cyan,
    );
    if (currentBeat < 2)
      for (let head = 0; head < 2; head++)
        for (let kind = 0; kind < 2; kind++) {
          const x = 280 + head * 800,
            y = 490 + kind * 170;
          chapterText(
            ctx,
            api,
            (kind ? 'V' : 'K') + ' · KV' + head,
            x - 85,
            y + 55,
            32,
            kind ? themeColors.green : themeColors.blue,
          );
          for (let pos = 0; pos < 2; pos++) {
            api.rect(
              ctx,
              x + pos * 220,
              y,
              190,
              105,
              themeColors.panel,
              pos < length ? (kind ? themeColors.green : themeColors.blue) : themeColors.muted,
              3,
            );
            chapterText(
              ctx,
              api,
              pos < length ? 'position ' + pos : 'free',
              x + pos * 220 + 95,
              y + 64,
              28,
              pos < length ? themeColors.ink : themeColors.muted,
            );
          }
          if (currentBeat === 0) {
            const sourceX = x + 470,
              targetX = x + 394,
              sourceY = kind ? 810 : 385,
              targetY = y + 85,
              atX = sourceX + (targetX - sourceX) * write,
              atY = sourceY + (targetY - sourceY) * write;
            api.circle(
              ctx,
              atX,
              atY,
              15,
              kind ? themeColors.green : themeColors.blue,
              kind ? themeColors.green : themeColors.blue,
              2,
            );
          }
        }
    if (currentBeat === 1) {
      api.arrow(ctx, 730, 820, 600, 780, themeColors.red, 5);
      operation(ctx, api, 'cache-step', () =>
        chapterText(
          ctx,
          api,
          'REJECT: cursor 1 ≠ current length 2',
          1130,
          875,
          39,
          themeColors.red,
        ),
      );
    } else if (currentBeat === 0) {
      const rotating = cue('cache-rotate', clamp((progress - 0.15) / 0.25)),
        read = cue('cache-read', clamp((progress - 0.65) / 0.2));
      chapterText(ctx, api, 'current hidden → 8 Q · 2 K · 2 V', 960, 345, 32, themeColors.cyan);
      [0, 1].forEach((i) => {
        const cx = 850 + i * 220,
          cy = 400,
          angle = rotating * Math.PI * 0.35;
        api.circle(ctx, cx, cy, 36, 'transparent', themeColors.muted, 1);
        api.arrow(
          ctx,
          cx,
          cy,
          cx + 30 * Math.cos(angle),
          cy - 30 * Math.sin(angle),
          themeColors.blue,
          3,
        );
        chapterText(ctx, api, i ? 'K: RoPE(1)' : 'Q: RoPE(1)', cx, cy + 70, 25, themeColors.blue);
      });
      chapterText(ctx, api, 'V unchanged', 1390, 420, 29, themeColors.green);
      if (read > 0)
        for (let head = 0; head < 2; head++)
          for (let pos = 0; pos < 2; pos++)
            api.rect(
              ctx,
              275 + head * 800 + pos * 220,
              485,
              200,
              115,
              'transparent',
              themeColors.yellow,
              3,
            );
      operation(ctx, api, 'cache-step', () =>
        chapterText(
          ctx,
          api,
          advance
            ? 'Read positions 0 and 1 · cursor = 2'
            : write > 0.95
              ? 'New K/V stored at position 1 · cursor = 1'
              : 'Rotate Q/K; route new K/V into position 1',
          960,
          875,
          36,
          themeColors.yellow,
        ),
      );
    } else {
      [
        ['A', [1, 2]],
        ['B', [1, 2, 3, 4]],
      ].forEach(([id, values], r) => {
        chapterText(
          ctx,
          api,
          'request ' + id + ' · length ' + values.length,
          375,
          430 + r * 240,
          31,
          themeColors.blue,
        );
        values.forEach((v, i) => {
          api.rect(
            ctx,
            700 + i * 190,
            370 + r * 240,
            150,
            115,
            themeColors.panel,
            themeColors.green,
            2,
          );
          chapterText(ctx, api, v, 775 + i * 190, 440 + r * 240, 40, themeColors.green);
        });
        if (progress > 0.45)
          chapterText(
            ctx,
            api,
            'cached = full prefix = ' + meanVisible(values),
            1230,
            535 + r * 240,
            33,
            themeColors.yellow,
          );
      });
      operation(ctx, api, 'cache-step', () =>
        chapterText(
          ctx,
          api,
          'Separate zero-score toy prefixes preserve request identity',
          960,
          900,
          34,
          themeColors.yellow,
        ),
      );
    }
    note(
      ctx,
      api,
      currentBeat === 2
        ? 'Carry request IDs through scheduler reorder; compare every cached step with its own full prefix'
        : 'Logical position and dense/paged/sliding/latent physical offsets are different objects',
    );
  }
}
export default {
  id: 'cache-step',
  draw: drawCacheStep,
  cues: [
    'cache-step-0',
    'cache-rotate',
    'cache-write',
    'cache-read',
    'cache-advance',
    'cache-step-1',
    'cache-step-2',
  ],
};
