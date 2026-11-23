import { drawChapterBar, drawChapterFooter, drawChapterText } from '../defaults.mjs';
export function drawCacheWrite(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-cache-write-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  const money = (n, digits = 5) => '$' + n.toFixed(digits);
  api.focus.target('te-cache-write-mechanism', () => {
    const later = currentBeat === 2;
    drawChapterText(
      ctx,
      api,
      'GPT-5.6 Terra · separate dated Standard example',
      960,
      300,
      33,
      themeColors.yellow,
    );
    drawChapterText(ctx, api, 'Same prefix P1 · 1,280 tokens', 960, 365, 31, themeColors.ink);
    const cats = [
      {
        name: 'Ordinary',
        tokens: 520,
        rate: 2,
        color: themeColors.cyan,
      },
      {
        name: later ? 'Read P1' : 'Write P1',
        tokens: 1280,
        rate: later ? 0.2 : 2.5,
        color: themeColors.yellow,
      },
      {
        name: 'Output',
        tokens: 180,
        rate: 12,
        color: themeColors.pink,
      },
    ];
    cats.forEach((r, i) => {
      const x = 220 + i * 565;
      drawChapterText(ctx, api, r.name, x + 200, 470, 33, r.color);
      drawChapterText(ctx, api, r.tokens + ' × $' + r.rate + ' / 10⁶', x + 200, 555, 30, r.color);
      const cost = (r.tokens * r.rate) / 1e6;
      const write = (1280 * 2.5) / 1e6;
      const amount =
        currentBeat === 0 ? cost * u : later && i === 1 ? write + (cost - write) * u : cost;
      drawChapterBar(ctx, api, x, 620, 400, 70, amount / 0.0032, r.color);
      if (currentBeat > 0 && (!later || i !== 1 || done))
        drawChapterText(ctx, api, money(cost, 6), x + 200, 760, 36, r.color);
    });
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        '30-minute write = 1.25 × ordinary rate',
        960,
        850,
        35,
        themeColors.yellow,
      );
      drawChapterFooter(
        ctx,
        api,
        'Write price includes the written tokens’ input processing; do not add ordinary input again.',
      );
    } else if (currentBeat === 1) {
      if (done)
        drawChapterText(ctx, api, 'First call: $0.006400', 960, 900, 43, themeColors.yellow);
      drawChapterFooter(ctx, api, '520 ordinary + 1,280 write = 1,800 total input.');
    } else {
      if (done) {
        drawChapterText(ctx, api, 'Read call: $0.003456', 960, 850, 37, themeColors.yellow);
        drawChapterText(
          ctx,
          api,
          'Write + read $0.009856 · no-cache pair $0.011520',
          960,
          925,
          32,
          themeColors.green,
        );
      } else
        drawChapterText(
          ctx,
          api,
          'Reuse the same P1 prefix, preserving ordinary and output charges',
          960,
          880,
          28,
          themeColors.muted,
        );
      drawChapterFooter(
        ctx,
        api,
        done
          ? 'A write that is never read adds cost; this pair saves $0.001664.'
          : 'Reuse the same paid prefix; finish both receipt totals before comparing.',
      );
    }
  });
}
export default {
  id: 'cache-write',
  draw: drawCacheWrite,
  cues: ['te-cache-write-0', 'te-cache-write-1', 'te-cache-write-2'],
};
