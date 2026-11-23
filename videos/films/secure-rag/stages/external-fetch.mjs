import { drawFlow, drawFooter, drawNode, drawRectangle, drawTag, drawText } from '../defaults.mjs';
export function drawExternalFetch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-external-fetch-' + name,
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
  api.focus.target('sr-external-fetch-mechanism', () => {
    const q = Q('destination', 0),
      names = ['retrieved URL', 'DNS resolution', 'redirect target', 'trusted egress decision'];
    names.forEach((n, i) =>
      drawNode(
        ctx,
        api,
        n,
        170 + i * 420,
        355,
        350,
        i === 3 ? themeColors.yellow : themeColors.blue,
      ),
    );
    for (let i = 0; i < 3; i++)
      drawFlow(
        ctx,
        api,
        {
          x: 170 + i * 420,
          y: 355,
          w: 350,
          h: 78,
        },
        {
          x: 170 + (i + 1) * 420,
          y: 355,
          w: 350,
          h: 78,
        },
        clamp(q * 3 - i),
        themeColors.cyan,
      );
    drawTag(ctx, api, 'Attractive link', 'https://guide.example', 170, 600, 700, themeColors.blue);
    drawTag(
      ctx,
      api,
      'Resolved / redirected target',
      'private address',
      1050,
      600,
      680,
      themeColors.pink,
    );
    if (resultComplete('deny', 0))
      drawText(
        ctx,
        api,
        'Destination policy blocks private fetch',
        960,
        835,
        34,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 1 && resultComplete('html', 1)) {
      drawRectangle(ctx, api, 170, 850, 1560, 90, themeColors.yellow);
      drawText(
        ctx,
        api,
        'Returned HTML = observation data; no new authority',
        950,
        908,
        30,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'The actual resolved addresses, redirects, allowed domains and network boundary must satisfy the fetch policy.',
    );
  });
}
export default {
  id: 'external-fetch',
  draw: drawExternalFetch,
  cues: [
    'sr-external-fetch-0',
    'sr-external-fetch-destination',
    'sr-external-fetch-deny',
    'sr-external-fetch-1',
    'sr-external-fetch-html',
  ],
};
