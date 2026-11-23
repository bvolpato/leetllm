import {
  drawFooter,
  drawHeading,
  drawLine,
  drawRectangle,
  drawTag,
  drawText,
  interpolateScalar,
} from '../defaults.mjs';
export function drawSnapshotClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-snapshot-clock-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-snapshot-clock-mechanism', () => {
    const current =
      currentBeat === 0
        ? resultComplete('newer', 0)
          ? 43
          : resultComplete('mismatch', 0)
            ? 41
            : 42
        : 42;
    drawHeading(ctx, api, 'Required authoritative version: 42');
    drawTag(
      ctx,
      api,
      'Fetched snapshot version',
      current,
      170,
      365,
      620,
      current === 42 ? themeColors.blue : themeColors.pink,
    );
    drawTag(
      ctx,
      api,
      'Successful source fetch time',
      'now − age',
      1050,
      365,
      650,
      themeColors.yellow,
    );
    if (currentBeat === 1) {
      const age = resultComplete('invalid', 1)
        ? 360
        : interpolateScalar(ctx, api, 0, 300, Q('age', 1));
      drawLine(ctx, api, 300, 700, 1600, 700, themeColors.muted);
      [0, 150, 300, 360].forEach((v) => {
        const x = 300 + (v / 360) * 1300;
        drawLine(ctx, api, x, 685, x, 715, themeColors.muted);
        drawText(ctx, api, v + ' s', x, 770, 26, themeColors.muted, 'center');
      });
      const x = 300 + (age / 360) * 1300;
      api.rect(ctx, x - 7, 673, 14, 54, themeColors.yellow, themeColors.yellow, 2);
      if (resultComplete('inclusive', 1))
        drawText(ctx, api, 'age = 300: accepted', 960, 850, 30, themeColors.green, 'center');
      if (resultComplete('invalid', 1))
        drawText(
          ctx,
          api,
          'age = 360 or negative: denied',
          960,
          920,
          30,
          themeColors.pink,
          'center',
        );
    }
    if (currentBeat === 2) {
      const q = Q('end-to-end', 2),
        names = ['detect', 'queue', 'replica', 'derived copies'];
      names.forEach((v, i) => {
        const x = 170 + i * 420;
        drawRectangle(
          ctx,
          api,
          x,
          690,
          350,
          130,
          q * 4 >= i + 1 ? themeColors.yellow : themeColors.muted,
        );
        drawText(ctx, api, v, x + 175, 765, 28, themeColors.yellow, 'center');
      });
      drawText(
        ctx,
        api,
        'Cache TTL is only one component of revocation delay',
        960,
        935,
        29,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 0 && current !== 42)
      drawText(
        ctx,
        api,
        'Exact version mismatch → protected text held',
        960,
        760,
        33,
        themeColors.pink,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Age measures time since successful authoritative fetch. Retimestamping old data does not refresh its policy.',
    );
  });
}
export default {
  id: 'snapshot-clock',
  draw: drawSnapshotClock,
  cues: [
    'sr-snapshot-clock-0',
    'sr-snapshot-clock-mismatch',
    'sr-snapshot-clock-newer',
    'sr-snapshot-clock-1',
    'sr-snapshot-clock-age',
    'sr-snapshot-clock-inclusive',
    'sr-snapshot-clock-invalid',
    'sr-snapshot-clock-2',
    'sr-snapshot-clock-end-to-end',
  ],
};
