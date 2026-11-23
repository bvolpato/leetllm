import {
  box,
  chapterCode,
  chapterLine,
  chapterText,
  heading,
  rectangle,
} from '../defaults.mjs';
export function drawDeferredDefinitions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-deferred-definitions-mechanism', () => {
    heading(ctx, api, 'Request inventory and initial model context have different owners');
    const names = ['get_release_status', 'search_release_policy'];
    box(
      ctx,
      api,
      'Full request catalog',
      names.map((n) => n + ' + full schema'),
      150,
      390,
      720,
      themeColors.blue,
      190,
    );
    rectangle(ctx, api, 1050, 390, 680, 450, themeColors.panel, themeColors.cyan, 2);
    chapterText(ctx, api, 'MODEL CONTEXT', 1070, 425, 28, themeColors.cyan);
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Measure request bytes and actual model-visible tokens separately',
        150,
        930,
        29,
        themeColors.yellow,
      );
      chapterText(
        ctx,
        api,
        'Selected-tool recall and complete tasks remain required',
        150,
        980,
        28,
        themeColors.cyan,
      );
    } else if (currentBeat === 1) {
      names.forEach((n, i) =>
        chapterCode(ctx, api, n + ' + description', 1070, 500 + i * 95, 23, themeColors.blue),
      );
      if (resultComplete('defer-schema', 1)) {
        chapterCode(ctx, api, 'selected parameter schema', 1070, 740, 26, themeColors.green);
        chapterLine(ctx, api, 900, 720, 1020, 720, themeColors.green, 3);
      }
    } else {
      chapterText(ctx, api, 'Claude search: regex or BM25', 1070, 505, 28, themeColors.yellow);
      if (resultComplete('defer-claude', 2))
        box(
          ctx,
          api,
          'Discovered full definition',
          'same request-catalog definition',
          1080,
          590,
          610,
          themeColors.green,
          130,
        );
      if (resultComplete('defer-proposal', 2))
        chapterText(ctx, api, 'tool_use → host checks → execution', 150, 940, 31, themeColors.cyan);
    }
  });
}
export default {
  id: 'deferred-definitions',
  draw: drawDeferredDefinitions,
  cues: [
    'tu-deferred-definitions-1',
    'tu-deferred-definitions-2',
    'tu-defer-schema',
    'tu-deferred-definitions-3',
    'tu-defer-claude',
    'tu-defer-proposal',
  ],
};
