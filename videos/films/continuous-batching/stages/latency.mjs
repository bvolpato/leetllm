import { drawEstablishedBatchingText } from '../defaults.mjs';
export function drawLatency(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {});
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 2) {
      api.text(ctx, 'Two arrivals at the same instant', 960, 275, 44, themeColors.ink, 'center');
      const x0 = 540;
      const x1 = 1550;
      const t = Math.min(1, (state.beatP ?? 0) * 3);
      const x = (seconds) => x0 + ((x1 - x0) * seconds) / 2;
      api.text(ctx, 'Reply received', 415, 456, 38, themeColors.cyan, 'right');
      api.line(ctx, x0, 446, x1, 446, themeColors.muted, 2);
      for (const time of [1, 1.2, 1.7, 1.9]) {
        api.circle(ctx, x(time), 446, 11, themeColors.cyan);
      }
      api.focus.target('latency-older-request-needs-2-blocks', () => {
        api.text(ctx, 'Still queued', 415, 670, 38, themeColors.yellow, 'right');
        api.line(ctx, x0, 661, x1, 661, themeColors.muted, 2);
        api.line(ctx, x0, 661, x(2 * t), 661, themeColors.yellow, 5);
        api.text(ctx, (2 * t).toFixed(1) + ' s waiting', x1, 745, 40, themeColors.yellow, 'right');
      });
      api.focus.target('latency-free-capacity-1-block', () => {
        if (state.cues?.['admission-limit']?.phase === 'before') return;
        api.text(
          ctx,
          'Offered: 2     First token received: 1',
          960,
          908,
          42,
          themeColors.ink,
          'center',
        );
      });
    } else {
      const arrivals = [1, 1.2, 1.7, 1.9];
      const words = ['A', 'seat', 'just', 'opened.'];
      const elapsed = currentBeat > 0 ? 2 : api.clamp((state.t ?? 0) - 0.7, 0, 2);
      const received = arrivals.filter((time) => time <= elapsed).length;
      const map = (time) => 265 + 700 * time;
      const reached = (id) => state.cues?.[id] && state.cues[id].phase !== 'before';
      api.focus.target('latency-client-arrival-and-received-token-times-seconds', () => {
        api.text(ctx, 'One reply', 265, 295, 39, themeColors.muted);
        api.text(ctx, words.slice(0, received).join(' ') || '…', 265, 417, 94, themeColors.ink);
      });
      api.line(ctx, map(0), 574, map(2), 574, themeColors.muted, 2);
      api.line(ctx, map(0), 574, map(elapsed), 574, themeColors.cyan, 5);
      api.focus.target('delivered-token-times', () => {
        for (const [i, time] of [0, ...arrivals.slice(0, received)].entries()) {
          api.circle(ctx, map(time), 574, 9, i === 0 ? themeColors.blue : themeColors.cyan);
          api.focus.target('latency-readout', () =>
            api.text(ctx, time.toFixed(1) + ' s', map(time), 643, 32, themeColors.muted, 'center'),
          );
          api.focus.target('latency-readout-2', () =>
            api.text(
              ctx,
              i === 0 ? 'sent' : words[i - 1],
              map(time),
              536,
              34,
              themeColors.ink,
              'center',
            ),
          );
        }
      });
      if (currentBeat > 0 || reached('first-delay')) {
        api.focus.target('latency-ttft-1-0-s', () =>
          api.text(
            ctx,
            'First token   ' + arrivals[0].toFixed(1) + ' s',
            305,
            825,
            46,
            themeColors.blue,
          ),
        );
      }
      if (reached('mean-gap')) {
        const mean = (arrivals.at(-1) - arrivals[0]) / (arrivals.length - 1);
        api.focus.target('latency-mean-gap-0-30-s', () =>
          api.text(ctx, 'Mean gap   ' + mean.toFixed(2) + ' s', 1120, 825, 46, themeColors.cyan),
        );
      }
      api.focus.reveal('long-gap', () => {
        const y = 670;
        const left = map(arrivals[1]);
        const right = map(arrivals[2]);
        api.line(ctx, left, y, right, y, themeColors.yellow, 4);
        for (const x of [left, right]) api.line(ctx, x, y - 10, x, y + 10, themeColors.yellow, 4);
        api.focus.target('latency-longest-shown-gap-0-50-s', () =>
          drawEstablishedBatchingText(
            ctx,
            api,
            'Longest shown gap: 0.50 s',
            960,
            940,
            33,
            themeColors.yellow,
            'center',
          ),
        );
      });
    }
  }
}
export default {
  id: 'latency',
  draw: drawLatency,
  cues: ['first-delay', 'token-gaps', 'long-gap', 'mean-gap', 'older-waiting', 'admission-limit'],
};
