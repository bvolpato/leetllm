import { drawArrow, drawFooter, drawRectangle, drawTag, drawText } from '../defaults.mjs';
export function drawDirectoryIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-directory-identity-' + name,
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
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-directory-identity-mechanism', () => {
    drawTag(ctx, api, 'Application A subject', 'sub: app-A-17', 170, 365, 690, themeColors.blue);
    drawTag(ctx, api, 'Application B subject', 'sub: app-B-91', 1050, 365, 690, themeColors.cyan);
    if (resultComplete('pair', 0) || currentBeat > 0) {
      drawRectangle(ctx, api, 420, 555, 1080, 100, themeColors.yellow);
      drawText(
        ctx,
        api,
        'Entra directory identity: tenant tid + object oid',
        960,
        618,
        30,
        themeColors.yellow,
        'center',
      );
      drawArrow(ctx, api, 510, 470, 740, 540, themeColors.blue);
      drawArrow(ctx, api, 1395, 470, 1190, 540, themeColors.cyan);
    }
    if (currentBeat === 1) {
      const over = resultComplete('overage', 1);
      drawTag(
        ctx,
        api,
        'Group claim',
        over ? 'overage indicator; no group list' : 'ordinary list',
        170,
        760,
        690,
        over ? themeColors.yellow : themeColors.blue,
      );
      if (resultComplete('resolve', 1))
        drawTag(
          ctx,
          api,
          'Trusted directory resolution',
          'resolve or deny dependent access',
          1050,
          760,
          690,
          themeColors.green,
        );
    }
    if (currentBeat === 2) {
      drawTag(
        ctx,
        api,
        'Unexpired signed token',
        'operations group at issuance',
        170,
        760,
        690,
        themeColors.green,
      );
      if (resultComplete('revoked', 2))
        drawTag(
          ctx,
          api,
          'Current directory state',
          'membership REVOKED',
          1050,
          760,
          690,
          themeColors.pink,
        );
    }
    drawFooter(
      ctx,
      api,
      'Provider-specific claims need a documented mapping. Missing groups never mean unrestricted access.',
    );
  });
}
export default {
  id: 'directory-identity',
  draw: drawDirectoryIdentity,
  cues: [
    'sr-directory-identity-0',
    'sr-directory-identity-pair',
    'sr-directory-identity-1',
    'sr-directory-identity-overage',
    'sr-directory-identity-resolve',
    'sr-directory-identity-2',
    'sr-directory-identity-revoked',
  ],
};
