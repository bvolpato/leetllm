import { code, dag, focusProgress, footer, label, node } from '../defaults.mjs';
export function drawInstrument(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    cueProgress = (i) => q('instrument-' + i);
  api.focus.target('cau-instrument-mechanism', () => {
    const bypass = q('iv-latency-bypass') > 0,
      nodes = [
        node(ctx, api, 'z', 'randomized flag Z', 180, 350, themeColors.blue),
        node(ctx, api, 'u', 'hidden urgency U', 785, 270, themeColors.yellow),
        node(ctx, api, 'a', 'workflow A', 785, 650, themeColors.cyan),
        node(ctx, api, 'y', 'resolution Y', 1390, 650, themeColors.pink),
      ],
      edges = [
        {
          from: 'z',
          to: 'a',
          progress: cueProgress(0),
          color: themeColors.blue,
        },
        {
          from: 'u',
          to: 'a',
          progress: 1,
          color: themeColors.yellow,
        },
        {
          from: 'u',
          to: 'y',
          progress: 1,
          color: themeColors.yellow,
        },
        {
          from: 'a',
          to: 'y',
          progress: 1,
          color: themeColors.cyan,
        },
      ];
    if (bypass) {
      nodes.push(node(ctx, api, 'l', 'request latency', 1390, 350, themeColors.red));
      edges.push(
        {
          from: 'z',
          to: 'l',
          progress: q('iv-latency-bypass'),
          color: themeColors.red,
        },
        {
          from: 'l',
          to: 'y',
          progress: q('iv-latency-bypass'),
          color: themeColors.red,
        },
      );
    }
    dag(ctx, api, nodes, edges);
    label(
      ctx,
      api,
      bypass
        ? 'Z reaches Y through latency · exclusion fails'
        : 'Relevance + independence + no bypassing effect',
      960,
      865,
      bypass ? themeColors.red : themeColors.yellow,
      32,
    );
    if (currentBeat === 1) {
      code(ctx, api, 'Relevance: Z changes A', 450, 275, 30, themeColors.blue, 'center');
      code(
        ctx,
        api,
        'Exclusion: every Z → Y route passes through A',
        960,
        930,
        30,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'This is a hypothetical instrument. A randomized flag does not verify the exclusion restriction.',
    );
  });
}
export default {
  id: 'instrument',
  draw: drawInstrument,
  cues: ['cau-instrument-0', 'cau-instrument-1', 'cau-instrument-2', 'cau-iv-latency-bypass'],
};
