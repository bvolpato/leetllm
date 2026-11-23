import { clamp } from '../arithmetic.mjs';
import { longContextModel, prefixReuseState } from '../construction.mjs';
import { contextText, footer, modelTarget, valueBar } from '../defaults.mjs';
export function drawCacheExecution(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('cache-execution', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      modelTarget(ctx, api, 'cache-execution', () =>
        contextText(
          ctx,
          api,
          'A hypothetical 64 GiB growing-KV budget',
          960,
          275,
          38,
          themeColors.cyan,
        ),
      );
      [40, 20].forEach((size, i) => {
        const x = 260,
          y = 410 + i * 245;
        valueBar(ctx, api, x, y, 1400, 64, 64, themeColors.panel, 115);
        const n = i ? 3 : 1;
        for (let j = 0; j < n; j++)
          api.rect(
            ctx,
            x + (j * 1400 * size) / 64 + 4,
            y + 4,
            (1400 * size) / 64 - 8,
            107,
            i ? themeColors.green : themeColors.blue,
            i ? themeColors.green : themeColors.blue,
            2,
          );
        contextText(
          ctx,
          api,
          (i ? 'one-byte' : 'two-byte') + ` · ${size} GiB each`,
          960,
          y + 175,
          37,
          i ? themeColors.green : themeColors.blue,
        );
      });
      footer(
        ctx,
        api,
        'Raw payload upper bound · reserve scales, pages, recurrent state, future output and headroom',
      );
    } else if (currentBeat === 1) {
      contextText(
        ctx,
        api,
        'Three logical requests · one retained exact prefix',
        960,
        270,
        37,
        themeColors.cyan,
      );
      const cue = state.cues?.['cp-prefix-reused-count'],
        reuse = cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : clamp(cue.progress)
          : progress,
        work = prefixReuseState(reuse),
        beforeCue = state.cues?.['cp-prefix-before-count'],
        showBefore = !beforeCue || beforeCue.phase === 'after';
      const ys = [395, 580, 765],
        x = 350,
        scale = 1000 / 49200;
      modelTarget(ctx, api, 'cache-execution', () =>
        work.suffixes.forEach((suffix, i) => {
          const y = ys[i],
            width = work.prefixWork[i] * scale;
          if (width > 0) {
            api.rect(ctx, x, y, width, 65, themeColors.panel, themeColors.blue, 3);
            if (i === 0 || reuse === 0)
              contextText(
                ctx,
                api,
                i === 0 ? '48,000 retained prefix' : '48,000 repeated prefill',
                x + width / 2,
                y + 44,
                29,
                themeColors.blue,
              );
          }
          api.rect(
            ctx,
            x + 48000 * scale + 8,
            y,
            suffix * scale,
            65,
            themeColors.green,
            themeColors.green,
            1,
          );
          contextText(
            ctx,
            api,
            'Q' + (i + 1) + ' · suffix ' + suffix,
            1550,
            y + 44,
            29,
            themeColors.green,
          );
        }),
      );
      if (reuse > 0) {
        api.line(ctx, 350, 427, 270, 427, themeColors.cyan, 3);
        api.line(ctx, 270, 427, 270, 863, themeColors.cyan, 3);
        [1, 2].forEach((i) => {
          const y = ys[i] + 98;
          api.line(ctx, 270, y, 1300, y, themeColors.cyan, 3);
          api.arrow(ctx, 1300, y, 1328, ys[i] + 70, themeColors.cyan, 3);
          contextText(ctx, api, 'reuse the same stored prefix', 850, y + 43, 28, themeColors.cyan);
        });
      }
      if (showBefore && reuse === 0)
        modelTarget(ctx, api, 'cache-execution', () =>
          contextText(
            ctx,
            api,
            'Without reuse: 146,600 newly prefilling tokens',
            960,
            940,
            38,
            themeColors.yellow,
          ),
        );
      else if (reuse >= 1)
        modelTarget(ctx, api, 'cache-execution', () =>
          contextText(
            ctx,
            api,
            '50,600 newly prefilling tokens · 96,000 repeated tokens avoided',
            960,
            965,
            34,
            themeColors.yellow,
          ),
        );
      else
        contextText(
          ctx,
          api,
          'Remove only repeated prefix work; keep all three suffixes',
          960,
          955,
          31,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        'All three requests retain their logical prefix context and still read it during decode.',
      );
    } else {
      contextText(
        ctx,
        api,
        'The retained prefix is still read during decode',
        960,
        285,
        38,
        themeColors.cyan,
      );
      const invalidCue = state.cues?.['cp-prefix-invalidate'],
        changed = invalidCue
          ? invalidCue.phase === 'before'
            ? 0
            : invalidCue.phase === 'after'
              ? 1
              : clamp(invalidCue.progress)
          : progress;
      [480, 960, 1440].forEach((x, i) => {
        contextText(ctx, api, 'Q' + (i + 1) + ' decode reader', x, 355, 30, themeColors.green);
        api.arrow(ctx, x, 385, x, 450, themeColors.green, 4);
      });
      for (let i = 0; i < 8; i++) {
        const x = 270 + i * 185,
          invalid = i < Math.ceil(changed * 8);
        api.rect(
          ctx,
          x,
          465,
          170,
          180,
          themeColors.panel,
          invalid ? themeColors.red : themeColors.blue,
          3,
        );
        contextText(
          ctx,
          api,
          invalid ? (i === 0 ? 'changed' : 'invalid') : 'prefix ' + i,
          x + 85,
          565,
          28,
          invalid ? themeColors.red : themeColors.blue,
        );
      }
      modelTarget(ctx, api, 'cache-execution', () =>
        contextText(
          ctx,
          api,
          changed >= 1
            ? 'An early-token mismatch invalidates downstream prefix matches'
            : 'All three queries read their retained prefix',
          960,
          805,
          34,
          changed >= 1 ? themeColors.red : themeColors.blue,
        ),
      );
      footer(
        ctx,
        api,
        'Cache identity and isolation must agree · eviction can remove the hit · durable transcript stays separate',
      );
    }
  }
}
export default {
  id: 'cache-execution',
  draw: drawCacheExecution,
  cues: [
    'cache-execution-0',
    'cache-execution-1',
    'cp-prefix-before-count',
    'cp-prefix-reused-count',
    'cache-execution-2',
    'cp-prefix-invalidate',
  ],
};
