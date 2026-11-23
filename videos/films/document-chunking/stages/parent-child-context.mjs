import { cueProgress, parentRevealProgress } from '../arithmetic.mjs';
import { parentExpansion } from '../model.mjs';
import { card, footer, text, visualFocus } from '../defaults.mjs';
export function drawParentChildContext(ctx, scene, state, api) {
  const { C: themeColors, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      width: 3,
      progress,
      gap: 18,
      margin: 3,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const run = parentExpansion();
    const check = cueProgress(state, 'parent-child-context-beat-2-focus-1', parentRevealProgress(beat, progress2));
    const reveal = !run.admitted || beat === 0 ? 0 : beat > 1 || check === 1 ? 1 : 0;
    const child = visualFocus(
      ctx,
      api,
      'parent-child-context-object-search-child-within-15-minutes-25',
      () =>
        card(
          ctx,
          api,
          'Search child\n“within 15 minutes”',
          145,
          440,
          490,
          themeColors.cyan,
          150,
          28,
        ),
    );
    const gate = visualFocus(
      ctx,
      api,
      'parent-child-context-object-beat-0-check-parent-id-version-access-runbook-v3-a-26',
      () =>
        card(
          ctx,
          api,
          reveal ? 'runbook/v3 · authorized' : 'Check parent ID, version, access',
          735,
          440,
          500,
          themeColors.yellow,
          150,
          27,
        ),
    );
    const parentText =
      run.context
        ?.replace(' page on-call within ', '\nPage on-call within ')
        .replace(' with deploy ID.', '\nInclude deploy ID') ?? 'Parent unavailable';
    const parent = card(ctx, api, parentText, 1335, 410, 455, themeColors.green, 215, 25, reveal);
    route(child, gate, themeColors.cyan);
    if (reveal > 0) route(gate, parent, themeColors.green, reveal, reveal);
    text(
      ctx,
      api,
      reveal ? 'Returned section  /  incident-runbook-v3.pdf, page 7' : 'Source pointer  /  incident-runbook-v3.pdf, page 7',
      960,
      730,
      34,
      themeColors.ink,
      'center',
    );
    if (beat === 2) footer(ctx, api, 'Count one copy of each permitted parent in the final prompt.');
  }
}
export default {
  id: 'parent-child-context',
  draw: drawParentChildContext,
  cues: [
    'parent-child-context-beat-1-focus-1',
    'parent-child-context-beat-2-focus-1',
    'parent-child-context-beat-2-focus-2',
    'parent-child-context-beat-3-focus-1',
  ],
};
