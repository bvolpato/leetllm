import { clamp } from '../arithmetic.mjs';
import { CANDIDATE, STABLE, registry } from '../model.mjs';
import { arrow, bundleToken, chapterText, footer, pill } from '../defaults.mjs';
export function drawRegistry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-registry-' + k],
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('registry-mechanism', () => {
    const r = registry(),
      original = {
        ...r.aliases.get('production'),
      };
    let stale = false;
    if (currentBeat && api.focus.visible('promote-production'))
      r.move('production', CANDIDATE, original);
    if (currentBeat && api.focus.visible('restore-stable'))
      r.move('production', STABLE, r.aliases.get('production'));
    if (currentBeat && api.focus.visible('reject-stale-writer'))
      try {
        r.move('production', CANDIDATE, original);
      } catch {
        stale = true;
      }
    const a = r.aliases.get('production'),
      rejected = stale && api.focus.cue('reject-stale-writer')?.phase === 'after';
    chapterText(
      ctx,
      api,
      'Immutable records · mutable versioned pointers',
      960,
      290,
      36,
      themeColors.yellow,
    );
    api.focus.target('release-bundle', () => {
      bundleToken(ctx, api, 'STABLE', 1450, 435, themeColors.blue);
      bundleToken(ctx, api, 'CANDIDATE', 1450, 710, themeColors.cyan);
    });
    api.focus.target('production-pointer', () =>
      pill(
        ctx,
        api,
        'production → ' + (a.target === STABLE ? 'STABLE' : 'CANDIDATE') + ' · r' + a.revision,
        500,
        435,
        720,
        themeColors.blue,
      ),
    );
    api.focus.target('canary-pointer', () =>
      pill(ctx, api, 'canary → CANDIDATE · r1', 500, 710, 720, themeColors.yellow),
    );
    arrow(ctx, api, 890, 435, 1190, a.target === STABLE ? 435 : 710, themeColors.blue);
    arrow(ctx, api, 890, 710, 1190, 710, themeColors.yellow);
    if (currentBeat && B('expected')) {
      pill(
        ctx,
        api,
        'delayed writer expects STABLE / r1',
        960,
        875,
        1130,
        rejected ? themeColors.pink : themeColors.yellow,
      );
      api.focus.target('registry-verdict', () =>
        chapterText(
          ctx,
          api,
          rejected
            ? 'REJECT · current is STABLE / r3'
            : 'Checking delayed writer against current revision',
          960,
          975,
          35,
          rejected ? themeColors.pink : themeColors.muted,
        ),
      );
    } else
      api.focus.target('registry-verdict', () =>
        chapterText(
          ctx,
          api,
          'Registering a bundle does not move either pointer',
          960,
          975,
          31,
          themeColors.muted,
        ),
      );
    footer(ctx, api, 'Expected target AND revision · atomic and authorized in a real registry');
  });
}
export default {
  id: 'registry',
  draw: drawRegistry,
  cues: [
    'immutable-bundles',
    'alias-selection',
    'promote-production',
    'restore-stable',
    'reject-stale-writer',
    'mv-registry-expected',
  ],
};
